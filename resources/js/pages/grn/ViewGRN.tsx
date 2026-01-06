import { X, Calendar, User, FileText, Package, Hash, DollarSign } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface GRNItem {
    id: number;
    material: {
        id: number;
        name: string;
        code: string;
    };
    quantity: number;
    received_quantity?: number;
    variance_reason?: string;
    unit: {
        id: number;
        name: string;
        abbreviation: string;
    };
    unit_price: string;
    total: string;
}

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
        email?: string;
        address?: string;
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
    items?: GRNItem[];
}

interface ViewGRNProps {
    grn: GRN;
    onClose: () => void;
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

export default function ViewGRN({ grn: initialGRN, onClose }: ViewGRNProps) {
    const [grn, setGrn] = useState<GRN>(initialGRN);
    const [loading, setLoading] = useState(!initialGRN.items);

    useEffect(() => {
        if (!initialGRN.items) {
            fetchGRNDetails();
        }
    }, []);

    const fetchGRNDetails = async () => {
        try {
            const response = await fetch(`/api/grns/${initialGRN.id}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.success) {
                setGrn(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch GRN details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">GRN Details</h2>
                            <p className="text-emerald-100 text-sm mt-1">Goods Received Note</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* GRN Number */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Hash className="w-5 h-5 text-slate-400" />
                                    <span className="font-mono text-2xl font-bold text-slate-800">
                                        {grn.grn_number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <FileText className="w-4 h-4" />
                                    From PO: <span className="font-mono font-semibold">{grn.purchase_order.po_number}</span>
                                </div>
                            </div>
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                                <Package className="w-4 h-4 mr-1.5" />
                                Received
                            </div>
                        </div>

                        {/* GRN Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Supplier Information */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
                                <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Supplier Information
                                </h3>
                                <div className="space-y-2">
                                    <p className="font-semibold text-slate-800 text-lg">{grn.supplier.name}</p>
                                    <p className="text-sm text-slate-600">{grn.supplier.phone}</p>
                                    {grn.supplier.email && (
                                        <p className="text-sm text-slate-600">{grn.supplier.email}</p>
                                    )}
                                    {grn.supplier.address && (
                                        <p className="text-sm text-slate-600">{grn.supplier.address}</p>
                                    )}
                                </div>
                            </div>

                            {/* Receipt Details */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Receipt Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Received Date</p>
                                        <p className="font-semibold text-slate-800">{formatDate(grn.received_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Received By</p>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <p className="font-semibold text-slate-800">{grn.received_by_user?.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Created At</p>
                                        <p className="font-semibold text-slate-800">{formatDate(grn.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : grn.items && grn.items.length > 0 ? (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Received Items
                                </h3>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Material</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Ordered</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase">Received</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Unit</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Unit Price</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {grn.items.map((item) => {
                                                const hasVariance = item.received_quantity && item.received_quantity !== item.quantity;
                                                return (
                                                    <React.Fragment key={item.id}>
                                                        <tr className={`hover:bg-slate-100/50 transition-colors ${hasVariance ? 'bg-amber-50' : ''}`}>
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="font-semibold text-slate-800">{item.material.name}</p>
                                                                    <p className="text-xs text-slate-500 font-mono">{item.material.code}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="font-semibold text-slate-700">{item.quantity}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`font-semibold ${hasVariance ? 'text-amber-700' : 'text-indigo-700'}`}>
                                                                    {item.received_quantity ?? item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold">
                                                                    {item.unit.abbreviation}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="text-slate-700">{formatCurrency(item.unit_price)}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="font-semibold text-slate-800">{formatCurrency(item.total)}</span>
                                                            </td>
                                                        </tr>
                                                        {hasVariance && item.variance_reason && (
                                                            <tr className="bg-amber-50/50">
                                                                <td colSpan={6} className="px-4 py-2">
                                                                    <div className="flex items-start gap-2 text-sm">
                                                                        <span className="font-semibold text-amber-700">Variance Reason:</span>
                                                                        <span className="text-amber-600">{item.variance_reason}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        {/* Total Amount */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-600 font-semibold">Total Amount</p>
                                        <p className="text-xs text-green-600/70">All received items</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-700">
                                    {formatCurrency(grn.total_amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl font-semibold transition-all duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
