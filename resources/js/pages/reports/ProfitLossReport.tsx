import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    CreditCard,
    Calendar,
    Download,
    Filter,
    ChevronDown,
    ChevronUp,
    PieChart as PieChartIcon,
    BarChart3,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import axios from 'axios';

interface RevenueData {
    total_revenue: number;
    subtotal: number;
    service_charges: number;
    tax: number;
    transaction_count: number;
    average_transaction: number;
    by_category: CategoryRevenue[];
    by_payment_method: {
        cash: number;
        card: number;
        pickme: number;
        uber: number;
    };
}

interface CategoryRevenue {
    category: string;
    qty_sold: number;
    revenue: number;
}

interface COGSData {
    total_cogs: number;
    from_sales_items: number;
    from_store_consumption: number;
    by_store_type: StoreConsumption[];
    method_used: string;
}

interface StoreConsumption {
    store_type: string;
    total_cost: number;
    consumption_count: number;
}

interface ExpensesData {
    total_expenses: number;
    by_category: ExpenseCategory[];
    by_payment_method: PaymentMethod[];
    expense_count: number;
}

interface ExpenseCategory {
    category: string;
    total_amount: number;
    expense_count: number;
}

interface PaymentMethod {
    method: string;
    amount: number;
}

interface ProfitMetrics {
    gross_profit: number;
    gross_profit_margin: number;
    operating_profit: number;
    operating_profit_margin: number;
    net_profit: number;
    net_profit_margin: number;
    ebitda: number;
    cogs_percentage: number;
    expense_percentage: number;
}

interface Comparison {
    revenue: ComparisonItem;
    cogs: ComparisonItem;
    expenses: ComparisonItem;
    net_profit: ComparisonItem;
    period: {
        start_date: string;
        end_date: string;
    };
}

interface ComparisonItem {
    current: number;
    previous: number;
    change: number;
    change_percent: number;
}

interface DailyTrend {
    date: string;
    day_name: string;
    revenue: number;
    cogs: number;
    expenses: number;
    gross_profit: number;
    net_profit: number;
    net_margin: number;
}

