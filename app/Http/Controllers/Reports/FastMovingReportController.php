<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalesItem;
use App\Models\MenuItem;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FastMovingReportController extends Controller
{
    /**
     * Get fast moving items report
     */
    public function index(Request $request)
    {
        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();
            
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $categoryFilter = $request->input('category');
        $sortBy = $request->input('sort_by', 'quantity'); // quantity, revenue, profit, velocity
        $limit = $request->input('limit', 50);
        $minQuantity = $request->input('min_quantity', 1);

        $items = $this->getFastMovingItems($startDate, $endDate, $categoryFilter, $sortBy, $limit, $minQuantity);
        $summary = $this->getSummary($startDate, $endDate);
        $categoryBreakdown = $this->getCategoryBreakdown($startDate, $endDate);
        $hourlyPattern = $this->getHourlyPattern($startDate, $endDate);

        return response()->json([
            'items' => $items,
            'summary' => $summary,
            'category_breakdown' => $categoryBreakdown,
            'hourly_pattern' => $hourlyPattern,
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'days' => $startDate->diffInDays($endDate) + 1,
            ],
        ]);
    }

    /**
     * Get fast moving items with detailed metrics
     */
    private function getFastMovingItems($startDate, $endDate, $categoryFilter, $sortBy, $limit, $minQuantity)
    {
        $days = $startDate->diffInDays($endDate) + 1;

        $query = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                'sales_items.product_name',
                'sales_items.menu_item_id',
                DB::raw('COALESCE(menu_categories.name, "Uncategorized") as category'),
                DB::raw('SUM(sales_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_items.total_price) as total_revenue'),
                DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as total_cost'),
                DB::raw('COUNT(DISTINCT sales.id) as transaction_count'),
                DB::raw('AVG(sales_items.unit_price) as avg_price'),
                DB::raw('MIN(sales.created_at) as first_sale'),
                DB::raw('MAX(sales.created_at) as last_sale'),
            ])
            ->groupBy('sales_items.product_name', 'sales_items.menu_item_id', 'category')
            ->having('total_quantity', '>=', $minQuantity);

        // Apply category filter
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->having('category', '=', $categoryFilter);
        }

        // Apply sorting
        switch ($sortBy) {
            case 'revenue':
                $query->orderBy('total_revenue', 'desc');
                break;
            case 'profit':
                $query->orderBy(DB::raw('(total_revenue - total_cost)'), 'desc');
                break;
            case 'velocity':
                $query->orderBy(DB::raw('(total_quantity / ' . $days . ')'), 'desc');
                break;
            case 'quantity':
            default:
                $query->orderBy('total_quantity', 'desc');
                break;
        }

        $items = $query->limit($limit)->get();

        // Get previous period data for comparison
        $previousStart = $startDate->copy()->subDays($days);
        $previousEnd = $endDate->copy()->subDays($days);

        return $items->map(function ($item, $index) use ($days, $previousStart, $previousEnd) {
            $totalRevenue = (float) $item->total_revenue;
            $totalCost = (float) $item->total_cost;
            $totalProfit = $totalRevenue - $totalCost;
            $totalQuantity = (int) $item->total_quantity;
            $transactionCount = (int) $item->transaction_count;

            // Calculate velocity
            $velocity = $days > 0 ? $totalQuantity / $days : 0;

            // Get previous period data
            $previousData = SalesItem::query()
                ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->where('sales_items.product_name', $item->product_name)
                ->whereBetween('sales.created_at', [$previousStart, $previousEnd])
                ->select([
                    DB::raw('SUM(sales_items.quantity) as prev_quantity'),
                    DB::raw('SUM(sales_items.total_price) as prev_revenue'),
                ])
                ->first();

            $previousQuantity = (int) ($previousData->prev_quantity ?? 0);
            $previousRevenue = (float) ($previousData->prev_revenue ?? 0);

            // Calculate trend
            $quantityChange = $previousQuantity > 0 
                ? (($totalQuantity - $previousQuantity) / $previousQuantity) * 100 
                : 0;

            $trend = $quantityChange > 10 ? 'rising' : ($quantityChange < -10 ? 'declining' : 'stable');

            // Check current stock level
            $stockLevel = null;
            if ($item->menu_item_id) {
                $stockLevel = $this->getStockLevel($item->menu_item_id);
            }

            return [
                'rank' => $index + 1,
                'product_name' => $item->product_name,
                'menu_item_id' => $item->menu_item_id,
                'category' => $item->category,
                'quantity_sold' => $totalQuantity,
                'transaction_count' => $transactionCount,
                'avg_quantity_per_order' => $transactionCount > 0 ? round($totalQuantity / $transactionCount, 2) : 0,
                'revenue' => round($totalRevenue, 2),
                'cost' => round($totalCost, 2),
                'profit' => round($totalProfit, 2),
                'profit_margin' => $totalRevenue > 0 ? round(($totalProfit / $totalRevenue) * 100, 2) : 0,
                'avg_price' => round((float) $item->avg_price, 2),
                'velocity' => round($velocity, 2),
                'previous_quantity' => $previousQuantity,
                'quantity_change' => round($quantityChange, 2),
                'trend' => $trend,
                'stock_level' => $stockLevel,
                'first_sale' => $item->first_sale,
                'last_sale' => $item->last_sale,
            ];
        })->values();
    }

    /**
     * Get stock level for menu item
     */
    private function getStockLevel($menuItemId)
    {
        // This is a simplified version - you may need to adjust based on your inventory system
        $menuItem = MenuItem::find($menuItemId);
        
        if (!$menuItem) {
            return null;
        }

        // Check if there's a stock tracking field
        return [
            'available' => $menuItem->stock_quantity ?? null,
            'status' => $this->getStockStatus($menuItem->stock_quantity ?? 0),
        ];
    }

    /**
     * Get stock status
     */
    private function getStockStatus($quantity)
    {
        if ($quantity === null) return 'not_tracked';
        if ($quantity <= 0) return 'out_of_stock';
        if ($quantity < 10) return 'low';
        if ($quantity < 50) return 'moderate';
        return 'good';
    }

    /**
     * Get summary statistics
     */
    private function getSummary($startDate, $endDate)
    {
        $totalItems = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                DB::raw('COUNT(DISTINCT sales_items.product_name) as unique_items'),
                DB::raw('SUM(sales_items.quantity) as total_quantity'),
                DB::raw('SUM(sales_items.total_price) as total_revenue'),
            ])
            ->first();

        return [
            'unique_items' => (int) ($totalItems->unique_items ?? 0),
            'total_quantity_sold' => (int) ($totalItems->total_quantity ?? 0),
            'total_revenue' => (float) ($totalItems->total_revenue ?? 0),
            'avg_items_per_day' => $startDate->diffInDays($endDate) + 1 > 0 
                ? round((float) ($totalItems->total_quantity ?? 0) / ($startDate->diffInDays($endDate) + 1), 2) 
                : 0,
        ];
    }

    /**
     * Get category breakdown
     */
    private function getCategoryBreakdown($startDate, $endDate)
    {
        return SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                DB::raw('COALESCE(menu_categories.name, "Uncategorized") as category'),
                DB::raw('SUM(sales_items.quantity) as quantity'),
                DB::raw('SUM(sales_items.total_price) as revenue'),
                DB::raw('COUNT(DISTINCT sales_items.product_name) as item_count'),
            ])
            ->groupBy('category')
            ->orderBy('quantity', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'quantity' => (int) $item->quantity,
                    'revenue' => (float) $item->revenue,
                    'item_count' => (int) $item->item_count,
                ];
            });
    }

    /**
     * Get hourly sales pattern
     */
    private function getHourlyPattern($startDate, $endDate)
    {
        return Sale::query()
            ->join('sales_items', 'sales.id', '=', 'sales_items.sale_id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                DB::raw('HOUR(sales.created_at) as hour'),
                DB::raw('SUM(sales_items.quantity) as quantity'),
                DB::raw('COUNT(DISTINCT sales.id) as transaction_count'),
            ])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                $hour = (int) $item->hour;
                return [
                    'hour' => $hour,
                    'label' => sprintf('%02d:00', $hour),
                    'quantity' => (int) $item->quantity,
                    'transaction_count' => (int) $item->transaction_count,
                ];
            });
    }

    /**
     * Get top items by category
     */
    public function topByCategory(Request $request)
    {
        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();
            
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $limit = $request->input('limit', 5);

        $categories = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select(DB::raw('COALESCE(menu_categories.name, "Uncategorized") as category'))
            ->groupBy('category')
            ->pluck('category');

        $result = [];

        foreach ($categories as $category) {
            $topItems = SalesItem::query()
                ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->where(function ($query) use ($category) {
                    if ($category === 'Uncategorized') {
                        $query->whereNull('menu_categories.name');
                    } else {
                        $query->where('menu_categories.name', $category);
                    }
                })
                ->select([
                    'sales_items.product_name',
                    DB::raw('SUM(sales_items.quantity) as quantity'),
                    DB::raw('SUM(sales_items.total_price) as revenue'),
                ])
                ->groupBy('sales_items.product_name')
                ->orderBy('quantity', 'desc')
                ->limit($limit)
                ->get();

            $result[] = [
                'category' => $category,
                'items' => $topItems->map(function ($item) {
                    return [
                        'product_name' => $item->product_name,
                        'quantity' => (int) $item->quantity,
                        'revenue' => (float) $item->revenue,
                    ];
                }),
            ];
        }

        return response()->json($result);
    }

    /**
     * Get items that are frequently bought together
     */
    public function frequentCombos(Request $request)
    {
        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();
            
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $limit = $request->input('limit', 20);

        // Find combinations of items bought together in the same order
        $combos = DB::select("
            SELECT 
                si1.product_name as item1,
                si2.product_name as item2,
                COUNT(*) as frequency
            FROM sales_items si1
            JOIN sales_items si2 ON si1.sale_id = si2.sale_id AND si1.id < si2.id
            JOIN sales s ON si1.sale_id = s.id
            WHERE s.created_at BETWEEN ? AND ?
            GROUP BY si1.product_name, si2.product_name
            ORDER BY frequency DESC
            LIMIT ?
        ", [$startDate, $endDate, $limit]);

        return response()->json(
            collect($combos)->map(function ($combo) {
                return [
                    'item1' => $combo->item1,
                    'item2' => $combo->item2,
                    'frequency' => (int) $combo->frequency,
                ];
            })
        );
    }

    /**
     * Get available categories for filtering
     */
    public function getCategories()
    {
        $categories = DB::table('menu_categories')
            ->select('name')
            ->orderBy('name')
            ->pluck('name');

        return response()->json($categories);
    }
}
