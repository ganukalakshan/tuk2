import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Package,
    ShoppingCart,
    DollarSign,
    Calendar,
    Filter,
    Download,
    AlertCircle,
    CheckCircle,
    Clock,
    BarChart3,
    PieChart as PieChartIcon,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from 'lucide-react';
import axios from 'axios';

interface FastMovingItem {
    rank: number;
    product_name: string;
    menu_item_id: number | null;
    category: string;
    quantity_sold: number;
    transaction_count: number;
    avg_quantity_per_order: number;
    revenue: number;
    cost: number;
    profit: number;
    profit_margin: number;
    avg_price: number;
    velocity: number;
    previous_quantity: number;
    quantity_change: number;
    trend: 'rising' | 'declining' | 'stable';
    stock_level: {
        available: number | null;
        status: 'not_tracked' | 'out_of_stock' | 'low' | 'moderate' | 'good';
    } | null;
    first_sale: string;
    last_sale: string;
}

interface Summary {
    unique_items: number;
    total_quantity_sold: number;
    total_revenue: number;
    avg_items_per_day: number;
}

interface CategoryBreakdown {
    category: string;
    quantity: number;
    revenue: number;
    item_count: number;
}

interface HourlyPattern {
    hour: number;
    label: string;
    quantity: number;
    transaction_count: number;
}

interface TopByCategory {
    category: string;
    items: {
        product_name: string;
        quantity: number;
        revenue: number;
    }[];
}

interface FrequentCombo {
    item1: string;
    item2: string;
    frequency: number;
}

