import React, { useState, useEffect } from 'react';
import { Download, Search, Package, DollarSign, AlertTriangle, Clock, TrendingDown, Eye, Filter } from 'lucide-react';
import axios from 'axios';

interface Material {
    material_id: number;
    material_name: string;
    category: string;
    unit: string;
    hot_kitchen_qty: number;
    bakery_qty: number;
    pastry_qty: number;
    beverage_qty: number;
    total_qty: number;
    avg_cost: number;
    total_value: number;
    nearest_expiry: string | null;
    status: string;
}

interface Summary {
    total_value: number;
    total_materials: number;
    low_stock_count: number;
    expiring_count: number;
}

interface StoreValuation {
    store_id: number;
    store_name: string;
    material_count: number;
    total_value: number;
}

interface CategoryValuation {
    category: string;
    material_count: number;
    total_value: number;
}

interface Batch {
    id: number;
    batch_number: string;
    material_name?: string;
    store_id: number;
    store_name: string;
    quantity: number;
    unit: string;
    cost_per_unit: number;
    total_value: number;
    transferred_at: string;
    expiry_date: string | null;
    days_until_expiry: number | null;
    age_days: number | null;
    status: string;
}

interface StockSummary {
    total_quantity: number;
    total_value: number;
    avg_daily_consumption: number;
    days_remaining: number | null;
    last_received_date: string | null;
    last_received_qty: number | null;
}

interface LowStockItem {
    material_id: number;
    material_name: string;
    store_id: number;
    store_name: string;
    current_qty: number;
    unit: string;
    minimum_required: number;
    deficit: number;
}

interface NearExpiryItem {
    material_id: number;
    material_name: string;
    batch_number: string;
    quantity: number;
    unit: string;
    expiry_date: string;
    days_remaining: number;
    store_id: number;
    store_name: string;
    urgency: string;
}

interface OutOfStockItem {
    material_id: number;
    material_name: string;
    category: string;
}

interface ReorderSuggestion {
    material_id: number;
    material_name: string;
    category: string;
    current_stock: number;
    avg_daily_consumption: number;
    days_remaining: number;
    suggested_qty: number;
    priority: string;
}

