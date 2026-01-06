import { useState, useEffect } from 'react';
import { X, Loader2, Calculator, Package, TrendingUp } from 'lucide-react';

interface RecipeCostItem {
    material: string;
    recipe_quantity: string;
    grn_unit_price: number;
    converted_quantity: number;
    line_total: number;
}

interface RecipeCostData {
    name: string;
    items: RecipeCostItem[];
    recipe_total: number;
    cost_per_unit: number;
    standard_yield: number;
}

interface RecipeCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeId: number;
}

export default function RecipeCostModal({ isOpen, onClose, recipeId }: RecipeCostModalProps) {
    const [costData, setCostData] = useState<RecipeCostData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatNumber = (value: number) => {
        return Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2 });
    };

    useEffect(() => {
        if (isOpen && recipeId) {
            fetchCostData();
        }
    }, [isOpen, recipeId]);

    const fetchCostData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/recipes/${recipeId}/cost`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                if (response.status === 422 || response.status === 500) {
                    // Parse error response
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch recipe cost data');
                } else {
                    throw new Error(`HTTP ${response.status}: Failed to fetch recipe cost data`);
                }
            }

            const data = await response.json();
            if (data.success) {
                // Ensure numeric fields are numbers
                const processedData = {
                    ...data.data,
                    items: data.data.items.map((item: any) => ({
                        ...item,
                        grn_unit_price: Number(item.grn_unit_price) || 0,
                        converted_quantity: Number(item.converted_quantity) || 0,
                        line_total: Number(item.line_total) || 0,
                    })),
                    recipe_total: Number(data.data.recipe_total) || 0,
                    cost_per_unit: Number(data.data.cost_per_unit) || 0,
                };
                setCostData(processedData);
            } else {
                throw new Error(data.message || 'Failed to fetch cost data');
            }
        } catch (error) {
            console.error('Failed to fetch recipe cost:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch recipe cost');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Recipe Cost Breakdown</h3>
                            {costData && <p className="text-slate-600">{costData.name}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <span className="ml-2 text-slate-600">Loading cost data...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={fetchCostData}
                                className="mt-2 text-red-600 hover:text-red-800 underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {costData && !loading && !error && (
                        <>
                            {/* Cost Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calculator className="w-5 h-5 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-800">Total Cost (LKR)</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-900">
                                        LKR {formatNumber(costData.recipe_total)}
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Cost per Unit (LKR)</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">
                                        LKR {formatNumber(costData.cost_per_unit)}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calculator className="w-5 h-5 text-slate-600" />
                                        <span className="text-sm font-medium text-slate-800">Standard Yield</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {costData.standard_yield}
                                    </p>
                                </div>
                            </div>

                            {/* Ingredients Table */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <h4 className="text-lg font-semibold text-slate-800">Ingredient Breakdown</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Recipe Quantity
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    GRN Unit Price (LKR)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Converted Qty
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Line Total (LKR)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {costData.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {item.material}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {item.recipe_quantity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        LKR {formatNumber(item.grn_unit_price)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        {formatNumber(item.converted_quantity)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                                                        LKR {formatNumber(item.line_total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50">
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                                                    Total Cost (LKR):
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                                                    LKR {formatNumber(costData.recipe_total)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}