<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PurchaseReportController extends Controller
{
    /**
     * Get comprehensive purchase report
     */
    public function index(Request $request)
    {
        try {
            $dateFrom = $request->get('start_date');
            $dateTo = $request->get('end_date');
            $status = $request->get('status');
            $supplierId = $request->get('supplier_id');
            $createdBy = $request->get('created_by');

            // Base query for purchases (purchase requests)
            // Using correct relationships: items.unit instead of items.material.measurementUnit
            $query = Purchase::with([
                'supplier',
                'creator:id,name',
                'purchaseOrders' => function($q) {
                    $q->with([
                        'approver:id,name', 
                        'items.material',
                        'items.unit',
                        'grn' => function($gq) {
                            $gq->with([
                                'receiver:id,name', 
                                'items.material',
                                'items.unit'
                            ]);
                        }
                    ]);
                },
                'items.material',
                'items.unit'
            ]);

            // Apply filters
            if ($dateFrom) {
                $query->whereDate('date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->whereDate('date', '<=', $dateTo);
            }
            if ($status && $status !== 'all') {
                // Map frontend status to database status
                if ($status === 'completed') {
                    $query->whereHas('purchaseOrders.grn');
                } elseif ($status === 'approved') {
                    $query->whereHas('purchaseOrders', function($q) {
                        $q->whereDoesntHave('grn');
                    });
                } else {
                    $query->where('status', $status);
                }
            }
            if ($supplierId && $supplierId !== 'all') {
                $query->where('supplier_id', $supplierId);
            }
            if ($createdBy && $createdBy !== 'all') {
                $query->where('created_by', $createdBy);
            }

            $purchases = $query->orderBy('date', 'desc')->get();

            // Transform data for report
            $reportData = $purchases->map(function($purchase) {
                $po = $purchase->purchaseOrders->first();
                $grn = $po ? $po->grn : null;

                // Calculate days
                $daysToApproval = null;
                $daysToReceipt = null;
                $totalLeadTime = null;

                if ($po && $po->approved_at) {
                    $daysToApproval = Carbon::parse($purchase->date)
                        ->diffInDays(Carbon::parse($po->approved_at));
                }

                if ($grn && $grn->received_date) {
                    $daysToReceipt = $po && $po->approved_at
                        ? Carbon::parse($po->approved_at)->diffInDays(Carbon::parse($grn->received_date))
                        : Carbon::parse($purchase->date)->diffInDays(Carbon::parse($grn->received_date));
                    
                    $totalLeadTime = Carbon::parse($purchase->date)
                        ->diffInDays(Carbon::parse($grn->received_date));
                }

                // Aggregate item data - get unit from purchase item, not from material
                $items = $purchase->items->map(function($prItem) use ($po, $grn) {
                    $poItem = $po && $po->items ? $po->items->where('material_id', $prItem->material_id)->first() : null;
                    $grnItem = $grn && $grn->items ? $grn->items->where('material_id', $prItem->material_id)->first() : null;

                    $approvedQty = $poItem ? $poItem->quantity : 0;
                    $approvedPrice = $poItem ? $poItem->unit_price : 0;
                    $receivedQty = $grnItem ? $grnItem->quantity : 0;
                    $receivedPrice = $grnItem ? $grnItem->unit_price : 0;

                    // Unit comes from the purchase item, not from material
                    $unit = $prItem->unit ? $prItem->unit->name : 'unit';

                    return [
                        'material_name' => $prItem->material ? $prItem->material->name : 'Unknown',
                        'requested_quantity' => (float) $prItem->quantity,
                        'approved_quantity' => (float) $approvedQty,
                        'received_quantity' => (float) $receivedQty,
                        'requested_unit_price' => (float) $prItem->unit_price,
                        'approved_unit_price' => (float) $approvedPrice,
                        'received_unit_price' => (float) $receivedPrice,
                        'requested_amount' => (float) ($prItem->quantity * $prItem->unit_price),
                        'approved_amount' => (float) ($approvedQty * $approvedPrice),
                        'received_amount' => (float) ($receivedQty * $receivedPrice),
                        'quantity_variance' => (float) ($receivedQty - $prItem->quantity),
                        'cost_variance' => (float) (($receivedQty * $receivedPrice) - ($prItem->quantity * $prItem->unit_price)),
                        'unit' => $unit,
                    ];
                });

                // Determine status
                $reportStatus = 'pending';
                if ($grn) {
                    $reportStatus = 'completed';
                } elseif ($po) {
                    $reportStatus = 'approved';
                } elseif ($purchase->status === 'cancelled') {
                    $reportStatus = 'cancelled';
                }

                return [
                    'id' => $purchase->id,
                    'request_number' => $purchase->purchase_no,
                    'request_date' => $purchase->date,
                    'po_number' => $po?->po_number,
                    'po_date' => $po?->order_date,
                    'grn_number' => $grn?->grn_number,
                    'grn_date' => $grn?->received_date,
                    'supplier_name' => $purchase->supplier ? $purchase->supplier->name : 'Unknown',
                    'created_by_name' => $purchase->creator ? $purchase->creator->name : 'N/A',
                    'approved_by_name' => $po && $po->approver ? $po->approver->name : null,
                    'received_by_name' => $grn && $grn->receiver ? $grn->receiver->name : null,
                    'status' => $reportStatus,
                    'requested_amount' => (float) $purchase->total_amount,
                    'approved_amount' => (float) ($po?->total_amount ?? 0),
                    'received_amount' => (float) ($grn?->total_amount ?? 0),
                    'days_to_approval' => $daysToApproval,
                    'days_to_receipt' => $daysToReceipt,
                    'total_lead_time' => $totalLeadTime,
                    'items' => $items,
                ];
            });

            // Calculate summary statistics
            $completedPurchases = $reportData->where('status', 'completed');
            
            $summary = [
                'total_requests' => $reportData->count(),
                'total_requested_amount' => round($reportData->sum('requested_amount'), 2),
                'total_approved_amount' => round($reportData->sum('approved_amount'), 2),
                'total_received_amount' => round($reportData->sum('received_amount'), 2),
                'average_approval_days' => round($reportData->filter(fn($p) => $p['days_to_approval'] !== null)->avg('days_to_approval') ?? 0, 1),
                'average_receipt_days' => round($reportData->filter(fn($p) => $p['days_to_receipt'] !== null)->avg('days_to_receipt') ?? 0, 1),
                'average_total_lead_time' => round($reportData->filter(fn($p) => $p['total_lead_time'] !== null)->avg('total_lead_time') ?? 0, 1),
                'pending_requests' => $reportData->where('status', 'pending')->count(),
                'approved_requests' => $reportData->where('status', 'approved')->count(),
                'completed_requests' => $completedPurchases->count(),
            ];

            return response()->json([
                'purchases' => $reportData->values(),
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'purchases' => [],
                'summary' => [
                    'total_requests' => 0,
                    'total_requested_amount' => 0,
                    'total_approved_amount' => 0,
                    'total_received_amount' => 0,
                    'average_approval_days' => 0,
                    'average_receipt_days' => 0,
                    'average_total_lead_time' => 0,
                    'pending_requests' => 0,
                    'approved_requests' => 0,
                    'completed_requests' => 0,
                ],
            ], 500);
        }
    }

    /**
     * Get summary by supplier
     */
    public function bySupplier(Request $request)
    {
        try {
            $dateFrom = $request->get('start_date');
            $dateTo = $request->get('end_date');

            $query = Purchase::with(['supplier'])
                ->select('supplier_id')
                ->selectRaw('COUNT(*) as total_orders')
                ->selectRaw('SUM(total_amount) as total_amount')
                ->groupBy('supplier_id');

            if ($dateFrom) {
                $query->whereDate('date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->whereDate('date', '<=', $dateTo);
            }

            $data = $query->get()->map(function($item) {
                return [
                    'supplier_id' => $item->supplier_id,
                    'supplier_name' => $item->supplier ? $item->supplier->name : 'Unknown',
                    'total_orders' => (int) $item->total_orders,
                    'total_amount' => (float) $item->total_amount,
                    'average_approval_days' => 0, // Simplified for now
                ];
            });

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([], 500);
        }
    }

    /**
     * Export purchase report to CSV
     */
    public function export(Request $request)
    {
        try {
            // Reuse the index logic to get data
            $reportResponse = $this->index($request);
            $reportData = json_decode($reportResponse->getContent(), true);
            $purchases = $reportData['purchases'] ?? [];

            $filename = 'purchase_report_' . now()->format('Y-m-d_His') . '.csv';
            
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"$filename\"",
            ];

            $callback = function() use ($purchases) {
                $file = fopen('php://output', 'w');
                
                // Headers
                fputcsv($file, [
                    'Request Number',
                    'Request Date',
                    'Supplier',
                    'Created By',
                    'PO Number',
                    'PO Date',
                    'Approved By',
                    'GRN Number',
                    'GRN Date',
                    'Received By',
                    'Status',
                    'Requested Amount',
                    'Approved Amount',
                    'Received Amount',
                    'Amount Variance',
                    'Days to Approval',
                    'Days to Receipt',
                    'Total Lead Time',
                ]);

                // Data rows
                foreach ($purchases as $purchase) {
                    fputcsv($file, [
                        $purchase['request_number'],
                        $purchase['request_date'],
                        $purchase['supplier_name'],
                        $purchase['created_by_name'],
                        $purchase['po_number'] ?? 'N/A',
                        $purchase['po_date'] ?? 'N/A',
                        $purchase['approved_by_name'] ?? 'N/A',
                        $purchase['grn_number'] ?? 'N/A',
                        $purchase['grn_date'] ?? 'N/A',
                        $purchase['received_by_name'] ?? 'N/A',
                        ucfirst($purchase['status']),
                        $purchase['requested_amount'],
                        $purchase['approved_amount'],
                        $purchase['received_amount'],
                        $purchase['received_amount'] - $purchase['requested_amount'],
                        $purchase['days_to_approval'] ?? 'N/A',
                        $purchase['days_to_receipt'] ?? 'N/A',
                        $purchase['total_lead_time'] ?? 'N/A',
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
