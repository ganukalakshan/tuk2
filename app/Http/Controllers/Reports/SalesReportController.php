<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\User;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesReportController extends Controller
{
    /**
     * Main sales report with summary and filters
     */
    public function index(Request $request)
    {
        $query = Sale::query()
            ->with(['user', 'customer', 'salesItems.menuItem']);

        // Apply filters
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('table_number') && $request->table_number !== 'all') {
            $query->where('table_number', $request->table_number);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        // Calculate summary - using actual payment amounts from individual columns
        $summary = [
            'total_sales' => (float) $sales->sum('total_amount'),
            'total_transactions' => $sales->count(),
            'average_sale' => $sales->count() > 0 ? (float) ($sales->sum('total_amount') / $sales->count()) : 0,
            'total_subtotal' => (float) $sales->sum('subtotal'),
            'total_service_charge' => (float) $sales->sum('service_charge_amount'),
            'cash_total' => (float) $sales->sum('cash_amount'),
            'card_total' => (float) $sales->sum('card_amount'),
            'pickme_total' => (float) $sales->sum('pickme_amount'),
            'uber_total' => (float) $sales->sum('uber_amount'),
        ];

        // Calculate profit from sales items
        // cost_price in sales_items is the total cost for that line item (already multiplied by quantity)
        // If cost_price is NULL, fall back to menu_item.cost * quantity
        $saleIds = $sales->pluck('id');
        
        $itemsData = SalesItem::whereIn('sale_id', $saleIds)
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->select([
                DB::raw('SUM(sales_items.total_price) as total_revenue'),
                DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as total_cost'),
            ])
            ->first();

        $totalRevenue = (float) ($itemsData->total_revenue ?? 0);
        $totalCost = (float) ($itemsData->total_cost ?? 0);
        
        $summary['total_revenue'] = $totalRevenue;
        $summary['total_cost'] = $totalCost;
        $summary['total_profit'] = $totalRevenue - $totalCost;
        $summary['profit_margin'] = $totalRevenue > 0 
            ? round(($summary['total_profit'] / $totalRevenue) * 100, 2)
            : 0;

        return response()->json([
            'sales' => $sales,
            'summary' => $summary,
        ]);
    }

    /**
     * Payment method breakdown
     */
    public function paymentBreakdown(Request $request)
    {
        $query = Sale::query();

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $totals = $query->select([
            DB::raw('COALESCE(SUM(cash_amount), 0) as cash_total'),
            DB::raw('COALESCE(SUM(card_amount), 0) as card_total'),
            DB::raw('COALESCE(SUM(pickme_amount), 0) as pickme_total'),
            DB::raw('COALESCE(SUM(uber_amount), 0) as uber_total'),
            DB::raw('COALESCE(SUM(total_amount), 0) as grand_total'),
        ])->first();

        $cashTotal = (float) ($totals->cash_total ?? 0);
        $cardTotal = (float) ($totals->card_total ?? 0);
        $pickmeTotal = (float) ($totals->pickme_total ?? 0);
        $uberTotal = (float) ($totals->uber_total ?? 0);
        $grandTotal = (float) ($totals->grand_total ?? 0);
        
        // For percentage calculation, use sum of payment amounts (which should equal grand_total)
        $totalPayments = $cashTotal + $cardTotal + $pickmeTotal + $uberTotal;
        $divisor = $totalPayments > 0 ? $totalPayments : 1;

        return response()->json([
            [
                'method' => 'Cash',
                'amount' => $cashTotal,
                'percentage' => round(($cashTotal / $divisor) * 100, 1),
            ],
            [
                'method' => 'Card',
                'amount' => $cardTotal,
                'percentage' => round(($cardTotal / $divisor) * 100, 1),
            ],
            [
                'method' => 'PickMe',
                'amount' => $pickmeTotal,
                'percentage' => round(($pickmeTotal / $divisor) * 100, 1),
            ],
            [
                'method' => 'Uber',
                'amount' => $uberTotal,
                'percentage' => round(($uberTotal / $divisor) * 100, 1),
            ],
        ]);
    }

    /**
     * Top selling items
     */
    public function topSellingItems(Request $request)
    {
        $query = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id');

        if ($request->filled('start_date')) {
            $query->whereDate('sales.created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('sales.created_at', '<=', $request->end_date);
        }

        // cost_price is the total cost for the line item (already includes quantity calculation)
        // Fallback to menu_items.cost * quantity if cost_price is NULL
        $items = $query->select([
            'sales_items.product_name',
            'menu_categories.name as category',
            DB::raw('SUM(sales_items.quantity) as qty_sold'),
            DB::raw('SUM(sales_items.total_price) as revenue'),
            DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as cost'),
        ])
            ->groupBy('sales_items.product_name', 'menu_categories.name')
            ->orderBy('revenue', 'desc')
            ->limit(20)
            ->get();

        return response()->json($items->map(function ($item) {
            $revenue = (float) ($item->revenue ?? 0);
            $cost = (float) ($item->cost ?? 0);
            $profit = $revenue - $cost;
            
            return [
                'product_name' => $item->product_name,
                'category' => $item->category ?? 'Uncategorized',
                'qty_sold' => (int) $item->qty_sold,
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profit,
                'margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 1) : 0,
            ];
        }));
    }

    /**
     * Sales by category
     */
    public function salesByCategory(Request $request)
    {
        $query = SalesItem::query()
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sales_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id');

        if ($request->filled('start_date')) {
            $query->whereDate('sales.created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('sales.created_at', '<=', $request->end_date);
        }

        $categories = $query->select([
            DB::raw("COALESCE(menu_categories.name, 'Uncategorized') as category"),
            DB::raw('SUM(sales_items.quantity) as qty_sold'),
            DB::raw('SUM(sales_items.total_price) as revenue'),
            DB::raw('SUM(COALESCE(sales_items.cost_price, COALESCE(menu_items.cost, 0) * sales_items.quantity)) as cost'),
        ])
            ->groupBy('menu_categories.name')
            ->orderBy('revenue', 'desc')
            ->get();

        $totalRevenue = (float) $categories->sum('revenue') ?: 1;

        return response()->json($categories->map(function ($cat) use ($totalRevenue) {
            $revenue = (float) ($cat->revenue ?? 0);
            $cost = (float) ($cat->cost ?? 0);
            
            return [
                'category' => $cat->category,
                'qty_sold' => (int) $cat->qty_sold,
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $revenue - $cost,
                'percentage' => round(($revenue / $totalRevenue) * 100, 1),
            ];
        }));
    }

    /**
     * Sales by cashier/staff
     */
    public function salesByStaff(Request $request)
    {
        $query = Sale::query()
            ->join('users', 'sales.user_id', '=', 'users.id');

        if ($request->filled('start_date')) {
            $query->whereDate('sales.created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('sales.created_at', '<=', $request->end_date);
        }

        $staff = $query->select([
            'users.id',
            'users.name',
            DB::raw('COUNT(sales.id) as transactions'),
            DB::raw('COALESCE(SUM(sales.total_amount), 0) as total_sales'),
            DB::raw('COALESCE(AVG(sales.total_amount), 0) as avg_sale'),
            DB::raw('COALESCE(SUM(sales.cash_amount), 0) as cash_collected'),
            DB::raw('COALESCE(SUM(sales.card_amount), 0) as card_collected'),
            DB::raw('COALESCE(SUM(sales.pickme_amount), 0) as pickme_collected'),
            DB::raw('COALESCE(SUM(sales.uber_amount), 0) as uber_collected'),
        ])
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_sales', 'desc')
            ->get();

        return response()->json($staff->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'transactions' => (int) $s->transactions,
                'total_sales' => (float) $s->total_sales,
                'avg_sale' => (float) $s->avg_sale,
                'cash_collected' => (float) $s->cash_collected,
                'card_collected' => (float) $s->card_collected,
                'pickme_collected' => (float) $s->pickme_collected,
                'uber_collected' => (float) $s->uber_collected,
            ];
        }));
    }

    /**
     * Sales by table
     */
    public function salesByTable(Request $request)
    {
        $query = Sale::query()
            ->whereNotNull('table_number');

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $tables = $query->select([
            'table_number',
            DB::raw('COUNT(id) as transactions'),
            DB::raw('COALESCE(SUM(total_amount), 0) as total_sales'),
            DB::raw('COALESCE(AVG(total_amount), 0) as avg_sale'),
        ])
            ->groupBy('table_number')
            ->orderBy('total_sales', 'desc')
            ->get();

        return response()->json($tables->map(function ($t) {
            return [
                'table_number' => $t->table_number,
                'transactions' => (int) $t->transactions,
                'total_sales' => (float) $t->total_sales,
                'avg_sale' => (float) $t->avg_sale,
            ];
        }));
    }

    /**
     * Hourly sales distribution
     */
    public function hourlySales(Request $request)
    {
        $query = Sale::query();

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $hourly = $query->select([
            DB::raw('HOUR(created_at) as hour'),
            DB::raw('COUNT(id) as transactions'),
            DB::raw('COALESCE(SUM(total_amount), 0) as total_sales'),
            DB::raw('COALESCE(SUM(cash_amount), 0) as cash_total'),
            DB::raw('COALESCE(SUM(card_amount), 0) as card_total'),
            DB::raw('COALESCE(SUM(pickme_amount), 0) as pickme_total'),
            DB::raw('COALESCE(SUM(uber_amount), 0) as uber_total'),
        ])
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour')
            ->get();

        // Fill in missing hours with zero
        $result = [];
        for ($h = 0; $h < 24; $h++) {
            $found = $hourly->firstWhere('hour', $h);
            $result[] = [
                'hour' => $h,
                'label' => sprintf('%02d:00', $h),
                'transactions' => $found ? (int) $found->transactions : 0,
                'total_sales' => $found ? (float) $found->total_sales : 0,
                'cash_total' => $found ? (float) $found->cash_total : 0,
                'card_total' => $found ? (float) $found->card_total : 0,
                'pickme_total' => $found ? (float) $found->pickme_total : 0,
                'uber_total' => $found ? (float) $found->uber_total : 0,
            ];
        }

        return response()->json($result);
    }

    /**
     * Daily sales for trend analysis
     */
    public function dailySales(Request $request)
    {
        $query = Sale::query();

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $daily = $query->select([
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(id) as transactions'),
            DB::raw('COALESCE(SUM(total_amount), 0) as total_sales'),
            DB::raw('COALESCE(AVG(total_amount), 0) as avg_sale'),
            DB::raw('COALESCE(SUM(cash_amount), 0) as cash_total'),
            DB::raw('COALESCE(SUM(card_amount), 0) as card_total'),
            DB::raw('COALESCE(SUM(pickme_amount), 0) as pickme_total'),
            DB::raw('COALESCE(SUM(uber_amount), 0) as uber_total'),
        ])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        return response()->json($daily->map(function ($d) {
            return [
                'date' => $d->date,
                'transactions' => (int) $d->transactions,
                'total_sales' => (float) $d->total_sales,
                'avg_sale' => (float) $d->avg_sale,
                'cash_total' => (float) $d->cash_total,
                'card_total' => (float) $d->card_total,
                'pickme_total' => (float) $d->pickme_total,
                'uber_total' => (float) $d->uber_total,
            ];
        }));
    }

    /**
     * Get sale details with items
     */
    public function saleDetails($id)
    {
        $sale = Sale::with(['user', 'customer', 'salesItems.menuItem'])
            ->findOrFail($id);

        // Calculate item-level costs for display
        $sale->salesItems->each(function ($item) {
            if ($item->cost_price === null && $item->menuItem) {
                $item->calculated_cost = (float) $item->menuItem->cost * $item->quantity;
            } else {
                $item->calculated_cost = (float) $item->cost_price;
            }
            $item->item_profit = (float) $item->total_price - $item->calculated_cost;
        });

        return response()->json($sale);
    }

    /**
     * Get list of cashiers for filter
     */
    public function getCashiers()
    {
        $cashiers = User::whereHas('sales')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($cashiers);
    }

    /**
     * Get list of table numbers for filter
     */
    public function getTables()
    {
        $tables = Sale::whereNotNull('table_number')
            ->distinct()
            ->pluck('table_number')
            ->sort()
            ->values();

        return response()->json($tables);
    }

    /**
     * Export sales report to CSV
     */
    public function export(Request $request)
    {
        $query = Sale::query()
            ->with(['user', 'salesItems.menuItem']);

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        $csv = "Sale ID,Order ID,Date,Time,Cashier,Table,Subtotal,Service Charge,Total,Cash,Card,PickMe,Uber,Cost,Profit,Payment Method,Items\n";

        foreach ($sales as $sale) {
            $items = $sale->salesItems->map(fn($item) => "{$item->product_name} x{$item->quantity}")->implode('; ');
            
            // Calculate cost for this sale
            $totalCost = $sale->salesItems->sum(function ($item) {
                if ($item->cost_price !== null) {
                    return (float) $item->cost_price;
                }
                return $item->menuItem ? (float) $item->menuItem->cost * $item->quantity : 0;
            });
            
            $profit = (float) $sale->total_amount - $totalCost;
            
            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%s,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%s,\"%s\"\n",
                $sale->id,
                $sale->order_id ?? 'N/A',
                $sale->created_at->format('Y-m-d'),
                $sale->created_at->format('H:i:s'),
                $sale->user->name ?? 'N/A',
                $sale->table_number ?? 'N/A',
                $sale->subtotal ?? 0,
                $sale->service_charge_amount ?? 0,
                $sale->total_amount ?? 0,
                $sale->cash_amount ?? 0,
                $sale->card_amount ?? 0,
                $sale->pickme_amount ?? 0,
                $sale->uber_amount ?? 0,
                $totalCost,
                $profit,
                $sale->payment_method ?? 'N/A',
                $items
            );
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="sales_report.csv"');
    }
}
