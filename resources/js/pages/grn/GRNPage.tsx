import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageCheck, Search, Eye, Loader2, ArrowLeft, Calendar, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ViewGRN from './ViewGRN';

interface GRN {
    id: number;
    grn_number: string;
    purchase_order_id: number;
    supplier_id: number;
    received_date: string;
    total_amount: string;
    received_by: number;
    created_at: string;
    supplier: {
        id: number;
        name: string;
        phone: string;
    };
    purchase_order: {
        id: number;
        po_number: string;
        purchase_request: {
            id: number;
            purchase_no: string;
        };
    };
    received_by_user: {
        id: number;
        name: string;
    };
}

export default function GRNPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [grns, setGrns] = useState<GRN[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingGRN, setViewingGRN] = useState<GRN | null>(null);

    useEffect(() => {
        fetchGRNs();
    }, []);

    const fetchGRNs = async () => {
        try {
            const response = await fetch('/api/grns', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.success) {
                setGrns(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch GRNs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGRNs = grns.filter(grn =>
        grn.grn_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grn.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grn.purchase_order.po_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
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
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/25">
                                <PackageCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Goods Received Notes
                                </h1>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Available GRNs</h2>
                        <p className="text-slate-500 mt-1">View all goods received from suppliers</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by GRN number, PO number, or supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : filteredGRNs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <PackageCheck className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery ? 'No GRNs found' : 'No GRNs available yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery
                                    ? 'Try adjusting your search'
                                    : 'GRNs will appear here after purchase orders are approved'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            GRN Number
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            PO Number
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            Received Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            Received By
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredGRNs.map((grn, index) => (
                                        <tr
                                            key={grn.id}
                                            className="hover:bg-indigo-50/50 transition-colors duration-150"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-semibold text-slate-700">
                                                    {grn.grn_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    <span className="font-mono text-sm text-slate-600">
                                                        {grn.purchase_order.po_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {grn.supplier.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{grn.supplier.name}</p>
                                                        <p className="text-xs text-slate-500">{grn.supplier.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(grn.received_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <User className="w-4 h-4" />
                                                    {grn.received_by_user?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-800">
                                                    {formatCurrency(grn.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setViewingGRN(grn)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
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

            {viewingGRN && (
                <ViewGRN
                    grn={viewingGRN}
                    onClose={() => setViewingGRN(null)}
                />
            )}
        </div>
    );
}