const InventoryReport: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'valuation' | 'alerts' | 'batches' | 'reorder'>('overview');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [summary, setSummary] = useState<Summary>({ total_value: 0, total_materials: 0, low_stock_count: 0, expiring_count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [storeFilter, setStoreFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Valuation data
    const [storeValuation, setStoreValuation] = useState<StoreValuation[]>([]);
    const [categoryValuation, setCategoryValuation] = useState<CategoryValuation[]>([]);

    // Alerts data
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [nearExpiry, setNearExpiry] = useState<NearExpiryItem[]>([]);
    const [outOfStock, setOutOfStock] = useState<OutOfStockItem[]>([]);

    // Batches data
    const [batches, setBatches] = useState<Batch[]>([]);

    // Reorder data
    const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);

    // Material details modal
    const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
    const [materialBatches, setMaterialBatches] = useState<Batch[]>([]);
    const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchInventory();
        } else if (activeTab === 'valuation') {
            fetchValuation();
        } else if (activeTab === 'alerts') {
            fetchAlerts();
        } else if (activeTab === 'batches') {
            fetchBatches();
        } else if (activeTab === 'reorder') {
            fetchReorderSuggestions();
        }
    }, [activeTab, searchTerm, categoryFilter, storeFilter, statusFilter]);

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (storeFilter !== 'all') params.append('store_id', storeFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
            setMaterials(Array.isArray(response.data?.materials) ? response.data.materials : []);
            setSummary(response.data?.summary || { total_value: 0, total_materials: 0, low_stock_count: 0, expiring_count: 0 });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch inventory data');
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchValuation = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/inventory/valuation');
            setStoreValuation(Array.isArray(response.data?.by_store) ? response.data.by_store : []);
            setCategoryValuation(Array.isArray(response.data?.by_category) ? response.data.by_category : []);
        } catch (err) {
            console.error('Error fetching valuation:', err);
            setStoreValuation([]);
            setCategoryValuation([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/inventory/alerts');
            setLowStock(Array.isArray(response.data?.low_stock) ? response.data.low_stock : []);
            setNearExpiry(Array.isArray(response.data?.near_expiry) ? response.data.near_expiry : []);
            setOutOfStock(Array.isArray(response.data?.out_of_stock) ? response.data.out_of_stock : []);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setLowStock([]);
            setNearExpiry([]);
            setOutOfStock([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (storeFilter !== 'all') params.append('store_id', storeFilter);

            const response = await axios.get(`/api/reports/inventory/batches?${params.toString()}`);
            setBatches(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching batches:', err);
            setBatches([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReorderSuggestions = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/inventory/reorder');
            setReorderSuggestions(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching reorder suggestions:', err);
            setReorderSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterialDetails = async (materialId: number) => {
        try {
            const response = await axios.get(`/api/reports/inventory/material/${materialId}`);
            setMaterialBatches(Array.isArray(response.data?.batches) ? response.data.batches : []);
            setStockSummary(response.data?.stock_summary || null);
            setSelectedMaterial(materialId);
            setShowDetailsModal(true);
        } catch (err) {
            console.error('Error fetching material details:', err);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (storeFilter !== 'all') params.append('store_id', storeFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await axios.get(`/api/reports/inventory/export?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error exporting report:', err);
            alert('Failed to export report');
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${amount.toFixed(2)}`;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            normal: 'bg-green-100 text-green-800',
            low: 'bg-yellow-100 text-yellow-800',
            out: 'bg-red-100 text-red-800',
            expiring: 'bg-orange-100 text-orange-800',
        };
        const labels: Record<string, string> = {
            normal: 'Normal',
            low: 'Low Stock',
            out: 'Out of Stock',
            expiring: 'Expiring Soon',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getBatchStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            fresh: 'bg-green-100 text-green-800',
            aging: 'bg-yellow-100 text-yellow-800',
            near_expiry: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800',
            expired: 'bg-red-600 text-white',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-blue-100 text-blue-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
                {priority.toUpperCase()}
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
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                    <Package className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">Inventory Report</h1>
                                    <p className="text-sm text-slate-500">Current stock levels and inventory management</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Total Inventory Value</p>
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.total_value)}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Total Materials</p>
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{summary.total_materials}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Low Stock Items</p>
                            <TrendingDown className="w-5 h-5 text-yellow-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{summary.low_stock_count}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600">Near Expiry Items</p>
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{summary.expiring_count}</p>
                    </div>
                </div>

                {/* Filters */}
                {activeTab === 'overview' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search materials..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All</option>
                                    <option value="Dry Goods">Dry Goods</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Meat">Meat</option>
                                    <option value="Seafood">Seafood</option>
                                    <option value="Beverages">Beverages</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store</label>
                                <select
                                    value={storeFilter}
                                    onChange={(e) => setStoreFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All</option>
                                    <option value="1">Hot Kitchen</option>
                                    <option value="2">Bakery</option>
                                    <option value="3">Pastry</option>
                                    <option value="4">Beverage</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All</option>
                                    <option value="normal">Normal</option>
                                    <option value="low">Low Stock</option>
                                    <option value="expiring">Expiring Soon</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchInventory}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters for Batches Tab */}
                {activeTab === 'batches' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store</label>
                                <select
                                    value={storeFilter}
                                    onChange={(e) => setStoreFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All</option>
                                    <option value="1">Hot Kitchen</option>
                                    <option value="2">Bakery</option>
                                    <option value="3">Pastry</option>
                                    <option value="4">Beverage</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchBatches}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div className="border-b border-slate-200">
                        <nav className="flex -mb-px">
                            {['overview', 'valuation', 'alerts', 'batches', 'reorder'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                                        activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hot Kitchen</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bakery</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pastry</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beverage</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {materials.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                                        No inventory data found
                                                    </td>
                                                </tr>
                                            ) : (
                                                materials.map((material) => (
                                                    <tr key={material.material_id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-medium text-gray-900">{material.material_name}</div>
                                                            <div className="text-xs text-gray-500">{material.category}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                            {material.hot_kitchen_qty} {material.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                            {material.bakery_qty} {material.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                            {material.pastry_qty} {material.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                            {material.beverage_qty} {material.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                            {material.total_qty} {material.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                            {formatCurrency(material.total_value)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {getStatusBadge(material.status)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => fetchMaterialDetails(material.material_id)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Valuation Tab */}
                            {activeTab === 'valuation' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">By Store</h3>
                                        <div className="space-y-3">
                                            {storeValuation.map((store) => (
                                                <div key={store.store_id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{store.store_name}</p>
                                                            <p className="text-sm text-slate-500">{store.material_count} materials</p>
                                                        </div>
                                                        <p className="text-lg font-bold text-slate-900">
                                                            {formatCurrency(store.total_value)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">By Category</h3>
                                        <div className="space-y-3">
                                            {categoryValuation.map((cat, idx) => (
                                                <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{cat.category}</p>
                                                            <p className="text-sm text-slate-500">{cat.material_count} materials</p>
                                                        </div>
                                                        <p className="text-lg font-bold text-slate-900">
                                                            {formatCurrency(cat.total_value)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alerts Tab */}
                            {activeTab === 'alerts' && (
                                <div className="space-y-6">
                                    {/* Low Stock */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <TrendingDown className="w-5 h-5 mr-2 text-yellow-600" />
                                            Low Stock Items ({lowStock.length})
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Store</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Minimum</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Deficit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {lowStock.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No low stock items</td>
                                                        </tr>
                                                    ) : (
                                                        lowStock.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{item.material_name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{item.store_name}</td>
                                                                <td className="px-4 py-2 text-sm text-right text-gray-600">{item.current_qty} {item.unit}</td>
                                                                <td className="px-4 py-2 text-sm text-right text-gray-600">{item.minimum_required} {item.unit}</td>
                                                                <td className="px-4 py-2 text-sm text-right text-red-600 font-medium">-{item.deficit} {item.unit}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Near Expiry */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                            Near Expiry Items ({nearExpiry.length})
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Batch</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Store</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Expiry Date</th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Days Left</th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Urgency</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {nearExpiry.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-4 text-center text-gray-500">No near expiry items</td>
                                                        </tr>
                                                    ) : (
                                                        nearExpiry.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{item.material_name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{item.batch_number}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{item.store_name}</td>
                                                                <td className="px-4 py-2 text-sm text-right text-gray-600">{item.quantity} {item.unit}</td>
                                                                <td className="px-4 py-2 text-sm text-center text-gray-600">{new Date(item.expiry_date).toLocaleDateString()}</td>
                                                                <td className="px-4 py-2 text-sm text-center">
                                                                    <span className={item.urgency === 'critical' ? 'text-red-600 font-medium' : 'text-orange-600'}>
                                                                        {item.days_remaining} days
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <span className={`px-2 py-1 rounded text-xs ${item.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                        {item.urgency.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Out of Stock */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <Package className="w-5 h-5 mr-2 text-red-600" />
                                            Out of Stock Items ({outOfStock.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {outOfStock.length === 0 ? (
                                                <p className="col-span-3 text-center text-slate-500 py-4">No out of stock items</p>
                                            ) : (
                                                outOfStock.map((item, idx) => (
                                                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <p className="font-medium text-slate-900">{item.material_name}</p>
                                                        <p className="text-sm text-slate-600">{item.category}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Batches Tab */}
                            {activeTab === 'batches' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Batch</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Material</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Store</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Quantity</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Transferred</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Expiry</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Age</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                                            </tr>
                                        </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                            {batches.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No batches found</td>
                                                </tr>
                                            ) : (
                                                batches.map((batch) => (
                                                    <tr key={batch.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">{batch.batch_number}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{batch.material_name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{batch.store_name}</td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">{batch.quantity} {batch.unit}</td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                                                            {batch.transferred_at ? new Date(batch.transferred_at).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                                                            {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                                                            {batch.age_days ? `${batch.age_days} days` : 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {getBatchStatusBadge(batch.status)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Reorder Tab */}
                            {activeTab === 'reorder' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Material</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Current Stock</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Daily Usage</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Days Left</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Suggested Qty</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reorderSuggestions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No reorder suggestions</td>
                                                </tr>
                                            ) : (
                                                reorderSuggestions.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-medium text-gray-900">{item.material_name}</div>
                                                            <div className="text-xs text-gray-500">{item.category}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">{item.current_stock.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">{item.avg_daily_consumption}</td>
                                                        <td className="px-4 py-3 text-sm text-right">
                                                            <span className={item.days_remaining <= 2 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                                {item.days_remaining} days
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{item.suggested_qty}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {getPriorityBadge(item.priority)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            </div>

            {/* Material Details Modal */}
            {showDetailsModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Material Details</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Stock Summary */}
                            {stockSummary && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Total Quantity</p>
                                        <p className="text-xl font-bold text-gray-900">{stockSummary.total_quantity}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Total Value</p>
                                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stockSummary.total_value)}</p>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Daily Usage</p>
                                        <p className="text-xl font-bold text-gray-900">{stockSummary.avg_daily_consumption}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Days Remaining</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {stockSummary.days_remaining ? stockSummary.days_remaining.toFixed(1) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Last Received</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {stockSummary.last_received_date ? new Date(stockSummary.last_received_date).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500">{stockSummary.last_received_qty || 'N/A'} units</p>
                                    </div>
                                </div>
                            )}

                            {/* Batches */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Batches (FIFO Order)</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Batch</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Store</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Value</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Transferred</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Expiry</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {materialBatches.map((batch) => (
                                            <tr key={batch.id}>
                                                <td className="px-3 py-2 text-sm text-gray-900">{batch.batch_number}</td>
                                                <td className="px-3 py-2 text-sm text-gray-600">{batch.store_name}</td>
                                                <td className="px-3 py-2 text-sm text-right text-gray-600">{batch.quantity} {batch.unit}</td>
                                                <td className="px-3 py-2 text-sm text-right text-gray-900">{formatCurrency(batch.total_value)}</td>
                                                <td className="px-3 py-2 text-sm text-center text-gray-600">
                                                    {batch.transferred_at ? new Date(batch.transferred_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center text-gray-600">
                                                    {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {getBatchStatusBadge(batch.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryReport;
