<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Department;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferReportController extends Controller
{
    /**
     * Get stock report for all stores with aggregated quantities per material
     */
    public function index(Request $request)
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $report = [];

        // Add GRN Store as the first store in the report
        $grnQuery = \App\Models\GrnItem::with(['material', 'unit', 'grn'])
            ->where('quantity', '>', 0);

        // Apply date filter if provided
        if ($dateFrom) {
            $grnQuery->whereHas('grn', function($q) use ($dateFrom) {
                $q->whereDate('received_date', '>=', $dateFrom);
            });
        }
        if ($dateTo) {
            $grnQuery->whereHas('grn', function($q) use ($dateTo) {
                $q->whereDate('received_date', '<=', $dateTo);
            });
        }

        // Group GRN items by material
        $grnMaterials = $grnQuery->get()
            ->groupBy('material_id')
            ->map(function ($items, $materialId) {
                $firstItem = $items->first();
                $material = $firstItem->material;

                // Sum all quantities
                $totalQuantity = $items->sum('quantity');
                $totalCost = $items->sum(function ($item) {
                    return $item->quantity * ($item->unit_price ?? 0);
                });

                // Get batch details from GRN items
                $batches = $items->map(function ($item) {
                    return [
                        'batch_number' => $item->batch_number ?? 'GRN-' . $item->grn_id,
                        'quantity' => (float) $item->quantity,
                        'original_quantity' => (float) $item->quantity,
                        'cost_per_unit' => (float) ($item->unit_price ?? 0),
                        'expiry_date' => null,
                        'transferred_at' => $item->grn?->received_date?->format('Y-m-d H:i:s'),
                    ];
                })->values()->toArray();

                return [
                    'material_id' => $materialId,
                    'material_code' => $material?->code ?? 'N/A',
                    'material_name' => $material?->name ?? 'Unknown',
                    'total_quantity' => round($totalQuantity, 3),
                    'total_original_quantity' => round($totalQuantity, 3),
                    'unit' => $firstItem->unit?->unit_symbol ?? '',
                    'unit_name' => $firstItem->unit?->unit_name ?? '',
                    'total_cost' => round($totalCost, 2),
                    'batch_count' => $items->count(),
                    'batches' => $batches,
                ];
            })->values()->toArray();

        // Calculate GRN store totals
        $grnStoreTotalCost = collect($grnMaterials)->sum('total_cost');
        $grnStoreItemCount = count($grnMaterials);

        // Add GRN Store to report
        $report[] = [
            'store_id' => 0, // Special ID for GRN Store
            'store_name' => 'GRN Store',
            'store_key' => 'grn_store',
            'materials' => $grnMaterials,
            'summary' => [
                'total_materials' => $grnStoreItemCount,
                'total_cost' => round($grnStoreTotalCost, 2),
            ],
        ];

        // Get all departments
        $departments = Department::where('is_active', true)->get();

        foreach ($departments as $department) {
            $query = Store::with(['material'])
                ->where('store_id', $department->store_id)
                ->where('remaining_quantity', '>', 0);

            // Apply date filter if provided
            if ($dateFrom) {
                $query->whereDate('transferred_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->whereDate('transferred_at', '<=', $dateTo);
            }

            // Group by material and aggregate quantities
            $materials = $query->get()
                ->groupBy('material_id')
                ->map(function ($items, $materialId) {
                    $firstItem = $items->first();
                    $material = $firstItem->material;

                    // Sum all quantities (already in same unit for each material)
                    $totalQuantity = $items->sum('remaining_quantity');
                    $totalOriginalQuantity = $items->sum('original_quantity');
                    $totalCost = $items->sum(function ($item) {
                        return $item->remaining_quantity * ($item->cost_per_unit ?? 0);
                    });

                    // Get batch details
                    $batches = $items->map(function ($item) {
                        return [
                            'batch_number' => $item->batch_number,
                            'quantity' => (float) $item->remaining_quantity,
                            'original_quantity' => (float) $item->original_quantity,
                            'cost_per_unit' => (float) ($item->cost_per_unit ?? 0),
                            'expiry_date' => $item->expiry_date?->format('Y-m-d'),
                            'transferred_at' => $item->transferred_at?->format('Y-m-d H:i:s'),
                        ];
                    })->values()->toArray();

                    return [
                        'material_id' => $materialId,
                        'material_code' => $material?->code ?? 'N/A',
                        'material_name' => $material?->name ?? $firstItem->material_name,
                        'total_quantity' => round($totalQuantity, 3),
                        'total_original_quantity' => round($totalOriginalQuantity, 3),
                        'unit' => $firstItem->unit ?? '',
                        'unit_name' => $firstItem->unit ?? '',
                        'total_cost' => round($totalCost, 2),
                        'batch_count' => $items->count(),
                        'batches' => $batches,
                    ];
                })->values()->toArray();

            // Calculate store totals
            $storeTotalCost = collect($materials)->sum('total_cost');
            $storeItemCount = count($materials);

            $report[] = [
                'store_id' => $department->store_id,
                'store_name' => $department->name,
                'store_key' => $department->key,
                'materials' => $materials,
                'summary' => [
                    'total_materials' => $storeItemCount,
                    'total_cost' => round($storeTotalCost, 2),
                ],
            ];
        }

        // Calculate grand totals (including GRN Store)
        $grandTotalCost = collect($report)->sum('summary.total_cost');
        $grandTotalMaterials = collect($report)->sum('summary.total_materials');

        return response()->json([
            'success' => true,
            'data' => [
                'stores' => $report,
                'grand_summary' => [
                    'total_stores' => count($report),
                    'total_materials' => $grandTotalMaterials,
                    'total_cost' => round($grandTotalCost, 2),
                ],
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ],
        ]);
    }

    /**
     * Get stock report for a specific store
     */
    public function show($storeId, Request $request)
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $department = Department::where('store_id', $storeId)->first();

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found',
            ], 404);
        }

        $query = Store::with(['material'])
            ->where('store_id', $storeId)
            ->where('remaining_quantity', '>', 0);

        if ($dateFrom) {
            $query->whereDate('transferred_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('transferred_at', '<=', $dateTo);
        }

        $materials = $query->get()
            ->groupBy('material_id')
            ->map(function ($items, $materialId) {
                $firstItem = $items->first();
                $material = $firstItem->material;

                $totalQuantity = $items->sum('remaining_quantity');
                $totalOriginalQuantity = $items->sum('original_quantity');
                $totalCost = $items->sum(function ($item) {
                    return $item->remaining_quantity * ($item->cost_per_unit ?? 0);
                });

                $batches = $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'batch_number' => $item->batch_number,
                        'quantity' => (float) $item->remaining_quantity,
                        'original_quantity' => (float) $item->original_quantity,
                        'cost_per_unit' => (float) ($item->cost_per_unit ?? 0),
                        'expiry_date' => $item->expiry_date?->format('Y-m-d'),
                        'transferred_at' => $item->transferred_at?->format('Y-m-d H:i:s'),
                        'grn_id' => $item->grn_id,
                    ];
                })->values()->toArray();

                return [
                    'material_id' => $materialId,
                    'material_code' => $material?->code ?? 'N/A',
                    'material_name' => $material?->name ?? $firstItem->material_name,
                    'total_quantity' => round($totalQuantity, 3),
                    'total_original_quantity' => round($totalOriginalQuantity, 3),
                    'unit' => $firstItem->unit ?? '',
                    'unit_name' => $firstItem->unit ?? '',
                    'total_cost' => round($totalCost, 2),
                    'batch_count' => $items->count(),
                    'batches' => $batches,
                ];
            })->values()->toArray();

        $storeTotalCost = collect($materials)->sum('total_cost');

        return response()->json([
            'success' => true,
            'data' => [
                'store_id' => $department->store_id,
                'store_name' => $department->name,
                'store_key' => $department->key,
                'materials' => $materials,
                'summary' => [
                    'total_materials' => count($materials),
                    'total_cost' => round($storeTotalCost, 2),
                ],
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ],
        ]);
    }

    /**
     * Get comparative stock report across all stores for a specific material
     */
    public function materialComparison($materialId)
    {
        $material = Material::find($materialId);

        if (!$material) {
            return response()->json([
                'success' => false,
                'message' => 'Material not found',
            ], 404);
        }

        $departments = Department::where('is_active', true)->get();
        $comparison = [];

        foreach ($departments as $department) {
            $storeItems = Store::where('store_id', $department->store_id)
                ->where('material_id', $materialId)
                ->where('remaining_quantity', '>', 0)
                ->get();

            $totalQuantity = $storeItems->sum('remaining_quantity');
            $totalCost = $storeItems->sum(function ($item) {
                return $item->remaining_quantity * ($item->cost_per_unit ?? 0);
            });

            // Get unit from first item
            $unit = $storeItems->first()?->unit ?? '';

            $comparison[] = [
                'store_id' => $department->store_id,
                'store_name' => $department->name,
                'quantity' => round($totalQuantity, 3),
                'unit' => $unit,
                'cost' => round($totalCost, 2),
                'batch_count' => $storeItems->count(),
            ];
        }

        $grandTotalQuantity = collect($comparison)->sum('quantity');
        $grandTotalCost = collect($comparison)->sum('cost');

        return response()->json([
            'success' => true,
            'data' => [
                'material' => [
                    'id' => $material->id,
                    'code' => $material->code,
                    'name' => $material->name,
                ],
                'stores' => $comparison,
                'totals' => [
                    'quantity' => round($grandTotalQuantity, 3),
                    'cost' => round($grandTotalCost, 2),
                ],
            ],
        ]);
    }

    /**
     * Export stock report as CSV
     */
    public function export(Request $request)
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $departments = Department::where('is_active', true)->get();
        $csvData = [];
        
        // Headers
        $csvData[] = ['Store', 'Material Code', 'Material Name', 'Quantity', 'Unit', 'Total Cost', 'Batch Count'];

        foreach ($departments as $department) {
            $query = Store::with(['material'])
                ->where('store_id', $department->store_id)
                ->where('remaining_quantity', '>', 0);

            if ($dateFrom) {
                $query->whereDate('transferred_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->whereDate('transferred_at', '<=', $dateTo);
            }

            $materials = $query->get()
                ->groupBy('material_id')
                ->map(function ($items, $materialId) use ($department) {
                    $firstItem = $items->first();
                    $material = $firstItem->material;

                    $totalQuantity = $items->sum('remaining_quantity');
                    $totalCost = $items->sum(function ($item) {
                        return $item->remaining_quantity * ($item->cost_per_unit ?? 0);
                    });

                    return [
                        $department->name,
                        $material?->code ?? 'N/A',
                        $material?->name ?? $firstItem->material_name,
                        round($totalQuantity, 3),
                        $firstItem->unit ?? '',
                        round($totalCost, 2),
                        $items->count(),
                    ];
                });

            foreach ($materials as $row) {
                $csvData[] = $row;
            }
        }

        $filename = 'stock_transfer_report_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $callback = function () use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
