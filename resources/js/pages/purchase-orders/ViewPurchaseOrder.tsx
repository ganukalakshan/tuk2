import { useState } from 'react';
import { X, Calendar, User, FileText, Package, Hash, DollarSign, Check, XCircle, AlertCircle, Edit3 } from 'lucide-react';

interface PurchaseOrderItem {
    id: number;
    material: {
        id: number;
        name: string;
        code: string;
    };
    quantity: number;
    received_quantity?: number;
    unit: {
        id: number;
        unit_name: string;
        unit_symbol: string;
    };
    unit_price: string;
    received_unit_price?: string;
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

interface ViewPurchaseOrderProps {
    purchaseOrder: PurchaseOrder;
    onClose: () => void;
    isAdmin: boolean;
    isManager: boolean;
    onApprove: (items?: { id: number; received_quantity: number; received_unit_price: number }[]) => void;
    onCancel: () => void;
}

export default function ViewPurchaseOrder({
    purchaseOrder,
    onClose,
    isAdmin,
    isManager,
    onApprove,
    onCancel,
}: ViewPurchaseOrderProps) {
    const [editMode, setEditMode] = useState(false);
    const [editedItems, setEditedItems] = useState<{
        [key: number]: { quantity: string; unitPrice: string };
    }>(
        purchaseOrder.items.reduce((acc, item) => ({
            ...acc,
            [item.id]: {
                quantity: (item.received_quantity || item.quantity).toString(),
                unitPrice: (item.received_unit_price || item.unit_price).toString(),
            }
        }), {})
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
        }).format(parseFloat(amount.toString()));
    };

    const handleQuantityChange = (itemId: number, value: string) => {
        setEditedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], quantity: value }
        }));
    };

    const handleUnitPriceChange = (itemId: number, value: string) => {
        setEditedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], unitPrice: value }
        }));
    };

    const calculateItemTotal = (itemId: number) => {
        const item = editedItems[itemId];
        if (!item) return 0;
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return qty * price;
    };

    const calculateGrandTotal = () => {
        return purchaseOrder.items.reduce((total, item) => {
            return total + calculateItemTotal(item.id);
        }, 0);
    };

    const handleApprove = () => {
        if (editMode && isAdmin) {
            const items = purchaseOrder.items.map(item => ({
                id: item.id,
                received_quantity: parseFloat(editedItems[item.id].quantity) || 0,
                received_unit_price: parseFloat(editedItems[item.id].unitPrice) || 0,
            }));
            onApprove(items);
        } else {
            onApprove();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                        Pending
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                        <Check className="w-4 h-4 mr-1.5" />
                        Approved
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Purchase Order Details</h2>
                            <p className="text-blue-100 text-sm mt-1">View and manage purchase order</p>
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
                        {/* Status and PO Number */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Hash className="w-5 h-5 text-slate-400" />
                                    <span className="font-mono text-2xl font-bold text-slate-800">
                                        {purchaseOrder.po_number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <FileText className="w-4 h-4" />
                                    From PR: <span className="font-mono font-semibold">{purchaseOrder.purchase_request.purchase_no}</span>
                                </div>
                            </div>
                            {getStatusBadge(purchaseOrder.status)}
                        </div>

                        {/* Order Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Supplier Information */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Supplier Information
                                </h3>
                                <div className="space-y-2">
                                    <p className="font-semibold text-slate-800 text-lg">{purchaseOrder.supplier.name}</p>
                                    <p className="text-sm text-slate-600">{purchaseOrder.supplier.phone}</p>
                                    {purchaseOrder.supplier.email && (
                                        <p className="text-sm text-slate-600">{purchaseOrder.supplier.email}</p>
                                    )}
                                    {purchaseOrder.supplier.address && (
                                        <p className="text-sm text-slate-600">{purchaseOrder.supplier.address}</p>
                                    )}
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Order Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Order Date</p>
                                        <p className="font-semibold text-slate-800">{formatDate(purchaseOrder.order_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Created By</p>
                                        <p className="font-semibold text-slate-800">System</p>
                                    </div>
                                    {purchaseOrder.approved_by && purchaseOrder.approved_at && (
                                        <div>
                                            <p className="text-xs text-slate-500">Approved At</p>
                                            <p className="font-semibold text-slate-800">{formatDate(purchaseOrder.approved_at)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Edit Mode Notice */}
                        {editMode && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-700">Verification Mode</p>
                                    <p className="text-sm text-blue-600 mt-1">
                                        Verify and adjust received quantities and unit prices. The adjusted values will be used for GRN creation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Items Table */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Order Items
                            </h3>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Material</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Ordered</th>
                                            {editMode && (
                                                <>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase">Received Qty</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-green-600 uppercase">Received Price</th>
                                                </>
                                            )}
                                            {!editMode && (
                                                <>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Unit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Unit Price</th>
                                                </>
                                            )}
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {purchaseOrder.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-100/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{item.material.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{item.material.code}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-semibold text-slate-700">
                                                        {item.quantity} <span className="text-xs text-slate-500">{item.unit.unit_symbol}</span>
                                                    </span>
                                                </td>
                                                {editMode && (
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                min="0"
                                                                value={editedItems[item.id].quantity}
                                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                                className="w-28 px-2 py-1.5 text-center border border-green-300 rounded-lg bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-green-700"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={editedItems[item.id].unitPrice}
                                                                onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                                                                className="w-32 px-2 py-1.5 text-right border border-green-300 rounded-lg bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-green-700"
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                {!editMode && (
                                                    <>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                                                                {item.unit.unit_symbol}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-slate-700">{formatCurrency(item.unit_price)}</span>
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-semibold text-slate-800">
                                                        {formatCurrency(editMode ? calculateItemTotal(item.id) : item.total)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-600 font-semibold">
                                            {editMode ? 'Total Amount (Received)' : 'Total Amount'}
                                        </p>
                                        <p className="text-xs text-green-600/70">Including all items</p>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-700">
                                    {formatCurrency(editMode ? calculateGrandTotal() : purchaseOrder.total_amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl font-semibold transition-all duration-200"
                        >
                            Close
                        </button>

                        {(isAdmin || isManager) && purchaseOrder.status === 'pending' && (
                            <div className="flex items-center gap-3">
                                {isAdmin && !editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="px-4 py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Verify & Adjust
                                    </button>
                                )}
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Cancel Order
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    {editMode ? 'Approve with Adjustments' : 'Approve & Create GRN'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
