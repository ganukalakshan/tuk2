import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Eye, Check, X, Loader2, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ViewPurchaseOrder from './ViewPurchaseOrder';

interface PurchaseOrderItem {
    id: number;
    material: {
        id: number;
        name: string;
        code: string;
    };
    quantity: number;
    unit: {
        id: number;
        name: string;
        abbreviation: string;
    };
    unit_price: string;
    total: string;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    purchase_request_id: number;
    supplier_id: number;
    order_date: string;
    total_amount: string;
    status: 'pending' | 'approved' | 'cancelled';
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    supplier: {
        id: number;
        name: string;
        phone: string;
        email?: string;
        address?: string;
    };
    purchase_request: {
        id: number;
        purchase_no: string;
    };
    created_by_user?: {
        id: number;
        name: string;
    };
    approved_by_user?: {
        id: number;
        name: string;
    };
    items: PurchaseOrderItem[];
}

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

export default function PurchaseOrderPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const canApprove = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        fetchPurchaseOrders();
    }, [statusFilter]);

    const fetchPurchaseOrders = async () => {
        try {
            let url = '/api/purchase-orders';
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
                setPurchaseOrders(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch purchase orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (po: PurchaseOrder, items?: { id: number; received_quantity: number; received_unit_price: number }[]) => {
        if (!canApprove) return;
        
        setProcessingId(po.id);
        try {
            const response = await fetch(`/api/purchase-orders/${po.id}/approve`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: items ? JSON.stringify({ items }) : undefined,
            });

            const data = await response.json();
            if (data.success) {
                setViewingPO(null);
                fetchPurchaseOrders();
                alert('Purchase Order approved and GRN created successfully!');
            } else {
                alert(data.message || 'Failed to approve purchase order');
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (po: PurchaseOrder) => {
        if (user?.role !== 'admin') return;
        
        if (!confirm('Are you sure you want to cancel this purchase order?')) return;

        setProcessingId(po.id);
        try {
            const response = await fetch(`/api/purchase-orders/${po.id}/cancel`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            const data = await response.json();
            if (data.success) {
                fetchPurchaseOrders();
            } else {
                alert(data.message || 'Failed to cancel purchase order');
            }
        } catch (error) {
            console.error('Failed to cancel:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredPOs = purchaseOrders.filter(po =>
        po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.purchase_request.purchase_no.toLowerCase().includes(searchQuery.toLowerCase())
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
            case 'approved':
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Purchase Orders
                                </h1>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Purchase Orders</h2>
                        <p className="text-slate-500 mt-1">Approve purchase orders from approved requests</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by PO number, PR number, or supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : filteredPOs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <ClipboardList className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery || statusFilter ? 'No purchase orders found' : 'No purchase orders yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery || statusFilter
                                    ? 'Try adjusting your search or filter'
                                    : 'Purchase orders will appear here after purchase requests are approved'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            PO Number
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            PR Number
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Order Date
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPOs.map((po, index) => (
                                        <tr
                                            key={po.id}
                                            className="hover:bg-blue-50/50 transition-colors duration-150"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-semibold text-slate-700">
                                                    {po.po_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-teal-500" />
                                                    <span className="font-mono text-sm text-slate-600">
                                                        {po.purchase_request.purchase_no}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {po.supplier.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{po.supplier.name}</p>
                                                        <p className="text-xs text-slate-500">{po.supplier.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(po.order_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-800">
                                                    {formatCurrency(po.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(po.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setViewingPO(po)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {canApprove && po.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(po)}
                                                                disabled={processingId === po.id}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                                title="Approve & Create GRN"
                                                            >
                                                                {processingId === po.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            {user?.role === 'admin' && (
                                                                <button
                                                                    onClick={() => handleCancel(po)}
                                                                    disabled={processingId === po.id}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                                    title="Cancel Order"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
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

            {viewingPO && (
                <ViewPurchaseOrder
                    purchaseOrder={viewingPO}
                    onClose={() => setViewingPO(null)}
                    isAdmin={user?.role === 'admin'}
                    isManager={user?.role === 'manager'}
                    onApprove={(items) => {
                        handleApprove(viewingPO, items);
                    }}
                    onCancel={() => {
                        handleCancel(viewingPO);
                        setViewingPO(null);
                    }}
                />
            )}
        </div>
    );
}
