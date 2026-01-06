import { useState, useEffect } from 'react';
import { 
    Warehouse, 
    Package, 
    Download, 
    Calendar, 
    RefreshCw, 
    ChevronDown, 
    ChevronUp,
    Filter,
    BarChart3,
    Layers,
    DollarSign
} from 'lucide-react';

interface Batch {
    batch_number: string;
    quantity: number;
    original_quantity: number;
    cost_per_unit: number;
    expiry_date: string | null;
    transferred_at: string;
}

interface MaterialItem {
    material_id: number;
    material_code: string;
    material_name: string;
    total_quantity: number;
    total_original_quantity: number;
    unit: string;
    unit_name: string;
    total_cost: number;
    batch_count: number;
    batches: Batch[];
}

interface StoreSummary {
    total_materials: number;
    total_cost: number;
}

interface StoreReport {
    store_id: number;
    store_name: string;
    store_key: string;
    materials: MaterialItem[];
    summary: StoreSummary;
}

interface GrandSummary {
    total_stores: number;
    total_materials: number;
    total_cost: number;
}

interface ReportData {
    stores: StoreReport[];
    grand_summary: GrandSummary;
    filters: {
        date_from: string | null;
        date_to: string | null;
    };
}

// Store color configuration
const storeColors: Record<string, { bg: string; border: string; text: string; light: string; icon: string }> = {
    grn_store: { 
        bg: 'bg-purple-500', 
        border: 'border-purple-200', 
        text: 'text-purple-700',
        light: 'bg-purple-50',
        icon: '📥'
    },
    hot_kitchen: { 
        bg: 'bg-orange-500', 
        border: 'border-orange-200', 
        text: 'text-orange-700',
        light: 'bg-orange-50',
        icon: '🔥'
    },
    beverage: { 
        bg: 'bg-blue-500', 
        border: 'border-blue-200', 
        text: 'text-blue-700',
        light: 'bg-blue-50',
        icon: '🥤'
    },
    pastry: { 
        bg: 'bg-pink-500', 
        border: 'border-pink-200', 
        text: 'text-pink-700',
        light: 'bg-pink-50',
        icon: '🧁'
    },
    bakery: { 
        bg: 'bg-amber-500', 
        border: 'border-amber-200', 
        text: 'text-amber-700',
        light: 'bg-amber-50',
        icon: '🍞'
    },
};

const getStoreColor = (key: string) => {
    return storeColors[key] || { 
        bg: 'bg-slate-500', 
        border: 'border-slate-200', 
        text: 'text-slate-700',
        light: 'bg-slate-50',
        icon: '📦'
    };
};