const FastMovingReport: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('quantity');
    const [limit, setLimit] = useState(50);
    const [minQuantity, setMinQuantity] = useState(1);

    const [items, setItems] = useState<FastMovingItem[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
    const [hourlyPattern, setHourlyPattern] = useState<HourlyPattern[]>([]);
    const [topByCategory, setTopByCategory] = useState<TopByCategory[]>([]);
    const [frequentCombos, setFrequentCombos] = useState<FrequentCombo[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(true);
    const [showHourlyPattern, setShowHourlyPattern] = useState(true);
    const [showTopByCategory, setShowTopByCategory] = useState(false);
    const [showFrequentCombos, setShowFrequentCombos] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchReport();
        fetchTopByCategory();
        fetchFrequentCombos();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/reports/fast-moving/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/fast-moving', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    category: category,
                    sort_by: sortBy,
                    limit: limit,
                    min_quantity: minQuantity,
                },
            });

            setItems(response.data.items);
            setSummary(response.data.summary);
            setCategoryBreakdown(response.data.category_breakdown);
            setHourlyPattern(response.data.hourly_pattern);
        } catch (error) {
            console.error('Error fetching fast moving report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopByCategory = async () => {
        try {
            const response = await axios.get('/api/reports/fast-moving/top-by-category', {
                params: { start_date: startDate, end_date: endDate, limit: 5 },
            });
            setTopByCategory(response.data);
        } catch (error) {
            console.error('Error fetching top by category:', error);
        }
    };

    const fetchFrequentCombos = async () => {
        try {
            const response = await axios.get('/api/reports/fast-moving/frequent-combos', {
                params: { start_date: startDate, end_date: endDate, limit: 15 },
            });
            setFrequentCombos(response.data);
        } catch (error) {
            console.error('Error fetching frequent combos:', error);
        }
    };

    const handleApplyFilters = () => {
        fetchReport();
        fetchTopByCategory();
        fetchFrequentCombos();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'rising':
                return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'declining':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            default:
                return <Minus className="w-4 h-4 text-gray-600" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'rising':
                return 'text-green-600 bg-green-50';
            case 'declining':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStockStatusBadge = (status: string) => {
        const styles = {
            good: 'bg-green-100 text-green-800',
            moderate: 'bg-blue-100 text-blue-800',
            low: 'bg-yellow-100 text-yellow-800',
            out_of_stock: 'bg-red-100 text-red-800',
            not_tracked: 'bg-gray-100 text-gray-800',
        };

        const labels = {
            good: 'Good',
            moderate: 'Moderate',
            low: 'Low Stock',
            out_of_stock: 'Out of Stock',
            not_tracked: 'Not Tracked',
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    if (loading && items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">Fast Moving Items Report</h1>
                                    <p className="text-sm text-slate-500">Top selling products with velocity analysis</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    fetchReport();
                                    fetchTopByCategory();
                                    fetchFrequentCombos();
                                }}
                                disabled={loading}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">To:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Category:</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="all">All</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="quantity">Quantity Sold</option>
                                <option value="revenue">Revenue</option>
                                <option value="profit">Profit</option>
                                <option value="velocity">Velocity</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Top Items:</label>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="10">Top 10</option>
                                <option value="20">Top 20</option>
                                <option value="50">Top 50</option>
                                <option value="100">Top 100</option>
                            </select>
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
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Unique Items Sold</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {summary.unique_items.toString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <ShoppingCart className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Units Sold</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {summary.total_quantity_sold.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Revenue</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(summary.total_revenue)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Avg Items/Day</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {summary.avg_items_per_day.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fast Moving Items Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            Fast Moving Items
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty Sold</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Velocity</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Profit</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Margin %</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Trend</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {items.map((item) => (
                                    <tr key={item.rank} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                                                {item.rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-900">{item.product_name}</div>
                                            <div className="text-xs text-slate-500">{item.transaction_count} orders</div>
                                            </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">{item.quantity_sold}</div>
                                            <div className="text-xs text-slate-500">
                                                {item.avg_quantity_per_order.toFixed(1)}/order
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="text-sm font-medium text-blue-600">{item.velocity.toFixed(1)}</div>
                                            <div className="text-xs text-slate-500">units/day</div>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap text-sm font-medium text-slate-900">
                                            {formatCurrency(item.revenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap text-sm font-medium text-green-600">
                                            {formatCurrency(item.profit)}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${item.profit_margin >= 50 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                                {item.profit_margin.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor(item.trend)}`}>
                                                {getTrendIcon(item.trend)}
                                                <span className="text-xs font-medium">{item.quantity_change.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            {item.stock_level ? getStockStatusBadge(item.stock_level.status) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Breakdown */}
                {categoryBreakdown.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div
                            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                            onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                        >
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                Category Performance
                            </h2>
                            {showCategoryBreakdown ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>

                        {showCategoryBreakdown && (
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Items</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty Sold</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Revenue</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Avg/Item</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {categoryBreakdown.map((cat, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 text-sm font-medium text-slate-900">{cat.category}</td>
                                                    <td className="px-4 py-2 text-sm text-right text-slate-600">{cat.item_count}</td>
                                                    <td className="px-4 py-2 text-sm text-right font-semibold text-slate-900">
                                                        {cat.quantity.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                                        {formatCurrency(cat.revenue)}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right text-slate-600">
                                                        {formatCurrency(cat.revenue / cat.item_count)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Hourly Pattern */}
                {hourlyPattern.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div
                            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                            onClick={() => setShowHourlyPattern(!showHourlyPattern)}
                        >
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                Hourly Sales Pattern
                            </h2>
                            {showHourlyPattern ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>

                        {showHourlyPattern && (
                            <div className="p-6">
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                                    {hourlyPattern.map((hour) => {
                                        const maxQty = Math.max(...hourlyPattern.map((h) => h.quantity));
                                        const heightPercent = (hour.quantity / maxQty) * 100;
                                        return (
                                            <div key={hour.hour} className="text-center">
                                                <div className="h-24 flex items-end justify-center mb-2">
                                                    <div
                                                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                                        style={{ height: `${heightPercent}%` }}
                                                        title={`${hour.quantity} items`}
                                                    ></div>
                                                </div>
                                                <div className="text-xs font-medium text-slate-700">{hour.label}</div>
                                                <div className="text-xs text-slate-500">{hour.quantity}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Top Items by Category */}
                {topByCategory.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div
                            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                            onClick={() => setShowTopByCategory(!showTopByCategory)}
                        >
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                                Top 5 Items by Category
                            </h2>
                            {showTopByCategory ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>

                        {showTopByCategory && (
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {topByCategory.map((catData, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-lg p-4">
                                            <h3 className="font-semibold text-slate-900 mb-3">{catData.category}</h3>
                                            <div className="space-y-2">
                                                {catData.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-700">{item.product_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {item.quantity} units
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {formatCurrency(item.revenue)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Frequent Combos */}
                {frequentCombos.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div
                            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200"
                            onClick={() => setShowFrequentCombos(!showFrequentCombos)}
                        >
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-purple-600" />
                                Frequently Bought Together
                            </h2>
                            {showFrequentCombos ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>

                        {showFrequentCombos && (
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {frequentCombos.map((combo, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900">{combo.item1}</span>
                                                <span className="text-slate-400">+</span>
                                                <span className="text-sm font-medium text-slate-900">{combo.item2}</span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-600">
                                                Bought together <span className="font-semibold">{combo.frequency}</span> times
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FastMovingReport;
