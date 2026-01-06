import { useState } from 'react';
import { X, Calendar, User, Package, Truck, Check, FileText, AlertCircle } from 'lucide-react';

interface PurchaseItem {
    id: number;
    material_id: number;
    quantity: string;
    approved_quantity?: string;
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
    status: 'pending' | 'received' | 'cancelled' | 'approved';
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

interface ViewPurchaseRequestProps {
    purchase: Purchase;
    onClose: () => void;
    isAdmin: boolean;
    onApprove: (items: { id: number; approved_quantity: number }[]) => void;
    onCancel: () => void;
}

export default function ViewPurchaseRequest({
    purchase,
    onClose,
    isAdmin,
    onApprove,
    onCancel,
}: ViewPurchaseRequestProps) {
    const [editMode, setEditMode] = useState(false);
    const [editedItems, setEditedItems] = useState<{ [key: number]: string }>(
        purchase.items.reduce((acc, item) => ({
            ...acc,
            [item.id]: item.approved_quantity || item.quantity
        }), {})
    );
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
            [itemId]: value
        }));
    };

    const calculateTotal = (quantity: string, unitPrice: string) => {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(unitPrice) || 0;
        return qty * price;
    };

    const calculateGrandTotal = () => {
        return purchase.items.reduce((total, item) => {
            const qty = parseFloat(editedItems[item.id]) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return total + (qty * price);
        }, 0);
    };

    const handleApprove = () => {
        const items = purchase.items.map(item => ({
            id: item.id,
            approved_quantity: parseFloat(editedItems[item.id]) || 0
        }));
        onApprove(items);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                        Pending Approval
                    </span>
                );
            case 'approved':
            case 'received':
                return (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                        <Check className="w-4 h-4 mr-1.5" />
                        Approved
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                        <X className="w-4 h-4 mr-1.5" />
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{purchase.purchase_no}</h3>
                            <p className="text-sm text-slate-500">Purchase Request Details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(purchase.status)}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Request Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Supplier */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Truck className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Supplier</span>
                            </div>
                            <p className="font-semibold text-slate-800">{purchase.supplier.name}</p>
                            <p className="text-sm text-slate-500">{purchase.supplier.phone}</p>
                        </div>

                        {/* Date */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">Request Date</span>
                            </div>
                            <p className="font-semibold text-slate-800">{formatDate(purchase.date)}</p>
                            <p className="text-sm text-slate-500">Created: {formatDateTime(purchase.created_at)}</p>
                        </div>

                        {/* Total Amount */}
                        <div className="p-4 bg-teal-50 rounded-xl">
                            <div className="flex items-center gap-2 text-teal-600 mb-2">
                                <Package className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wide">
                                    {editMode ? 'Approved Total' : 'Total Amount'}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-teal-700">
                                {formatCurrency(editMode ? calculateGrandTotal() : purchase.total_amount)}
                            </p>
                        </div>
                    </div>

                    {/* Edit Mode Notice */}
                    {editMode && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-blue-700">Admin Adjustment Mode</p>
                                <p className="text-sm text-blue-600 mt-1">
                                    You can modify the quantities before approval. The adjusted quantities will be sent to the Purchase Order.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Approval Info */}
                    {(purchase.status === 'received' || purchase.status === 'approved') && purchase.received_at && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-700">
                                    Approved on {formatDateTime(purchase.received_at)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Requested Materials ({purchase.items.length} items)
                        </h4>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-100">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Material
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Requested
                                        </th>
                                        {editMode && (
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-green-600 uppercase tracking-wider">
                                                Approved Qty
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Unit
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {purchase.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-white transition-colors">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-slate-800">{item.material.name}</p>
                                                    <p className="text-xs text-slate-500">{item.material.code}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                                                {parseFloat(item.quantity).toFixed(3)}
                                            </td>
                                            {editMode && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        value={editedItems[item.id]}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        className="w-24 px-2 py-1 text-right border border-green-300 rounded bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-green-700"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm font-medium">
                                                    {item.unit.unit_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                                {formatCurrency(
                                                    editMode 
                                                        ? calculateTotal(editedItems[item.id], item.unit_price)
                                                        : item.total
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-teal-50 border-t-2 border-teal-200">
                                        <td colSpan={editMode ? 5 : 4} className="px-4 py-3 text-right font-semibold text-slate-700">
                                            Grand Total:
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-teal-700">
                                            {formatCurrency(editMode ? calculateGrandTotal() : purchase.total_amount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && purchase.status === 'pending' && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            {!editMode && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="w-full px-5 py-3 bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded-xl hover:bg-blue-100 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Package className="w-5 h-5" />
                                    Adjust Quantities Before Approval
                                </button>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-5 py-3 text-red-700 font-semibold bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all duration-200"
                                >
                                    Cancel Request
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    {editMode ? 'Approve with Adjustments' : 'Approve Request'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Close Button for non-pending */}
                    {(purchase.status !== 'pending' || !isAdmin) && (
                        <div className="pt-4 border-t border-slate-200">
                            <button
                                onClick={onClose}
                                className="w-full px-5 py-3 text-slate-700 font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
