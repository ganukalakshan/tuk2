<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Expense;
use App\Models\SalesMaterialConsumption;
use App\Models\StoreConsumption;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProfitLossReportController extends Controller
{
    /**
     * Get comprehensive Profit & Loss report
     */
    public function index(Request $request)
    {
        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();
            
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // Get Revenue Data
        $revenueData = $this->getRevenueData($startDate, $endDate);
        
        // Get COGS (Cost of Goods Sold)
        $cogsData = $this->getCOGSData($startDate, $endDate);
        
        // Get Operating Expenses
        $expensesData = $this->getExpensesData($startDate, $endDate);
        
        // Calculate Profit Metrics
        $profitMetrics = $this->calculateProfitMetrics($revenueData, $cogsData, $expensesData);
        
        // Get comparison with previous period
        $comparison = $this->getPreviousPeriodComparison($startDate, $endDate);

        return response()->json([
            'revenue' => $revenueData,
            'cogs' => $cogsData,
            'expenses' => $expensesData,
            'profit_metrics' => $profitMetrics,
            'comparison' => $comparison,
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Get revenue breakdown
     */
    private function getRevenueData($startDate, $endDate)
    {
        // Total Sales Revenue
        $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate]);
        
        $totalSales = (float) $salesQuery->sum('total_amount');
        $totalSubtotal = (float) $salesQuery->sum('subtotal');
        $totalServiceCharge = (float) $salesQuery->sum('service_charge_amount');
        $transactionCount = $salesQuery->count();

        // Revenue by Category
        $categoryRevenue = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                DB::raw('COALESCE(menu_categories.name, "Uncategorized") as category'),
                DB::raw('SUM(sales_items.quantity) as qty_sold'),
                DB::raw('SUM(sales_items.total_price) as revenue'),
            ])
            ->groupBy('category')
            ->orderBy('revenue', 'desc')
            ->get();

        // Revenue by Payment Method
        $paymentBreakdown = [
            'cash' => (float) Sale::whereBetween('created_at', [$startDate, $endDate])->sum('cash_amount'),
            'card' => (float) Sale::whereBetween('created_at', [$startDate, $endDate])->sum('card_amount'),
            'pickme' => (float) Sale::whereBetween('created_at', [$startDate, $endDate])->sum('pickme_amount'),
            'uber' => (float) Sale::whereBetween('created_at', [$startDate, $endDate])->sum('uber_amount'),
        ];

        return [
            'total_revenue' => $totalSales,
            'subtotal' => $totalSubtotal,
            'service_charges' => $totalServiceCharge,
            'tax' => 0, // Tax not tracked separately in sales table
            'transaction_count' => $transactionCount,
            'average_transaction' => $transactionCount > 0 ? $totalSales / $transactionCount : 0,
            'by_category' => $categoryRevenue,
            'by_payment_method' => $paymentBreakdown,
        ];
    }

    /**
     * Get Cost of Goods Sold breakdown
     */
    private function getCOGSData($startDate, $endDate)
    {
        // Get COGS from sales items (using recorded cost at time of sale)
        $itemCosts = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as total_cogs'),
            ])
            ->first();

        $totalCOGS = (float) ($itemCosts->total_cogs ?? 0);

        // Get material consumption by store type
        $consumptionByStore = StoreConsumption::query()
            ->whereBetween('consumed_at', [$startDate, $endDate])
            ->select([
                'store_name',
                DB::raw('SUM(total_cost) as total_cost'),
                DB::raw('COUNT(*) as consumption_count'),
            ])
            ->groupBy('store_name')
            ->get();

        $consumptionData = $consumptionByStore->map(function ($item) {
            return [
                'store_type' => $item->store_name,
                'total_cost' => (float) $item->total_cost,
                'consumption_count' => $item->consumption_count,
            ];
        });

        $totalConsumptionCost = (float) $consumptionByStore->sum('total_cost');

        // Use the higher value between sales item costs and store consumption
        $finalCOGS = max($totalCOGS, $totalConsumptionCost);

        return [
            'total_cogs' => $finalCOGS,
            'from_sales_items' => $totalCOGS,
            'from_store_consumption' => $totalConsumptionCost,
            'by_store_type' => $consumptionData,
            'method_used' => $finalCOGS === $totalCOGS ? 'sales_items' : 'store_consumption',
        ];
    }

    /**
     * Get operating expenses breakdown
     */
    private function getExpensesData($startDate, $endDate)
    {
        $expensesQuery = Expense::query()
            ->whereBetween('date', [$startDate, $endDate]);

        $totalExpenses = (float) $expensesQuery->sum('amount');

        // Expenses by category
        $expensesByCategory = Expense::query()
            ->join('expense_categories', 'expenses.category_id', '=', 'expense_categories.id')
            ->whereBetween('expenses.date', [$startDate, $endDate])
            ->select([
                'expense_categories.name as category',
                DB::raw('SUM(expenses.amount) as total_amount'),
                DB::raw('COUNT(*) as expense_count'),
            ])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->orderBy('total_amount', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total_amount' => (float) $item->total_amount,
                    'expense_count' => $item->expense_count,
                ];
            });

        // Expenses by payment method
        $expensesByPaymentMethod = Expense::query()
            ->whereBetween('date', [$startDate, $endDate])
            ->select([
                'payment_method',
                DB::raw('SUM(amount) as total_amount'),
            ])
            ->groupBy('payment_method')
            ->get()
            ->map(function ($item) {
                return [
                    'method' => $item->payment_method,
                    'amount' => (float) $item->total_amount,
                ];
            });

        return [
            'total_expenses' => $totalExpenses,
            'by_category' => $expensesByCategory,
            'by_payment_method' => $expensesByPaymentMethod,
            'expense_count' => Expense::whereBetween('date', [$startDate, $endDate])->count(),
        ];
    }

    /**
     * Calculate all profit metrics
     */
    private function calculateProfitMetrics($revenueData, $cogsData, $expensesData)
    {
        $totalRevenue = $revenueData['total_revenue'];
        $totalCOGS = $cogsData['total_cogs'];
        $totalExpenses = $expensesData['total_expenses'];

        // Gross Profit = Revenue - COGS
        $grossProfit = $totalRevenue - $totalCOGS;
        $grossProfitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        // Operating Profit = Gross Profit - Operating Expenses
        $operatingProfit = $grossProfit - $totalExpenses;
        $operatingProfitMargin = $totalRevenue > 0 ? ($operatingProfit / $totalRevenue) * 100 : 0;

        // Net Profit = Operating Profit (in this simple model, same as operating profit)
        $netProfit = $operatingProfit;
        $netProfitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        // EBITDA (in simple form, same as operating profit without depreciation/amortization)
        $ebitda = $operatingProfit;

        return [
            'gross_profit' => round($grossProfit, 2),
            'gross_profit_margin' => round($grossProfitMargin, 2),
            'operating_profit' => round($operatingProfit, 2),
            'operating_profit_margin' => round($operatingProfitMargin, 2),
            'net_profit' => round($netProfit, 2),
            'net_profit_margin' => round($netProfitMargin, 2),
            'ebitda' => round($ebitda, 2),
            'cogs_percentage' => $totalRevenue > 0 ? round(($totalCOGS / $totalRevenue) * 100, 2) : 0,
            'expense_percentage' => $totalRevenue > 0 ? round(($totalExpenses / $totalRevenue) * 100, 2) : 0,
        ];
    }

    /**
     * Get previous period comparison
     */
    private function getPreviousPeriodComparison($startDate, $endDate)
    {
        $periodLength = $startDate->diffInDays($endDate) + 1;
        $previousStart = $startDate->copy()->subDays($periodLength);
        $previousEnd = $endDate->copy()->subDays($periodLength);

        // Get previous period data
        $prevRevenue = $this->getRevenueData($previousStart, $previousEnd);
        $prevCOGS = $this->getCOGSData($previousStart, $previousEnd);
        $prevExpenses = $this->getExpensesData($previousStart, $previousEnd);
        $prevMetrics = $this->calculateProfitMetrics($prevRevenue, $prevCOGS, $prevExpenses);

        // Current period summary
        $currentRevenue = (float) Sale::whereBetween('created_at', [$startDate, $endDate])->sum('total_amount');
        $currentCOGS = $this->getCOGSData($startDate, $endDate)['total_cogs'];
        $currentExpenses = (float) Expense::whereBetween('date', [$startDate, $endDate])->sum('amount');
        $currentMetrics = $this->calculateProfitMetrics(
            $this->getRevenueData($startDate, $endDate),
            $this->getCOGSData($startDate, $endDate),
            $this->getExpensesData($startDate, $endDate)
        );

        return [
            'revenue' => [
                'current' => $currentRevenue,
                'previous' => $prevRevenue['total_revenue'],
                'change' => $currentRevenue - $prevRevenue['total_revenue'],
                'change_percent' => $prevRevenue['total_revenue'] > 0 
                    ? round((($currentRevenue - $prevRevenue['total_revenue']) / $prevRevenue['total_revenue']) * 100, 2)
                    : 0,
            ],
            'cogs' => [
                'current' => $currentCOGS,
                'previous' => $prevCOGS['total_cogs'],
                'change' => $currentCOGS - $prevCOGS['total_cogs'],
                'change_percent' => $prevCOGS['total_cogs'] > 0 
                    ? round((($currentCOGS - $prevCOGS['total_cogs']) / $prevCOGS['total_cogs']) * 100, 2)
                    : 0,
            ],
            'expenses' => [
                'current' => $currentExpenses,
                'previous' => $prevExpenses['total_expenses'],
                'change' => $currentExpenses - $prevExpenses['total_expenses'],
                'change_percent' => $prevExpenses['total_expenses'] > 0 
                    ? round((($currentExpenses - $prevExpenses['total_expenses']) / $prevExpenses['total_expenses']) * 100, 2)
                    : 0,
            ],
            'net_profit' => [
                'current' => $currentMetrics['net_profit'],
                'previous' => $prevMetrics['net_profit'],
                'change' => $currentMetrics['net_profit'] - $prevMetrics['net_profit'],
                'change_percent' => $prevMetrics['net_profit'] != 0
                    ? round((($currentMetrics['net_profit'] - $prevMetrics['net_profit']) / abs($prevMetrics['net_profit'])) * 100, 2)
                    : 0,
            ],
            'period' => [
                'start_date' => $previousStart->format('Y-m-d'),
                'end_date' => $previousEnd->format('Y-m-d'),
            ],
        ];
    }

    /**
     * Get daily profit & loss trend
     */
    public function dailyTrend(Request $request)
    {
        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->start_date)
            : Carbon::now()->subDays(30);
            
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)
            : Carbon::now();

        $dailyData = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayStart = $currentDate->copy()->startOfDay();
            $dayEnd = $currentDate->copy()->endOfDay();

            $revenue = (float) Sale::whereBetween('created_at', [$dayStart, $dayEnd])->sum('total_amount');
            
            // Get COGS for the day
            $cogs = (float) SalesItem::query()
                ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
                ->whereBetween('sales.created_at', [$dayStart, $dayEnd])
                ->select([DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as total_cogs')])
                ->first()
                ->total_cogs ?? 0;

            $expenses = (float) Expense::whereBetween('date', [$dayStart, $dayEnd])->sum('amount');

            $grossProfit = $revenue - $cogs;
            $netProfit = $grossProfit - $expenses;

            $dailyData[] = [
                'date' => $currentDate->format('Y-m-d'),
                'day_name' => $currentDate->format('l'),
                'revenue' => $revenue,
                'cogs' => $cogs,
                'expenses' => $expenses,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
                'net_margin' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
            ];

            $currentDate->addDay();
        }

        return response()->json([
            'daily_trend' => $dailyData,
        ]);
    }

    /**
     * Get top performing menu items by profit
     */
    public function topItemsByProfit(Request $request)
    {
        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->start_date)
            : Carbon::now()->startOfMonth();
            
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)
            : Carbon::now();

        $limit = $request->input('limit', 20);

        $topItems = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->select([
                'sales_items.product_name',
                DB::raw('SUM(sales_items.quantity) as qty_sold'),
                DB::raw('SUM(sales_items.total_price) as revenue'),
                DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as cost'),
                DB::raw('SUM(sales_items.total_price - COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as profit'),
            ])
            ->groupBy('sales_items.product_name')
            ->orderBy('profit', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                $revenue = (float) $item->revenue;
                $cost = (float) $item->cost;
                $profit = (float) $item->profit;

                return [
                    'product_name' => $item->product_name,
                    'qty_sold' => (int) $item->qty_sold,
                    'revenue' => $revenue,
                    'cost' => $cost,
                    'profit' => $profit,
                    'margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0,
                ];
            });

        return response()->json([
            'top_items' => $topItems,
        ]);
    }
}
