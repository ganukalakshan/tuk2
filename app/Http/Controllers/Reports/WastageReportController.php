<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Wastage;
use App\Models\Material;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WastageReportController extends Controller
{
    /**
     * Get comprehensive wastage report
     */
    public function index(Request $request)
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $location = $request->get('location');
        $type = $request->get('type'); // 'material' or 'product'
        $userId = $request->get('user_id');

        // Base query
        $query = Wastage::with(['material', 'menuItem', 'unit', 'recordedBy']);

        // Apply filters
        if ($dateFrom) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('date', '<=', $dateTo);
        }
        if ($location) {
            $query->where('location', $location);
        }
        if ($type === 'material') {
            $query->whereNotNull('material_id');
        } elseif ($type === 'product') {
            $query->whereNotNull('menu_item_id');
        }
        if ($userId) {
            $query->where('recorded_by', $userId);
        }

        $records = $query->orderBy('date', 'desc')->get();

        // Summary Statistics
        $totalCost = $records->sum('cost');
        $totalItems = $records->count();
        $materialWastageCount = $records->whereNotNull('material_id')->count();
        $productWastageCount = $records->whereNotNull('menu_item_id')->count();
        $materialWastageCost = $records->whereNotNull('material_id')->sum('cost');
        $productWastageCost = $records->whereNotNull('menu_item_id')->sum('cost');

        // Breakdown by Location
        $byLocation = $records->groupBy('location')->map(function ($items, $location) {
            return [
                'location' => $location,
                'count' => $items->count(),
                'total_cost' => round($items->sum('cost'), 2),
                'avg_cost' => round($items->avg('cost'), 2),
            ];
        })->values();

        // Top Wasted Materials
        $topMaterials = $records->whereNotNull('material_id')
            ->groupBy('material_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'material_id' => $first->material_id,
                    'material_name' => $first->material?->name ?? 'Unknown',
                    'material_code' => $first->material?->code ?? 'N/A',
                    'total_quantity' => round($items->sum('quantity'), 3),
                    'unit' => $first->unit?->unit_symbol ?? $first->unit?->unit_name ?? '',
                    'total_cost' => round($items->sum('cost'), 2),
                    'count' => $items->count(),
                ];
            })
            ->sortByDesc('total_cost')
            ->take(10)
            ->values();

        // Top Wasted Products
        $topProducts = $records->whereNotNull('menu_item_id')
            ->groupBy('menu_item_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'menu_item_id' => $first->menu_item_id,
                    'product_name' => $first->menuItem?->name ?? 'Unknown',
                    'total_quantity' => round($items->sum('quantity'), 3),
                    'total_cost' => round($items->sum('cost'), 2),
                    'count' => $items->count(),
                ];
            })
            ->sortByDesc('total_cost')
            ->take(10)
            ->values();

        // Wastage by Reason
        $byReason = $records->whereNotNull('reason')
            ->groupBy('reason')
            ->map(function ($items, $reason) {
                return [
                    'reason' => $reason,
                    'count' => $items->count(),
                    'total_cost' => round($items->sum('cost'), 2),
                ];
            })
            ->sortByDesc('total_cost')
            ->values();

        // Wastage by User
        $byUser = $records->whereNotNull('recorded_by')
            ->groupBy('recorded_by')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'user_id' => $first->recorded_by,
                    'user_name' => $first->recordedBy?->name ?? 'Unknown',
                    'count' => $items->count(),
                    'total_cost' => round($items->sum('cost'), 2),
                ];
            })
            ->sortByDesc('count')
            ->values();

        // Detailed Records
        $detailedRecords = $records->map(function ($record) {
            return [
                'id' => $record->id,
                'date' => $record->date,
                'type' => $record->material_id ? 'Raw Material' : 'Finished Product',
                'item_name' => $record->material?->name ?? $record->menuItem?->name ?? 'Unknown',
                'item_code' => $record->material?->code ?? null,
                'quantity' => (float) $record->quantity,
                'unit' => $record->unit?->unit_symbol ?? $record->unit?->unit_name ?? '',
                'cost' => (float) ($record->cost ?? 0),
                'location' => $record->location,
                'reason' => $record->reason,
                'recorded_by' => $record->recordedBy?->name ?? 'Unknown',
                'created_at' => $record->created_at->format('Y-m-d H:i:s'),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_cost' => round($totalCost, 2),
                    'total_items' => $totalItems,
                    'material_wastage' => [
                        'count' => $materialWastageCount,
                        'cost' => round($materialWastageCost, 2),
                    ],
                    'product_wastage' => [
                        'count' => $productWastageCount,
                        'cost' => round($productWastageCost, 2),
                    ],
                ],
                'by_location' => $byLocation,
                'top_materials' => $topMaterials,
                'top_products' => $topProducts,
                'by_reason' => $byReason,
                'by_user' => $byUser,
                'records' => $detailedRecords,
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'location' => $location,
                    'type' => $type,
                    'user_id' => $userId,
                ],
            ],
        ]);
    }

    /**
     * Get wastage trends (daily data for charts)
     */
    public function trends(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $dailyData = Wastage::whereBetween('date', [$dateFrom, $dateTo])
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(cost) as total_cost')
            )
            ->groupBy(DB::raw('DATE(date)'))
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => (int) $item->count,
                    'total_cost' => round($item->total_cost, 2),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $dailyData,
        ]);
    }

    /**
     * Get wastage report for specific location
     */
    public function byLocation($location, Request $request)
    {
        if (!in_array($location, ['store', 'kitchen', 'bar'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid location',
            ], 400);
        }

        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $query = Wastage::with(['material', 'menuItem', 'unit', 'recordedBy'])
            ->where('location', $location);

        if ($dateFrom) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('date', '<=', $dateTo);
        }

        $records = $query->orderBy('date', 'desc')->get();

        $totalCost = $records->sum('cost');
        $totalItems = $records->count();

        $detailedRecords = $records->map(function ($record) {
            return [
                'id' => $record->id,
                'date' => $record->date,
                'type' => $record->material_id ? 'Raw Material' : 'Finished Product',
                'item_name' => $record->material?->name ?? $record->menuItem?->name ?? 'Unknown',
                'quantity' => (float) $record->quantity,
                'unit' => $record->unit?->unit_symbol ?? '',
                'cost' => (float) ($record->cost ?? 0),
                'reason' => $record->reason,
                'recorded_by' => $record->recordedBy?->name ?? 'Unknown',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'location' => $location,
                'summary' => [
                    'total_cost' => round($totalCost, 2),
                    'total_items' => $totalItems,
                ],
                'records' => $detailedRecords,
            ],
        ]);
    }

    /**
     * Get wastage history for specific item
     */
    public function byItem($type, $id, Request $request)
    {
        if (!in_array($type, ['material', 'product'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid type',
            ], 400);
        }

        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $query = Wastage::with(['material', 'menuItem', 'unit', 'recordedBy']);

        if ($type === 'material') {
            $query->where('material_id', $id);
            $item = Material::find($id);
        } else {
            $query->where('menu_item_id', $id);
            $item = MenuItem::find($id);
        }

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found',
            ], 404);
        }

        if ($dateFrom) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('date', '<=', $dateTo);
        }

        $records = $query->orderBy('date', 'desc')->get();

        $totalQuantity = $records->sum('quantity');
        $totalCost = $records->sum('cost');
        $totalCount = $records->count();

        return response()->json([
            'success' => true,
            'data' => [
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code ?? null,
                    'type' => $type,
                ],
                'summary' => [
                    'total_quantity' => round($totalQuantity, 3),
                    'total_cost' => round($totalCost, 2),
                    'total_count' => $totalCount,
                ],
                'records' => $records->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'date' => $record->date,
                        'quantity' => (float) $record->quantity,
                        'cost' => (float) ($record->cost ?? 0),
                        'location' => $record->location,
                        'reason' => $record->reason,
                        'recorded_by' => $record->recordedBy?->name ?? 'Unknown',
                    ];
                }),
            ],
        ]);
    }

    /**
     * Export wastage report as CSV
     */
    public function export(Request $request)
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $location = $request->get('location');

        $query = Wastage::with(['material', 'menuItem', 'unit', 'recordedBy']);

        if ($dateFrom) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('date', '<=', $dateTo);
        }
        if ($location) {
            $query->where('location', $location);
        }

        $records = $query->orderBy('date', 'desc')->get();

        $csvData = [];
        $csvData[] = ['Date', 'Type', 'Item Name', 'Item Code', 'Quantity', 'Unit', 'Cost', 'Location', 'Reason', 'Recorded By'];

        foreach ($records as $record) {
            $csvData[] = [
                $record->date,
                $record->material_id ? 'Raw Material' : 'Finished Product',
                $record->material?->name ?? $record->menuItem?->name ?? 'Unknown',
                $record->material?->code ?? '',
                $record->quantity,
                $record->unit?->unit_symbol ?? '',
                $record->cost ?? 0,
                $record->location,
                $record->reason ?? '',
                $record->recordedBy?->name ?? 'Unknown',
            ];
        }

        $filename = 'wastage_report_' . now()->format('Y-m-d_H-i-s') . '.csv';

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
