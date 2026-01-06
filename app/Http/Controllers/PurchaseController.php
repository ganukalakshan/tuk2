<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Material;
use App\Models\Supplier;
use App\Models\MeasurementUnit;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchase requests.
     */
    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = Purchase::with(['supplier', 'createdBy', 'items.material', 'items.unit']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('purchase_no', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $purchases = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $purchases
        ]);
    }

    /**
     * Store a newly created purchase request.
     */
    public function store(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Only admin and manager can create purchase requests
        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized. Only admin and manager can create purchase requests.'
            ], 403);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.material_id' => 'required|exists:materials,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_id' => 'required|exists:measurement_units,id',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            // Generate unique purchase number
            $lastPurchase = Purchase::orderBy('id', 'desc')->first();
            $nextNumber = $lastPurchase ? (intval(substr($lastPurchase->purchase_no, 3)) + 1) : 1;
            $purchaseNo = 'PR-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Calculate total amount
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            // Create purchase request
            $purchase = Purchase::create([
                'purchase_no' => $purchaseNo,
                'supplier_id' => $validated['supplier_id'],
                'date' => $validated['date'],
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'created_by' => $user->id,
            ]);

            // Create purchase items
            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'material_id' => $item['material_id'],
                    'quantity' => $item['quantity'],
                    'unit_id' => $item['unit_id'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                    'received_qty' => 0,
                ]);
            }

            DB::commit();

            // Load relationships
            $purchase->load(['supplier', 'createdBy', 'items.material', 'items.unit']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase request created successfully',
                'data' => $purchase
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified purchase request.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $purchase->load(['supplier', 'createdBy', 'items.material', 'items.unit']);

        return response()->json([
            'success' => true,
            'data' => $purchase
        ]);
    }

    /**
     * Approve a purchase request (Admin only) and create Purchase Order.
     */
    public function approve(Request $request, Purchase $purchase): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Only admin can approve purchase requests
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized. Only admin can approve purchase requests.'
            ], 403);
        }

        if ($purchase->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending purchase requests can be approved.'
            ], 400);
        }

        // Validate approved quantities
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_items,id',
            'items.*.approved_quantity' => 'required|numeric|min:0.001',
        ]);

        DB::beginTransaction();

        try {
            // Calculate new total based on approved quantities
            $newTotalAmount = 0;
            
            // Update purchase items with approved quantities
            foreach ($validated['items'] as $itemData) {
                $purchaseItem = PurchaseItem::find($itemData['id']);
                
                // Verify item belongs to this purchase
                if ($purchaseItem->purchase_id !== $purchase->id) {
                    throw new \Exception('Invalid purchase item');
                }
                
                $approvedQty = $itemData['approved_quantity'];
                $newTotal = $approvedQty * $purchaseItem->unit_price;
                
                $purchaseItem->update([
                    'approved_quantity' => $approvedQty,
                    'total' => $newTotal,
                ]);
                
                $newTotalAmount += $newTotal;
            }

            // Update purchase request status and total
            $purchase->update([
                'status' => 'approved',
                'received_at' => now(),
                'total_amount' => $newTotalAmount,
            ]);

            // Generate unique PO number
            $lastPO = PurchaseOrder::orderBy('id', 'desc')->first();
            $nextNumber = $lastPO ? (intval(substr($lastPO->po_number, 3)) + 1) : 1;
            $poNumber = 'PO-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Create Purchase Order from approved Purchase Request with approved quantities
            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $poNumber,
                'purchase_request_id' => $purchase->id,
                'supplier_id' => $purchase->supplier_id,
                'order_date' => now()->toDateString(),
                'total_amount' => $newTotalAmount,
                'status' => 'pending',
                'created_by' => $user->id,
            ]);

            // Copy items from Purchase Request to Purchase Order using approved quantities
            foreach ($purchase->fresh()->items as $item) {
                $quantity = $item->approved_quantity ?? $item->quantity;
                
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'material_id' => $item->material_id,
                    'quantity' => $quantity,
                    'unit_id' => $item->unit_id,
                    'unit_price' => $item->unit_price,
                    'total' => $quantity * $item->unit_price,
                ]);
            }

            DB::commit();

            $purchase->load(['supplier', 'createdBy', 'items.material', 'items.unit']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase request approved and Purchase Order created successfully',
                'data' => $purchase,
                'purchase_order' => $purchaseOrder->load(['supplier', 'createdBy', 'items.material', 'items.unit'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a purchase request.
     */
    public function cancel(Purchase $purchase): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Only admin can cancel purchase requests
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized. Only admin can cancel purchase requests.'
            ], 403);
        }

        if ($purchase->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending purchase requests can be cancelled.'
            ], 400);
        }

        $purchase->update([
            'status' => 'cancelled',
        ]);

        $purchase->load(['supplier', 'createdBy', 'items.material', 'items.unit']);

        return response()->json([
            'success' => true,
            'message' => 'Purchase request cancelled successfully',
            'data' => $purchase
        ]);
    }

    /**
     * Search materials for autocomplete.
     */
    public function searchMaterials(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $search = $request->get('q', '');
        
        $materials = Material::where('is_active', true)
            ->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'code', 'name', 'category']);

        return response()->json([
            'success' => true,
            'data' => $materials
        ]);
    }

    /**
     * Get dropdown data for creating purchase request.
     */
    public function getDropdownData(): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $suppliers = Supplier::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        $units = MeasurementUnit::orderBy('unit_name')
            ->get(['id', 'unit_name', 'unit_symbol', 'conversion_to_base', 'is_base']);

        return response()->json([
            'success' => true,
            'data' => [
                'suppliers' => $suppliers,
                'units' => $units,
            ]
        ]);
    }

    /**
     * Delete a purchase request (Admin only).
     */
    public function destroy(Purchase $purchase): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Only admin can delete purchase requests
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false, 
                'message' => 'Unauthorized. Only admin can delete purchase requests.'
            ], 403);
        }

        if ($purchase->status === 'received') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete received purchase requests.'
            ], 400);
        }

        $purchase->delete();

        return response()->json([
            'success' => true,
            'message' => 'Purchase request deleted successfully'
        ]);
    }
}
