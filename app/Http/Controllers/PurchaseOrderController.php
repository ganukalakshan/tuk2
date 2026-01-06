<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Grn;
use App\Models\GrnItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders.
     */
    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = PurchaseOrder::with(['purchaseRequest', 'supplier', 'createdBy', 'approvedBy', 'items.material', 'items.unit']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $purchaseOrders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $purchaseOrders
        ]);
    }

    /**
     * Display the specified purchase order.
     */
    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $purchaseOrder->load(['purchaseRequest', 'supplier', 'createdBy', 'approvedBy', 'items.material', 'items.unit', 'grn']);

        return response()->json([
            'success' => true,
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Approve a purchase order (Admin or Manager) and create GRN.
     */
    public function approve(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Only admin and manager can approve purchase orders
        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized. Only admin and manager can approve purchase orders.'
            ], 403);
        }

        if ($purchaseOrder->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending purchase orders can be approved.'
            ], 400);
        }

        // Validate items if provided (for admin verification)
        $validated = [];
        if ($request->has('items')) {
            $validated = $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|exists:purchase_order_items,id',
                'items.*.received_quantity' => 'required|numeric|min:0.001',
                'items.*.received_unit_price' => 'required|numeric|min:0',
            ]);
        }

        DB::beginTransaction();

        try {
            $newTotalAmount = 0;
            
            // Update PO items with received quantities if provided
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $itemData) {
                    $poItem = \App\Models\PurchaseOrderItem::find($itemData['id']);
                    
                    // Verify item belongs to this PO
                    if ($poItem->purchase_order_id !== $purchaseOrder->id) {
                        throw new \Exception('Invalid purchase order item');
                    }
                    
                    $receivedQty = $itemData['received_quantity'];
                    $receivedPrice = $itemData['received_unit_price'];
                    $newTotal = $receivedQty * $receivedPrice;
                    
                    $poItem->update([
                        'received_quantity' => $receivedQty,
                        'received_unit_price' => $receivedPrice,
                        'total' => $newTotal,
                    ]);
                    
                    $newTotalAmount += $newTotal;
                }
            } else {
                // No items provided, use original quantities (manager approval without verification)
                foreach ($purchaseOrder->items as $item) {
                    $newTotalAmount += $item->total;
                }
            }

            // Update purchase order status and total
            $purchaseOrder->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'total_amount' => $newTotalAmount,
            ]);

            // Generate unique GRN number
            $lastGRN = Grn::orderBy('id', 'desc')->first();
            $nextNumber = $lastGRN ? (intval(substr($lastGRN->grn_number, 4)) + 1) : 1;
            $grnNumber = 'GRN-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Create GRN from approved Purchase Order with received quantities
            $grn = Grn::create([
                'grn_number' => $grnNumber,
                'purchase_order_id' => $purchaseOrder->id,
                'supplier_id' => $purchaseOrder->supplier_id,
                'received_date' => now()->toDateString(),
                'total_amount' => $newTotalAmount,
                'received_by' => $user->id,
                'notes' => 'Automatically generated from PO: ' . $purchaseOrder->po_number,
            ]);

            // Copy items from Purchase Order to GRN using received quantities
            foreach ($purchaseOrder->fresh()->items as $item) {
                $quantity = $item->received_quantity ?? $item->quantity;
                $unitPrice = $item->received_unit_price ?? $item->unit_price;
                
                // Generate unique batch number per material across all GRNs
                $latestBatchNumber = GrnItem::where('material_id', $item->material_id)
                    ->whereNotNull('batch_number')
                    ->orderByRaw('CAST(SUBSTRING(batch_number, 6) AS UNSIGNED) DESC')
                    ->value('batch_number');
                
                $nextBatchNum = 1;
                if ($latestBatchNumber && preg_match('/batch(\d+)/', $latestBatchNumber, $matches)) {
                    $nextBatchNum = intval($matches[1]) + 1;
                }
                $batchNumber = 'batch' . str_pad($nextBatchNum, 3, '0', STR_PAD_LEFT);
                
                GrnItem::create([
                    'grn_id' => $grn->id,
                    'batch_number' => $batchNumber,
                    'material_id' => $item->material_id,
                    'quantity' => $quantity,
                    'unit_id' => $item->unit_id,
                    'unit_price' => $unitPrice,
                    'total' => $quantity * $unitPrice,
                ]);
            }

            DB::commit();

            $purchaseOrder->load(['purchaseRequest', 'supplier', 'createdBy', 'approvedBy', 'items.material', 'items.unit', 'grn']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase Order approved and GRN created successfully',
                'data' => $purchaseOrder,
                'grn' => $grn->load(['supplier', 'receivedBy', 'items.material', 'items.unit'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve purchase order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a purchase order (Admin only).
     */
    public function cancel(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Only admin can cancel purchase orders
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized. Only admin can cancel purchase orders.'
            ], 403);
        }

        if ($purchaseOrder->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending purchase orders can be cancelled.'
            ], 400);
        }

        $purchaseOrder->update([
            'status' => 'cancelled',
        ]);

        $purchaseOrder->load(['purchaseRequest', 'supplier', 'createdBy', 'approvedBy', 'items.material', 'items.unit']);

        return response()->json([
            'success' => true,
            'message' => 'Purchase Order cancelled successfully',
            'data' => $purchaseOrder
        ]);
    }
}