interface TopItem {
    product_name: string;
    qty_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

const ProfitLossReport: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // First day of month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [cogs, setCogs] = useState<COGSData | null>(null);
    const [expenses, setExpenses] = useState<ExpensesData | null>(null);
    const [profitMetrics, setProfitMetrics] = useState<ProfitMetrics | null>(null);
    const [comparison, setComparison] = useState<Comparison | null>(null);
    const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);

    const [showRevenue, setShowRevenue] = useState(true);
    const [showCOGS, setShowCOGS] = useState(true);
    const [showExpenses, setShowExpenses] = useState(true);
    const [showComparison, setShowComparison] = useState(true);

    useEffect(() => {
        fetchReport();
        fetchDailyTrend();
        fetchTopItems();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/profit-loss', {
                params: { start_date: startDate, end_date: endDate },
            });
            
            setRevenue(response.data.revenue);
            setCogs(response.data.cogs);
            setExpenses(response.data.expenses);
            setProfitMetrics(response.data.profit_metrics);
            setComparison(response.data.comparison);
        } catch (error) {
            console.error('Error fetching P&L report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyTrend = async () => {
        try {
            const response = await axios.get('/api/reports/profit-loss/daily-trend', {
                params: { start_date: startDate, end_date: endDate },
            });
            setDailyTrend(response.data.daily_trend);
        } catch (error) {
            console.error('Error fetching daily trend:', error);
        }
    };

    const fetchTopItems = async () => {
        try {
            const response = await axios.get('/api/reports/profit-loss/top-items', {
                params: { start_date: startDate, end_date: endDate, limit: 10 },
            });
            setTopItems(response.data.top_items);
        } catch (error) {
            console.error('Error fetching top items:', error);
        }
    };

    const handleApplyFilters = () => {
        fetchReport();
        fetchDailyTrend();
        fetchTopItems();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    const getChangeColor = (value: number, inverse: boolean = false) => {
        const isPositive = inverse ? value < 0 : value > 0;
        return isPositive ? 'text-green-600' : 'text-red-600';
    };

    const getChangeIcon = (value: number, inverse: boolean = false) => {
        const isPositive = inverse ? value < 0 : value > 0;
        return isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    };

    if (loading && !profitMetrics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/reports')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Back to Reports"
                            >
                                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">Profit & Loss Report</h1>
                                    <p className="text-sm text-slate-500">Comprehensive financial performance analysis</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    fetchReport();
                                    fetchDailyTrend();
                                    fetchTopItems();
                                }}
                                disabled={loading}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 font-medium">Filters:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">From:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">To:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            disabled={loading}
                            className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Key Metrics Cards */}
                {profitMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Gross Profit</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(profitMetrics.gross_profit)}
                                    </p>
                                    <p className="text-xs text-slate-500">{profitMetrics.gross_profit_margin.toFixed(2)}% margin</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Operating Profit</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(profitMetrics.operating_profit)}
                                    </p>
                                    <p className="text-xs text-slate-500">{profitMetrics.operating_profit_margin.toFixed(2)}% margin</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${profitMetrics.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <BarChart3 className={`w-6 h-6 ${profitMetrics.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Net Profit</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(profitMetrics.net_profit)}
                                    </p>
                                    <p className="text-xs text-slate-500">{profitMetrics.net_profit_margin.toFixed(2)}% margin</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <PieChartIcon className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">EBITDA</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(profitMetrics.ebitda)}
                                    </p>
                                    <p className="text-xs text-slate-500">Earnings before interest, tax</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue Section - keep existing but update className to match */}
                {revenue && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div
                            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                            onClick={() => setShowRevenue(!showRevenue)}
                        >
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                Revenue
                                <span className="text-green-600 font-bold ml-2">
                                    {formatCurrency(revenue.total_revenue)}
                                </span>
                            </h2>
                            {showRevenue ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>
                        
                        {showRevenue && (
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoBox label="Subtotal" value={formatCurrency(revenue.subtotal)} />
                                    <InfoBox label="Service Charges" value={formatCurrency(revenue.service_charges)} />
                                    <InfoBox label="Tax" value={formatCurrency(revenue.tax)} />
                                    <InfoBox label="Transactions" value={revenue.transaction_count.toString()} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Revenue by Category */}
                                    <div>
                                        <h3 className="font-semibold text-slate-700 mb-2">Revenue by Category</h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Revenue</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">%</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-200">
                                                {(revenue.by_category || []).map((cat, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2 text-sm text-slate-900">{cat.category}</td>
                                                            <td className="px-4 py-2 text-sm text-right text-slate-600">{cat.qty_sold}</td>
                                                            <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                                                {formatCurrency(cat.revenue)}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-right text-slate-600">
                                                                {((cat.revenue / revenue.total_revenue) * 100).toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Payment Method Breakdown */}
                                    <div>
                                        <h3 className="font-semibold text-slate-700 mb-2">Payment Methods</h3>
                                        <div className="space-y-2">
                                            <PaymentBar 
                                                label="Cash" 
                                                amount={revenue.by_payment_method?.cash || 0} 
                                                total={revenue.total_revenue}
                                                color="bg-green-500"
                                            />
                                            <PaymentBar 
                                                label="Card" 
                                                amount={revenue.by_payment_method?.card || 0} 
                                                total={revenue.total_revenue}
                                                color="bg-blue-500"
                                            />
                                            <PaymentBar 
                                                label="PickMe" 
                                                amount={revenue.by_payment_method?.pickme || 0} 
                                                total={revenue.total_revenue}
                                                color="bg-yellow-500"
                                            />
                                            <PaymentBar 
                                                label="Uber" 
                                                amount={revenue.by_payment_method?.uber || 0} 
                                                total={revenue.total_revenue}
                                                color="bg-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* COGS Section */}
                {cogs && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div
                            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                            onClick={() => setShowCOGS(!showCOGS)}
                    >
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-orange-600" />
                            Cost of Goods Sold
                            <span className="text-orange-600 font-bold ml-2">
                                {formatCurrency(cogs.total_cogs)}
                            </span>
                            {profitMetrics && (
                                <span className="text-sm text-gray-500 ml-2">
                                    ({profitMetrics.cogs_percentage.toFixed(1)}% of revenue)
                                </span>
                            )}
                        </h2>
                        {showCOGS ? <ChevronUp /> : <ChevronDown />}
                    </div>
                    
                    {showCOGS && (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InfoBox label="From Sales Items" value={formatCurrency(cogs.from_sales_items)} />
                                <InfoBox label="From Store Consumption" value={formatCurrency(cogs.from_store_consumption)} />
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-700 mb-2">COGS by Store Type</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Store Type</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total Cost</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Consumptions</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {(cogs.by_store_type || []).map((store, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 text-sm text-slate-900">{store.store_type}</td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                                        {formatCurrency(store.total_cost)}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right text-slate-600">
                                                        {store.consumption_count}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right text-slate-600">
                                                        {((store.total_cost / cogs.total_cogs) * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Expenses Section */}
            {expenses && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div
                        className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                        onClick={() => setShowExpenses(!showExpenses)}
                    >
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-red-600" />
                            Operating Expenses
                            <span className="text-red-600 font-bold ml-2">
                                {formatCurrency(expenses.total_expenses)}
                            </span>
                            {profitMetrics && (
                                <span className="text-sm text-slate-500 ml-2">
                                    ({profitMetrics.expense_percentage.toFixed(1)}% of revenue)
                                </span>
                            )}
                        </h2>
                        {showExpenses ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                    
                    {showExpenses && (
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-2">Expenses by Category</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Count</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                        {(expenses.by_category || []).map((cat, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 text-sm text-slate-900">{cat.category}</td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                                        {formatCurrency(cat.total_amount)}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right text-slate-600">
                                                        {cat.expense_count}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right text-slate-600">
                                                        {((cat.total_amount / expenses.total_expenses) * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Comparison with Previous Period */}
            {comparison && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div
                        className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                        onClick={() => setShowComparison(!showComparison)}
                    >
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            Period Comparison
                        </h2>
                        {showComparison ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                    
                    {showComparison && (
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                Comparing with previous period: {comparison.period.start_date} to {comparison.period.end_date}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <ComparisonCard
                                    title="Revenue"
                                    current={comparison.revenue.current}
                                    previous={comparison.revenue.previous}
                                    change={comparison.revenue.change}
                                    changePercent={comparison.revenue.change_percent}
                                />
                                <ComparisonCard
                                    title="COGS"
                                    current={comparison.cogs.current}
                                    previous={comparison.cogs.previous}
                                    change={comparison.cogs.change}
                                    changePercent={comparison.cogs.change_percent}
                                    inverse
                                />
                                <ComparisonCard
                                    title="Expenses"
                                    current={comparison.expenses.current}
                                    previous={comparison.expenses.previous}
                                    change={comparison.expenses.change}
                                    changePercent={comparison.expenses.change_percent}
                                    inverse
                                />
                                <ComparisonCard
                                    title="Net Profit"
                                    current={comparison.net_profit.current}
                                    previous={comparison.net_profit.previous}
                                    change={comparison.net_profit.change}
                                    changePercent={comparison.net_profit.change_percent}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Top Profitable Items */}
            {topItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800">Top 10 Profitable Items</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty Sold</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Revenue</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Cost</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Profit</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Margin %</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {topItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-sm text-slate-900">{item.product_name}</td>
                                        <td className="px-4 py-2 text-sm text-right text-slate-600">{item.qty_sold}</td>
                                        <td className="px-4 py-2 text-sm text-right text-slate-900">
                                            {formatCurrency(item.revenue)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right text-slate-600">
                                            {formatCurrency(item.cost)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right font-medium text-green-600">
                                            {formatCurrency(item.profit)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">
                                            <span className={item.margin >= 50 ? 'text-green-600 font-semibold' : 'text-slate-600'}>
                                                {item.margin.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

// Helper Components
interface MetricCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    bgColor: string;
    change?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, bgColor, change }) => (
    <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
            <div className={`${bgColor} p-2 rounded-lg text-white`}>{icon}</div>
            {change !== undefined && (
                <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
            )}
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
);

interface InfoBoxProps {
    label: string;
    value: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ label, value }) => (
    <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-lg font-semibold text-slate-900 mt-1">{value}</p>
    </div>
);

interface PaymentBarProps {
    label: string;
    amount: number;
    total: number;
    color: string;
}

const PaymentBar: React.FC<PaymentBarProps> = ({ label, amount, total, color }) => {
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total</p>
        </div>
    );
};

interface ComparisonCardProps {
    title: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    inverse?: boolean;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({
    title,
    current,
    previous,
    change,
    changePercent,
    inverse = false,
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const isPositive = inverse ? change < 0 : change > 0;
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-600 mb-2">{title}</h3>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(current)}</p>
            <p className="text-sm text-slate-500 mt-1">Previous: {formatCurrency(previous)}</p>
            <div className={`flex items-center gap-1 mt-2 ${changeColor}`}>
                <Icon className="w-4 h-4" />
                <span className="font-semibold">
                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
                <span className="text-xs">({formatCurrency(Math.abs(change))})</span>
            </div>
        </div>
    );
};

export default ProfitLossReport;