export default function StockTransferReport() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set());
    const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`/api/reports/stock-transfer?${params.toString()}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report');
            }

            const data = await response.json();
            if (data.success) {
                setReportData(data.data);
                // Expand all stores by default
                setExpandedStores(new Set(data.data.stores.map((s: StoreReport) => s.store_id)));
            } else {
                throw new Error(data.message || 'Failed to fetch report');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`/api/reports/stock-transfer/export?${params.toString()}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to export report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock_transfer_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const toggleStore = (storeId: number) => {
        const newExpanded = new Set(expandedStores);
        if (newExpanded.has(storeId)) {
            newExpanded.delete(storeId);
        } else {
            newExpanded.add(storeId);
        }
        setExpandedStores(newExpanded);
    };

    const toggleMaterial = (storeId: number, materialId: number) => {
        const key = `${storeId}-${materialId}`;
        const newExpanded = new Set(expandedMaterials);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedMaterials(newExpanded);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        }).format(num);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 max-w-md">
                    <div className="text-red-500 text-center">
                        <p className="text-lg font-semibold mb-2">Error Loading Report</p>
                        <p className="text-slate-600">{error}</p>
                        <button
                            onClick={fetchReport}
                            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
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
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-xl">
                                <Warehouse className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Stock Transfer Report</h1>
                                <p className="text-sm text-slate-500">Material quantities across all stores</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                {exporting ? 'Exporting...' : 'Export CSV'}
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
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">To:</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                        </div>
                        <button
                            onClick={fetchReport}
                            className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                        >
                            Apply
                        </button>
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => {
                                    setDateFrom('');
                                    setDateTo('');
                                    setTimeout(fetchReport, 0);
                                }}
                                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Grand Summary Cards */}
            {reportData && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Warehouse className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Stores</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {reportData.grand_summary.total_stores}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Materials</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {reportData.grand_summary.total_materials}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Stock Value</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(reportData.grand_summary.total_cost)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Store Tables */}
                    <div className="space-y-6">
                        {reportData.stores.map((store) => {
                            const colors = getStoreColor(store.store_key);
                            const isExpanded = expandedStores.has(store.store_id);

                            return (
                                <div
                                    key={store.store_id}
                                    className={`bg-white rounded-2xl border ${colors.border} shadow-sm overflow-hidden`}
                                >
                                    {/* Store Header */}
                                    <button
                                        onClick={() => toggleStore(store.store_id)}
                                        className={`w-full flex items-center justify-between p-5 ${colors.light} hover:opacity-90 transition-opacity`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{colors.icon}</span>
                                            <div className="text-left">
                                                <h2 className={`text-lg font-bold ${colors.text}`}>
                                                    {store.store_name}
                                                </h2>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-sm text-slate-600">
                                                        <Package className="w-4 h-4 inline mr-1" />
                                                        {store.summary.total_materials} materials
                                                    </span>
                                                    <span className="text-sm text-slate-600">
                                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                                        {formatCurrency(store.summary.total_cost)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>

                                    {/* Materials Table */}
                                    {isExpanded && (
                                        <div className="overflow-x-auto">
                                            {store.materials.length === 0 ? (
                                                <div className="p-8 text-center text-slate-500">
                                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                    <p>No materials in this store</p>
                                                </div>
                                            ) : (
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 border-y border-slate-200">
                                                        <tr>
                                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                Material
                                                            </th>
                                                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                Quantity
                                                            </th>
                                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                Unit
                                                            </th>
                                                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                Batches
                                                            </th>
                                                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                Total Cost
                                                            </th>
                                                            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                Details
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {store.materials.map((material) => {
                                                            const materialKey = `${store.store_id}-${material.material_id}`;
                                                            const isMaterialExpanded = expandedMaterials.has(materialKey);

                                                            return (
                                                                <>
                                                                    <tr
                                                                        key={material.material_id}
                                                                        className="hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <td className="px-5 py-4">
                                                                            <div>
                                                                                <p className="font-medium text-slate-800">
                                                                                    {material.material_name}
                                                                                </p>
                                                                                <p className="text-xs text-slate-400">
                                                                                    {material.material_code}
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-5 py-4 text-right">
                                                                            <span className={`text-lg font-semibold ${colors.text}`}>
                                                                                {formatNumber(material.total_quantity)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-4">
                                                                            <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">
                                                                                {material.unit}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-4 text-right">
                                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">
                                                                                <Layers className="w-3 h-3" />
                                                                                {material.batch_count}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-4 text-right font-medium text-slate-700">
                                                                            {formatCurrency(material.total_cost)}
                                                                        </td>
                                                                        <td className="px-5 py-4 text-center">
                                                                            <button
                                                                                onClick={() => toggleMaterial(store.store_id, material.material_id)}
                                                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                                                title="View batches"
                                                                            >
                                                                                {isMaterialExpanded ? (
                                                                                    <ChevronUp className="w-4 h-4" />
                                                                                ) : (
                                                                                    <ChevronDown className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    </tr>

                                                                    {/* Batch Details */}
                                                                    {isMaterialExpanded && (
                                                                        <tr>
                                                                            <td colSpan={6} className="px-5 py-3 bg-slate-50">
                                                                                <div className="ml-4 border-l-2 border-slate-200 pl-4">
                                                                                    <p className="text-xs font-semibold text-slate-500 mb-2">
                                                                                        BATCH DETAILS
                                                                                    </p>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                        {material.batches.map((batch, idx) => (
                                                                                            <div
                                                                                                key={idx}
                                                                                                className="p-3 bg-white rounded-lg border border-slate-200 text-sm"
                                                                                            >
                                                                                                <div className="flex justify-between items-start mb-2">
                                                                                                    <span className="font-medium text-slate-700">
                                                                                                        {batch.batch_number}
                                                                                                    </span>
                                                                                                    <span className={`font-semibold ${colors.text}`}>
                                                                                                        {formatNumber(batch.quantity)} {material.unit}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="space-y-1 text-xs text-slate-500">
                                                                                                    <p>
                                                                                                        Original: {formatNumber(batch.original_quantity)} {material.unit}
                                                                                                    </p>
                                                                                                    <p>
                                                                                                        Cost/Unit: {formatCurrency(batch.cost_per_unit)}
                                                                                                    </p>
                                                                                                    {batch.expiry_date && (
                                                                                                        <p>
                                                                                                            Expiry: {batch.expiry_date}
                                                                                                        </p>
                                                                                                    )}
                                                                                                    <p className="text-slate-400">
                                                                                                        Transferred: {new Date(batch.transferred_at).toLocaleDateString()}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50 border-t border-slate-200">
                                                        <tr>
                                                            <td colSpan={4} className="px-5 py-3 text-right font-semibold text-slate-600">
                                                                Store Total:
                                                            </td>
                                                            <td className="px-5 py-3 text-right font-bold text-slate-800">
                                                                {formatCurrency(store.summary.total_cost)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Summary */}
                    <div className="mt-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold">Grand Total Summary</h3>
                                <p className="text-teal-100 text-sm">All stores combined</p>
                            </div>
                            <div className="flex flex-wrap gap-8">
                                <div>
                                    <p className="text-teal-100 text-sm">Total Stores</p>
                                    <p className="text-2xl font-bold">{reportData?.grand_summary.total_stores}</p>
                                </div>
                                <div>
                                    <p className="text-teal-100 text-sm">Total Materials</p>
                                    <p className="text-2xl font-bold">{reportData?.grand_summary.total_materials}</p>
                                </div>
                                <div>
                                    <p className="text-teal-100 text-sm">Total Stock Value</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(reportData?.grand_summary.total_cost || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
