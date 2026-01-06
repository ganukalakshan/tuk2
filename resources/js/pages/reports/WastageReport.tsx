import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Trash2, 
    Download, 
    Calendar, 
    RefreshCw, 
    Filter,
    TrendingUp,
    Package,
    DollarSign,
    AlertTriangle,
    MapPin,
    User,
    FileText,
    BarChart3,
    PieChart
} from 'lucide-react';

interface WastageSummary {
    total_cost: number;
    total_items: number;
    material_wastage: {
        count: number;
        cost: number;
    };
    product_wastage: {
        count: number;
        cost: number;
    };
}

interface LocationData {
    location: string;
    count: number;
    total_cost: number;
    avg_cost: number;
}

interface TopItem {
    material_id?: number;
    menu_item_id?: number;
    material_name?: string;
    product_name?: string;
    material_code?: string;
    total_quantity: number;
    unit?: string;
    total_cost: number;
    count: number;
}

interface ReasonData {
    reason: string;
    count: number;
    total_cost: number;
}

interface UserData {
    user_id: number;
    user_name: string;
    count: number;
    total_cost: number;
}

interface WastageRecord {
    id: number;
    date: string;
    type: string;
    item_name: string;
    item_code: string | null;
    quantity: number;
    unit: string;
    cost: number;
    location: string;
    reason: string | null;
    recorded_by: string;
    created_at: string;
}

interface ReportData {
    summary: WastageSummary;
    by_location: LocationData[];
    top_materials: TopItem[];
    top_products: TopItem[];
    by_reason: ReasonData[];
    by_user: UserData[];
    records: WastageRecord[];
    filters: {
        date_from: string | null;
        date_to: string | null;
        location: string | null;
        type: string | null;
        user_id: string | null;
    };
}

const locationColors: Record<string, { bg: string; text: string; icon: string }> = {
    store: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🏪' },
    kitchen: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '👨‍🍳' },
    bar: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🍹' },
};

export default function WastageReport() {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [exporting, setExporting] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string>('records');

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
            if (locationFilter) params.append('location', locationFilter);
            if (typeFilter) params.append('type', typeFilter);

            const response = await fetch(`/api/reports/wastage?${params.toString()}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report');
            }

            const data = await response.json();
            if (data.success) {
                setReportData(data.data);
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
            if (locationFilter) params.append('location', locationFilter);

            const response = await fetch(`/api/reports/wastage/export?${params.toString()}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to export report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wastage_report_${new Date().toISOString().split('T')[0]}.csv`;
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

    const getLocationStyle = (location: string) => {
        return locationColors[location] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📦' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
                                <div className="p-2 bg-red-100 rounded-xl">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">Wastage Report</h1>
                                    <p className="text-sm text-slate-500">Track and analyze wastage costs</p>
                                </div>
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
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
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
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">To:</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Location:</label>
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            >
                                <option value="">All</option>
                                <option value="store">Store</option>
                                <option value="kitchen">Kitchen</option>
                                <option value="bar">Bar</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Type:</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            >
                                <option value="">All</option>
                                <option value="material">Raw Material</option>
                                <option value="product">Finished Product</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchReport}
                            className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                        >
                            Apply
                        </button>
                        {(dateFrom || dateTo || locationFilter || typeFilter) && (
                            <button
                                onClick={() => {
                                    setDateFrom('');
                                    setDateTo('');
                                    setLocationFilter('');
                                    setTypeFilter('');
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

            {/* Content */}
            {reportData && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Wastage Cost</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(reportData.summary.total_cost)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Items Wasted</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {reportData.summary.total_items}
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
                                    <p className="text-sm text-slate-500">Raw Material Wastage</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {reportData.summary.material_wastage.count} items
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatCurrency(reportData.summary.material_wastage.cost)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Product Wastage</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {reportData.summary.product_wastage.count} items
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatCurrency(reportData.summary.product_wastage.cost)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Wastage by Location */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-600" />
                                Wastage by Location
                            </h3>
                            <div className="space-y-3">
                                {reportData.by_location.map((loc) => {
                                    const style = getLocationStyle(loc.location);
                                    const percentage = reportData.summary.total_cost > 0
                                        ? (loc.total_cost / reportData.summary.total_cost) * 100
                                        : 0;
                                    return (
                                        <div key={loc.location} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{style.icon}</span>
                                                    <span className="font-medium text-slate-700 capitalize">{loc.location}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-800">{formatCurrency(loc.total_cost)}</p>
                                                    <p className="text-xs text-slate-500">{loc.count} items</p>
                                                </div>
                                            </div>
                                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`absolute h-full ${style.bg.replace('100', '500')} rounded-full transition-all`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Wasted Materials */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-slate-600" />
                                Top Wasted Materials
                            </h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {reportData.top_materials.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-800">{item.material_name}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatNumber(item.total_quantity)} {item.unit} • {item.count} times
                                            </p>
                                        </div>
                                        <p className="font-bold text-red-600">{formatCurrency(item.total_cost)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Wastage by Reason */}
                    {reportData.by_reason.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-slate-600" />
                                Wastage by Reason
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reportData.by_reason.map((reason, idx) => (
                                    <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="font-medium text-slate-800 mb-2">{reason.reason}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">{reason.count} items</span>
                                            <span className="font-bold text-amber-700">{formatCurrency(reason.total_cost)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Records Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-600" />
                                Detailed Wastage Records
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-y border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Item</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Cost</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportData.records.map((record) => {
                                        const locStyle = getLocationStyle(record.location);
                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        record.type === 'Raw Material'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {record.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-slate-800">{record.item_name}</p>
                                                    {record.item_code && (
                                                        <p className="text-xs text-slate-500">{record.item_code}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-700">
                                                    {formatNumber(record.quantity)} {record.unit}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-red-600">
                                                    {formatCurrency(record.cost)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${locStyle.bg} ${locStyle.text}`}>
                                                        {record.location}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {record.reason || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {record.recorded_by}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
