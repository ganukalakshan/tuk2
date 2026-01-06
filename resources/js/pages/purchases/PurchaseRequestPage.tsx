import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Eye, Check, X, Loader2, ArrowLeft, Calendar, User, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreatePurchaseRequest from './CreatePurchaseRequest';
import ViewPurchaseRequest from './ViewPurchaseRequest';

interface PurchaseItem {
    id: number;
    material_id: number;
    quantity: string;
    unit_id: number;
    unit_price: string;
    total: string;
    material: {
        id: number;
        code: string;
        name: string;
    };
    unit: {
        id: number;
        unit_name: string;
    };
}

interface Purchase {
    id: number;
    purchase_no: string;
    supplier_id: number;
    date: string;
    total_amount: string;
    status: 'pending' | 'received' | 'cancelled';
    created_by: number;
    received_at: string | null;
    created_at: string;
    updated_at: string;
    supplier: {
        id: number;
        name: string;
        phone: string;
    };
    created_by_user?: {
        id: number;
        name: string;
    };
    items: PurchaseItem[];
}

// Helper to get CSRF token from cookie
const getCsrfToken = (): string => {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

export default function PurchaseRequestPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const getDashboardPath = () => {
        return '/dashboard';
    };

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchPurchases();
    }, [statusFilter]);

    const fetchPurchases = async () => {
        try {
            let url = '/api/purchases';
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (params.toString()) url += '?' + params.toString();

            const response = await fetch(url, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.success) {
                setPurchases(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (items: { id: number; approved_quantity: number }[]) => {
        if (!isAdmin || !viewingPurchase) return;
        
        setProcessingId(viewingPurchase.id);
        try {
            const response = await fetch(`/api/purchases/${viewingPurchase.id}/approve`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ items }),
            });

            const data = await response.json();
            if (data.success) {
                setViewingPurchase(null);
                fetchPurchases();
            } else {
                alert(data.message || 'Failed to approve purchase request');
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (purchase: Purchase) => {
        if (!isAdmin) return;
        
        if (!confirm('Are you sure you want to cancel this purchase request?')) return;

        setProcessingId(purchase.id);
        try {
            const response = await fetch(`/api/purchases/${purchase.id}/cancel`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            const data = await response.json();
            if (data.success) {
                fetchPurchases();
            } else {
                alert(data.message || 'Failed to cancel purchase request');
            }
        } catch (error) {
            console.error('Failed to cancel:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredPurchases = purchases.filter(purchase =>
        purchase.purchase_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                        Pending
                    </span>
                );
            case 'received':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <X className="w-3 h-3 mr-1" />
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
        }).format(parseFloat(amount));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(getDashboardPath())}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg shadow-teal-500/25">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Purchase Requests
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-100 rounded-lg">
                                {isAdmin ? 'Admin' : 'Manager'}
                            </span>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Purchase Requests</h2>
                        <p className="text-slate-500 mt-1">Create and manage raw material purchase requests</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        New Request
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by request number or supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="received">Approved</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Purchase Requests Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <FileText className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery || statusFilter ? 'No requests found' : 'No purchase requests yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery || statusFilter
                                    ? 'Try adjusting your search or filter'
                                    : 'Get started by creating your first purchase request'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-teal-600 uppercase tracking-wider">
                                            Request No.
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-teal-600 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-teal-600 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-teal-600 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-teal-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-teal-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPurchases.map((purchase, index) => (
                                        <tr
                                            key={purchase.id}
                                            className="hover:bg-teal-50/50 transition-colors duration-150"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-semibold text-slate-700">
                                                    {purchase.purchase_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {purchase.supplier.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{purchase.supplier.name}</p>
                                                        <p className="text-xs text-slate-500">{purchase.supplier.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(purchase.date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-800">
                                                    {formatCurrency(purchase.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(purchase.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* View Button */}
                                                    <button
                                                        onClick={() => setViewingPurchase(purchase)}
                                                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Purchase Request Modal */}
            <CreatePurchaseRequest
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchPurchases();
                }}
            />

            {/* View Purchase Request Modal */}
            {viewingPurchase && (
                <ViewPurchaseRequest
                    purchase={viewingPurchase}
                    onClose={() => setViewingPurchase(null)}
                    isAdmin={isAdmin}
                    onApprove={handleApprove}
                    onCancel={() => {
                        handleCancel(viewingPurchase);
                        setViewingPurchase(null);
                    }}
                />
            )}
        </div>
    );
}
