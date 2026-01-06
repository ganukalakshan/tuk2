<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Material;
use App\Models\StoreConsumption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryReportController extends Controller
{
    /**
     * Get comprehensive inventory overview
     */
    public function index(Request $request)
    {
        try {
            $category = $request->get('category');
            $storeId = $request->get('store_id');
            $status = $request->get('status'); // all, low, out, expiring
            $search = $request->get('search');

            // Get current stock levels grouped by material and store
            $query = Store::select(
                'material_id',
                'material_name',
                'store_id',
                DB::raw('SUM(remaining_quantity) as total_qty'),
                DB::raw('AVG(cost_per_unit) as avg_cost'),
                DB::raw('SUM(remaining_quantity * cost_per_unit) as total_value'),
                DB::raw('MIN(expiry_date) as nearest_expiry'),
                'unit'
            )
            ->where('remaining_quantity', '>', 0)
            ->with('material')
            ->groupBy('material_id', 'store_id', 'material_name', 'unit');

            // Apply filters
            if ($category && $category !== 'all') {
                $query->whereHas('material', function($q) use ($category) {
                    $q->where('category', $category);
                });
            }

            if ($storeId && $storeId !== 'all') {
                $query->where('store_id', $storeId);
            }

            if ($search) {
                $query->where('material_name', 'like', "%{$search}%");
            }

            $stockData = $query->get();

            // Group by material to show store distribution
            $materialSummary = $stockData->groupBy('material_id')->map(function($stores, $materialId) {
                $material = $stores->first();
                $storeBreakdown = [
                    'hot_kitchen' => 0,
                    'bakery' => 0,
                    'pastry' => 0,
                    'beverage' => 0,
                ];

                foreach ($stores as $store) {
                    $storeName = Store::getStoreName($store->store_id);
                    if ($storeName && isset($storeBreakdown[$storeName])) {
                        $storeBreakdown[$storeName] = (float) $store->total_qty;
                    }
                }

                $totalQty = array_sum($storeBreakdown);
                $avgCost = (float) $stores->avg('avg_cost');
                $totalValue = $totalQty * $avgCost;

                // Determine status
                $nearestExpiry = $stores->min('nearest_expiry');
                $status = 'normal';
                
                if ($nearestExpiry && Carbon::parse($nearestExpiry)->diffInDays(now()) <= 7) {
                    $status = 'expiring';
                } elseif ($totalQty <= 10) { // Simple low stock threshold
                    $status = 'low';
                } elseif ($totalQty == 0) {
                    $status = 'out';
                }

                return [
                    'material_id' => $materialId,
                    'material_name' => $material->material_name,
                    'category' => $material->material?->category ?? 'Uncategorized',
                    'unit' => $material->unit,
                    'hot_kitchen_qty' => $storeBreakdown['hot_kitchen'],
                    'bakery_qty' => $storeBreakdown['bakery'],
                    'pastry_qty' => $storeBreakdown['pastry'],
                    'beverage_qty' => $storeBreakdown['beverage'],
                    'total_qty' => $totalQty,
                    'avg_cost' => $avgCost,
                    'total_value' => $totalValue,
                    'nearest_expiry' => $nearestExpiry,
                    'status' => $status,
                ];
            })->values();

            // Apply status filter after grouping
            if ($status && $status !== 'all') {
                $materialSummary = $materialSummary->filter(function($item) use ($status) {
                    return $item['status'] === $status;
                })->values();
            }

            // Calculate summary statistics
            $totalValue = $materialSummary->sum('total_value');
            $totalMaterials = $materialSummary->count();
            $lowStockCount = $materialSummary->where('status', 'low')->count();
            $expiringCount = $materialSummary->where('status', 'expiring')->count();

            return response()->json([
                'summary' => [
                    'total_value' => round($totalValue, 2),
                    'total_materials' => $totalMaterials,
                    'low_stock_count' => $lowStockCount,
                    'expiring_count' => $expiringCount,
                ],
                'materials' => $materialSummary,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'summary' => [
                    'total_value' => 0,
                    'total_materials' => 0,
                    'low_stock_count' => 0,
                    'expiring_count' => 0,
                ],
                'materials' => [],
            ], 500);
        }
    }

    /**
     * Get inventory valuation breakdown
     */
    public function valuation(Request $request)
    {
        try {
            // By Store
            $byStore = Store::select(
                'store_id',
                DB::raw('COUNT(DISTINCT material_id) as material_count'),
                DB::raw('SUM(remaining_quantity * cost_per_unit) as total_value')
            )
            ->where('remaining_quantity', '>', 0)
            ->groupBy('store_id')
            ->get()
            ->map(function($item) {
                return [
                    'store_id' => $item->store_id,
                    'store_name' => Store::getAllStoreTypes()[$item->store_id] ?? 'Unknown',
                    'material_count' => (int) $item->material_count,
                    'total_value' => (float) $item->total_value,
                ];
            });

            // By Category
            $byCategory = Store::select(
                'materials.category',
                DB::raw('COUNT(DISTINCT stores.material_id) as material_count'),
                DB::raw('SUM(stores.remaining_quantity * stores.cost_per_unit) as total_value')
            )
            ->join('materials', 'stores.material_id', '=', 'materials.id')
            ->where('stores.remaining_quantity', '>', 0)
            ->groupBy('materials.category')
            ->get()
            ->map(function($item) {
                return [
                    'category' => $item->category ?? 'Uncategorized',
                    'material_count' => (int) $item->material_count,
                    'total_value' => (float) $item->total_value,
                ];
            });

            return response()->json([
                'by_store' => $byStore,
                'by_category' => $byCategory,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'by_store' => [],
                'by_category' => [],
            ], 500);
        }
    }

    /**
     * Get material details with batches
     */
    public function materialDetails($materialId)
    {
        try {
            $batches = Store::where('material_id', $materialId)
                ->where('remaining_quantity', '>', 0)
                ->orderBy('transferred_at', 'asc') // FIFO order
                ->get()
                ->map(function($batch) {
                    $daysUntilExpiry = null;
                    $status = 'fresh';
                    
                    if ($batch->expiry_date) {
                        $daysUntilExpiry = Carbon::parse($batch->expiry_date)->diffInDays(now(), false);
                        if ($daysUntilExpiry < 0) {
                            $status = 'expired';
                        } elseif ($daysUntilExpiry <= 3) {
                            $status = 'critical';
                        } elseif ($daysUntilExpiry <= 7) {
                            $status = 'expiring';
                        } elseif ($batch->transferred_at && Carbon::parse($batch->transferred_at)->diffInDays(now()) > 30) {
                            $status = 'aging';
                        }
                    }

                    return [
                        'id' => $batch->id,
                        'batch_number' => $batch->batch_number,
                        'store_id' => $batch->store_id,
                        'store_name' => Store::getAllStoreTypes()[$batch->store_id] ?? 'Unknown',
                        'quantity' => (float) $batch->remaining_quantity,
                        'unit' => $batch->unit,
                        'cost_per_unit' => (float) $batch->cost_per_unit,
                        'total_value' => (float) ($batch->remaining_quantity * $batch->cost_per_unit),
                        'transferred_at' => $batch->transferred_at,
                        'expiry_date' => $batch->expiry_date,
                        'days_until_expiry' => $daysUntilExpiry,
                        'age_days' => $batch->transferred_at ? Carbon::parse($batch->transferred_at)->diffInDays(now()) : null,
                        'status' => $status,
                    ];
                });

            // Get consumption in last 7 days
            $consumption = StoreConsumption::where('material_id', $materialId)
                ->where('consumed_at', '>=', now()->subDays(7))
                ->sum('quantity_consumed');

            $avgDailyConsumption = $consumption / 7;
            $totalStock = $batches->sum('quantity');
            $daysRemaining = $avgDailyConsumption > 0 ? $totalStock / $avgDailyConsumption : null;

            // Last received
            $lastReceived = Store::where('material_id', $materialId)
                ->whereNotNull('transferred_at')
                ->orderBy('transferred_at', 'desc')
                ->first();

            return response()->json([
                'batches' => $batches->values(),
                'stock_summary' => [
                    'total_quantity' => $totalStock,
                    'total_value' => $batches->sum('total_value'),
                    'avg_daily_consumption' => round($avgDailyConsumption, 2),
                    'days_remaining' => $daysRemaining ? round($daysRemaining, 1) : null,
                    'last_received_date' => $lastReceived?->transferred_at,
                    'last_received_qty' => $lastReceived ? (float) $lastReceived->original_quantity : null,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'batches' => [],
                'stock_summary' => [
                    'total_quantity' => 0,
                    'total_value' => 0,
                    'avg_daily_consumption' => 0,
                    'days_remaining' => null,
                    'last_received_date' => null,
                    'last_received_qty' => null,
                ],
            ], 500);
        }
    }

    /**
     * Get stock alerts (low stock, near expiry, out of stock)
     */
    public function alerts()
    {
        try {
            // Low stock items (simple threshold: <= 10 units)
            $lowStock = Store::select(
                'material_id',
                'material_name',
                'store_id',
                DB::raw('SUM(remaining_quantity) as current_qty'),
                'unit'
            )
            ->where('remaining_quantity', '>', 0)
            ->groupBy('material_id', 'store_id', 'material_name', 'unit')
            ->havingRaw('SUM(remaining_quantity) <= 10')
            ->get()
            ->map(function($item) {
                return [
                    'material_id' => $item->material_id,
                    'material_name' => $item->material_name,
                    'store_id' => $item->store_id,
                    'store_name' => Store::getAllStoreTypes()[$item->store_id] ?? 'Unknown',
                    'current_qty' => (float) $item->current_qty,
                    'unit' => $item->unit,
                    'minimum_required' => 20, // Could be made dynamic
                    'deficit' => 20 - (float) $item->current_qty,
                ];
            });

            // Near expiry items (within 7 days)
            $nearExpiry = Store::where('remaining_quantity', '>', 0)
                ->whereNotNull('expiry_date')
                ->whereRaw('expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)')
                ->orderBy('expiry_date', 'asc')
                ->get()
                ->map(function($item) {
                    $daysRemaining = Carbon::parse($item->expiry_date)->diffInDays(now());
                    return [
                        'material_id' => $item->material_id,
                        'material_name' => $item->material_name,
                        'batch_number' => $item->batch_number,
                        'quantity' => (float) $item->remaining_quantity,
                        'unit' => $item->unit,
                        'expiry_date' => $item->expiry_date,
                        'days_remaining' => $daysRemaining,
                        'store_id' => $item->store_id,
                        'store_name' => Store::getAllStoreTypes()[$item->store_id] ?? 'Unknown',
                        'urgency' => $daysRemaining <= 3 ? 'critical' : 'warning',
                    ];
                });

            // Out of stock items (materials that exist but have 0 remaining_quantity in all stores)
            $outOfStock = Material::select('materials.id', 'materials.name', 'materials.category')
                ->leftJoin('stores', function($join) {
                    $join->on('materials.id', '=', 'stores.material_id')
                         ->where('stores.remaining_quantity', '>', 0);
                })
                ->whereNull('stores.id')
                ->limit(50)
                ->get()
                ->map(function($item) {
                    return [
                        'material_id' => $item->id,
                        'material_name' => $item->name,
                        'category' => $item->category,
                    ];
                });

            return response()->json([
                'low_stock' => $lowStock->values(),
                'near_expiry' => $nearExpiry,
                'out_of_stock' => $outOfStock,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'low_stock' => [],
                'near_expiry' => [],
                'out_of_stock' => [],
            ], 500);
        }
    }

    /**
     * Get all active batches with FIFO ordering
     */
    public function batches(Request $request)
    {
        try {
            $storeId = $request->get('store_id');
            $materialId = $request->get('material_id');

            $query = Store::where('remaining_quantity', '>', 0)
                ->orderBy('transferred_at', 'asc'); // FIFO

            if ($storeId && $storeId !== 'all') {
                $query->where('store_id', $storeId);
            }

            if ($materialId && $materialId !== 'all') {
                $query->where('material_id', $materialId);
            }

            $batches = $query->get()->map(function($batch) {
                $age = $batch->transferred_at ? Carbon::parse($batch->transferred_at)->diffInDays(now()) : null;
                $daysUntilExpiry = null;
                $status = 'fresh';

                if ($batch->expiry_date) {
                    $daysUntilExpiry = Carbon::parse($batch->expiry_date)->diffInDays(now(), false);
                    if ($daysUntilExpiry < 0) {
                        $status = 'expired';
                    } elseif ($daysUntilExpiry <= 3) {
                        $status = 'critical';
                    } elseif ($daysUntilExpiry <= 7) {
                        $status = 'near_expiry';
                    } elseif ($age && $age > 30) {
                        $status = 'aging';
                    }
                }

                return [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'material_name' => $batch->material_name,
                    'store_id' => $batch->store_id,
                    'store_name' => Store::getAllStoreTypes()[$batch->store_id] ?? 'Unknown',
                    'quantity' => (float) $batch->remaining_quantity,
                    'unit' => $batch->unit,
                    'transferred_at' => $batch->transferred_at,
                    'expiry_date' => $batch->expiry_date,
                    'age_days' => $age,
                    'days_until_expiry' => $daysUntilExpiry,
                    'status' => $status,
                ];
            });

            return response()->json($batches);

        } catch (\Exception $e) {
            return response()->json([], 500);
        }
    }

    /**
     * Get reorder suggestions based on consumption
     */
    public function reorderSuggestions()
    {
        try {
            // Get materials with consumption data
            $materials = Material::select('id', 'name', 'category')
                ->where('is_active', true)
                ->get();

            $suggestions = $materials->map(function($material) {
                // Current stock across all stores
                $currentStock = Store::where('material_id', $material->id)
                    ->where('remaining_quantity', '>', 0)
                    ->sum('remaining_quantity');

                // Consumption in last 7 days
                $consumption = StoreConsumption::where('material_id', $material->id)
                    ->where('consumed_at', '>=', now()->subDays(7))
                    ->sum('quantity_consumed');

                $avgDailyConsumption = $consumption / 7;
                
                if ($avgDailyConsumption <= 0) {
                    return null; // Skip items with no consumption
                }

                $daysRemaining = $avgDailyConsumption > 0 ? $currentStock / $avgDailyConsumption : 999;
                
                // Lead time (days) + Safety buffer (days)
                $leadTime = 3;
                $safetyBuffer = 2;
                $reorderPoint = $leadTime + $safetyBuffer;

                if ($daysRemaining > $reorderPoint) {
                    return null; // No need to reorder yet
                }

                // Calculate suggested order quantity (7 days supply)
                $suggestedQty = ceil($avgDailyConsumption * 7);

                $priority = 'low';
                if ($daysRemaining <= 2) {
                    $priority = 'high';
                } elseif ($daysRemaining <= $reorderPoint) {
                    $priority = 'medium';
                }

                return [
                    'material_id' => $material->id,
                    'material_name' => $material->name,
                    'category' => $material->category,
                    'current_stock' => (float) $currentStock,
                    'avg_daily_consumption' => round($avgDailyConsumption, 2),
                    'days_remaining' => round($daysRemaining, 1),
                    'suggested_qty' => $suggestedQty,
                    'priority' => $priority,
                ];
            })->filter()->sortBy('days_remaining')->values();

            return response()->json($suggestions);

        } catch (\Exception $e) {
            return response()->json([], 500);
        }
    }

    /**
     * Export inventory report to CSV
     */
    public function export(Request $request)
    {
        try {
            $reportResponse = $this->index($request);
            $reportData = json_decode($reportResponse->getContent(), true);
            $materials = $reportData['materials'] ?? [];

            $filename = 'inventory_report_' . now()->format('Y-m-d_His') . '.csv';
            
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"$filename\"",
            ];

            $callback = function() use ($materials) {
                $file = fopen('php://output', 'w');
                
                // Headers
                fputcsv($file, [
                    'Material Name',
                    'Category',
                    'Hot Kitchen Qty',
                    'Bakery Qty',
                    'Pastry Qty',
                    'Beverage Qty',
                    'Total Qty',
                    'Unit',
                    'Avg Cost/Unit',
                    'Total Value',
                    'Status',
                    'Nearest Expiry',
                ]);

                // Data rows
                foreach ($materials as $material) {
                    fputcsv($file, [
                        $material['material_name'],
                        $material['category'],
                        $material['hot_kitchen_qty'],
                        $material['bakery_qty'],
                        $material['pastry_qty'],
                        $material['beverage_qty'],
                        $material['total_qty'],
                        $material['unit'],
                        number_format($material['avg_cost'], 2),
                        number_format($material['total_value'], 2),
                        ucfirst($material['status']),
                        $material['nearest_expiry'] ?? 'N/A',
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
