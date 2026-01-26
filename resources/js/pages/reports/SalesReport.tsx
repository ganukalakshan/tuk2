import React, { useState, useEffect } from 'react';
import {
    Download,
    Filter,
    DollarSign,
    ShoppingBag,
    TrendingUp,
    CreditCard,
    Banknote,
    Users,
    Clock,
    ChevronDown,
    ChevronUp,
    PieChart,
} from 'lucide-react';
import axios from 'axios';

interface Sale {
    id: number;
    order_id: string;
    created_at: string;
    table_number: string | null;
    subtotal: number;
    service_charge_amount: number;
    total_amount: number;
    cash_amount: number;
    card_amount: number;
    pickme_amount: number;
    uber_amount: number;
    payment_method: string;
    user: { id: number; name: string } | null;
    customer: { id: number; name: string } | null;
    sales_items: SalesItem[];
}

interface SalesItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
    total_price: number;
}

interface Summary {
    total_sales: number;
    total_transactions: number;
    average_sale: number;
    total_subtotal: number;
    total_service_charge: number;
    cash_total: number;
    card_total: number;
    pickme_total: number;
    uber_total: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin: number;
}

interface PaymentBreakdown {
    method: string;
    amount: number;
    percentage: number;
}

interface TopItem {
    product_name: string;
    category: string;
    qty_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

interface CategorySales {
    category: string;
    qty_sold: number;
    revenue: number;
    percentage: number;
}

interface StaffSales {
    id: number;
    name: string;
    transactions: number;
    total_sales: number;
    avg_sale: number;
}

interface HourlySales {
    hour: number;
    label: string;
    transactions: number;
    total_sales: number;
}

interface Cashier {
    id: number;
    name: string;
}

export default function SalesReport() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [staffSales, setStaffSales] = useState<StaffSales[]>([]);
    const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedSale, setExpandedSale] = useState<number | null>(null);

    // Filter options
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [tables, setTables] = useState<string[]>([]);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');
    const [userId, setUserId] = useState('all');
    const [tableNumber, setTableNumber] = useState('all');

    // Active tab
    const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'categories' | 'staff' | 'hourly'>('overview');

    useEffect(() => {
        fetchCashiers();
        fetchTables();
        fetchReport();
    }, []);

    const fetchCashiers = async () => {
        try {
            const response = await axios.get('/api/reports/sales/cashiers');
            setCashiers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching cashiers:', err);
            setCashiers([]);
        }
    };

    const fetchTables = async () => {
        try {
            const response = await axios.get('/api/reports/sales/tables');
            setTables(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching tables:', err);
            setTables([]);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (paymentMethod !== 'all') params.append('payment_method', paymentMethod);
            if (userId !== 'all') params.append('user_id', userId);
            if (tableNumber !== 'all') params.append('table_number', tableNumber);

            const [salesRes, paymentRes, itemsRes, categoryRes, staffRes, hourlyRes] = await Promise.all([
                axios.get(`/api/reports/sales?${params.toString()}`),
                axios.get(`/api/reports/sales/payment-breakdown?${params.toString()}`),
                axios.get(`/api/reports/sales/top-items?${params.toString()}`),
                axios.get(`/api/reports/sales/by-category?${params.toString()}`),
                axios.get(`/api/reports/sales/by-staff?${params.toString()}`),
                axios.get(`/api/reports/sales/hourly?${params.toString()}`),
            ]);

            setSales(Array.isArray(salesRes.data?.sales) ? salesRes.data.sales : []);
            setSummary(salesRes.data?.summary || null);
            setPaymentBreakdown(Array.isArray(paymentRes.data) ? paymentRes.data : []);
            setTopItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
            setCategorySales(Array.isArray(categoryRes.data) ? categoryRes.data : []);
            setStaffSales(Array.isArray(staffRes.data) ? staffRes.data : []);
            setHourlySales(Array.isArray(hourlyRes.data) ? hourlyRes.data : []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch sales data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (paymentMethod !== 'all') params.append('payment_method', paymentMethod);
            if (userId !== 'all') params.append('user_id', userId);

            const response = await axios.get(`/api/reports/sales/export?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error exporting report:', err);
        }
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        const num = Number(amount) || 0;
        return `Rs. ${num.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPaymentMethodBadge = (method: string) => {
        const styles: Record<string, string> = {
            cash: 'bg-green-100 text-green-800',
            card: 'bg-blue-100 text-blue-800',
            pickme: 'bg-orange-100 text-orange-800',
            uber: 'bg-gray-100 text-gray-800',
            partial: 'bg-purple-100 text-purple-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[method] || 'bg-gray-100 text-gray-800'}`}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => window.history.back()}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                                    <DollarSign className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">Sales Report</h1>
                                    <p className="text-sm text-slate-500">Daily sales analysis and performance metrics</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={loading || sales.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="pickme">PickMe</option>
                                <option value="uber">Uber</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cashier</label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All</option>
                                {cashiers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Table</label>
                            <select
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All</option>
                                {tables.map((t) => (
                                    <option key={t} value={t}>Table {t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchReport}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Total Sales</p>
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.total_sales)}</p>
                                    <p className="text-sm text-slate-500 mt-1">{summary.total_transactions} transactions</p>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Average Sale</p>
                                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.average_sale)}</p>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Gross Profit</p>
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.total_profit)}</p>
                                    <p className="text-sm text-emerald-600 mt-1">{(Number(summary.profit_margin) || 0).toFixed(1)}% margin</p>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Service Charges</p>
                                        <CreditCard className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.total_service_charge)}</p>
                                </div>
                            </div>
                        )}

                        {/* Payment Breakdown */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Payment Method Breakdown</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {paymentBreakdown.map((pm) => (
                                    <div key={pm.method} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            {pm.method === 'Cash' && <Banknote className="w-5 h-5 text-green-600" />}
                                            {pm.method === 'Card' && <CreditCard className="w-5 h-5 text-blue-600" />}
                                            {pm.method === 'PickMe' && <ShoppingBag className="w-5 h-5 text-orange-600" />}
                                            {pm.method === 'Uber' && <ShoppingBag className="w-5 h-5 text-gray-600" />}
                                            <span className="font-medium text-slate-700">{pm.method}</span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-800">{formatCurrency(pm.amount)}</p>
                                        <p className="text-sm text-slate-500">{pm.percentage}% of total</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                            <div className="border-b border-slate-200">
                                <nav className="flex -mb-px">
                                    {[
                                        { key: 'overview', label: 'Sales Details' },
                                        { key: 'items', label: 'Top Items' },
                                        { key: 'categories', label: 'By Category' },
                                        { key: 'staff', label: 'By Staff' },
                                        { key: 'hourly', label: 'Hourly' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key as any)}
                                            className={`px-6 py-3 text-sm font-medium border-b-2 ${
                                                activeTab === tab.key
                                                    ? 'border-green-500 text-green-600'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6">
                                {/* Sales Details Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-4">
                                        {sales.length === 0 ? (
                                            <div className="text-center py-12">
                                                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-500">No sales found for the selected filters.</p>
                                            </div>
                                        ) : (
                                            sales.map((sale) => (
                                                <div key={sale.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                                                        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-left">
                                                                <p className="font-medium text-slate-800">Sale #{sale.id}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    {formatDate(sale.created_at)} at {formatTime(sale.created_at)}
                                                                </p>
                                                            </div>
                                                            {sale.table_number && (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                                    Table {sale.table_number}
                                                                </span>
                                                            )}
                                                            {getPaymentMethodBadge(sale.payment_method)}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <p className="font-bold text-slate-800">{formatCurrency(sale.total_amount)}</p>
                                                            {expandedSale === sale.id ? (
                                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                    </button>
                                                    {expandedSale === sale.id && (
                                                        <div className="px-4 py-3 border-t border-slate-200">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Cashier</p>
                                                                    <p className="text-sm font-medium text-slate-800">{sale.user?.name || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Subtotal</p>
                                                                    <p className="text-sm font-medium text-slate-800">{formatCurrency(sale.subtotal)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Service Charge</p>
                                                                    <p className="text-sm font-medium text-slate-800">{formatCurrency(sale.service_charge_amount)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Total</p>
                                                                    <p className="text-sm font-bold text-slate-800">{formatCurrency(sale.total_amount)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Cash</p>
                                                                    <p className="text-sm font-medium text-green-600">{formatCurrency(sale.cash_amount)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Card</p>
                                                                    <p className="text-sm font-medium text-blue-600">{formatCurrency(sale.card_amount)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">PickMe</p>
                                                                    <p className="text-sm font-medium text-orange-600">{formatCurrency(sale.pickme_amount)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Uber</p>
                                                                    <p className="text-sm font-medium text-gray-600">{formatCurrency(sale.uber_amount)}</p>
                                                                </div>
                                                            </div>
                                                            {sale.sales_items && sale.sales_items.length > 0 && (
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-700 mb-2">Items</p>
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="text-slate-500 border-b border-slate-200">
                                                                                <th className="text-left py-1">Item</th>
                                                                                <th className="text-right py-1">Qty</th>
                                                                                <th className="text-right py-1">Price</th>
                                                                                <th className="text-right py-1">Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {sale.sales_items.map((item) => (
                                                                                <tr key={item.id} className="border-b border-slate-100">
                                                                                    <td className="py-1 text-slate-800">{item.product_name}</td>
                                                                                    <td className="py-1 text-right text-slate-600">{item.quantity}</td>
                                                                                    <td className="py-1 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                                                                                    <td className="py-1 text-right text-slate-800">{formatCurrency(item.total_price)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Top Items Tab */}
                                {activeTab === 'items' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty Sold</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Revenue</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Cost</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Profit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Margin</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {topItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No data available</td>
                                                    </tr>
                                                ) : (
                                                    topItems.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                                                                <p className="text-xs text-slate-500">{item.category}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right text-slate-600">{item.qty_sold}</td>
                                                            <td className="px-4 py-3 text-sm text-right text-slate-800">{formatCurrency(item.revenue)}</td>
                                                            <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(item.cost)}</td>
                                                            <td className="px-4 py-3 text-sm text-right text-emerald-600 font-medium">{formatCurrency(item.profit)}</td>
                                                            <td className="px-4 py-3 text-sm text-right">
                                                                <span className={`${item.margin >= 30 ? 'text-green-600' : item.margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                    {item.margin}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* By Category Tab */}
                                {activeTab === 'categories' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            {categorySales.map((cat, idx) => (
                                                <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <p className="font-medium text-slate-800">{cat.category}</p>
                                                        <p className="text-lg font-bold text-slate-800">{formatCurrency(cat.revenue)}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                                        <span>{cat.qty_sold} items sold</span>
                                                        <span>{cat.percentage}% of total</span>
                                                    </div>
                                                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{ width: `${cat.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <PieChart className="w-48 h-48 text-slate-200" />
                                        </div>
                                    </div>
                                )}

                                {/* By Staff Tab */}
                                {activeTab === 'staff' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cashier</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Transactions</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Sales</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Avg Sale</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {staffSales.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No data available</td>
                                                    </tr>
                                                ) : (
                                                    staffSales.map((staff) => (
                                                        <tr key={staff.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-slate-400" />
                                                                    <span className="text-sm font-medium text-slate-800">{staff.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right text-slate-600">{staff.transactions}</td>
                                                            <td className="px-4 py-3 text-sm text-right text-slate-800 font-medium">{formatCurrency(staff.total_sales)}</td>
                                                            <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(staff.avg_sale)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Hourly Tab */}
                                {activeTab === 'hourly' && (
                                    <div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hour</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Transactions</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Sales</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Activity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-200">
                                                    {hourlySales.filter(h => h.transactions > 0).map((hour) => {
                                                        const maxSales = Math.max(...hourlySales.map(h => h.total_sales));
                                                        const percentage = maxSales > 0 ? (hour.total_sales / maxSales) * 100 : 0;
                                                        return (
                                                            <tr key={hour.hour} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 text-sm text-slate-800">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                                        {hour.label}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right text-slate-600">{hour.transactions}</td>
                                                                <td className="px-4 py-3 text-sm text-right text-slate-800 font-medium">{formatCurrency(hour.total_sales)}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-green-500 rounded-full"
                                                                            style={{ width: `${percentage}%` }}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
