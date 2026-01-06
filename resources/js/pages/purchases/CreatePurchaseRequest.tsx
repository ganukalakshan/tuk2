import { useState, useEffect, useRef } from 'react';
import { X, Loader2, FileText, Plus, Trash2, Search, Package } from 'lucide-react';

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

interface Supplier {
    id: number;
    name: string;
    phone: string;
}

interface Material {
    id: number;
    code: string;
    name: string;
    category: string | null;
}

interface MeasurementUnit {
    id: number;
    unit_name: string;
    unit_symbol: string;
    conversion_to_base: number;
    is_base: boolean;
}

interface PurchaseItem {
    material_id: number | null;
    material_name: string;
    quantity: string;
    unit_id: number | null;
    unit_price: string;
}

interface CreatePurchaseRequestProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const emptyItem: PurchaseItem = {
    material_id: null,
    material_name: '',
    quantity: '',
    unit_id: null,
    unit_price: '',
};

export default function CreatePurchaseRequest({ isOpen, onClose, onSuccess }: CreatePurchaseRequestProps) {
    const [supplierId, setSupplierId] = useState<number | null>(null);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<PurchaseItem[]>([{ ...emptyItem }]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [units, setUnits] = useState<MeasurementUnit[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);

    // Material search state
    const [searchResults, setSearchResults] = useState<Material[]>([]);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
        }
    }, [isOpen]);

    const fetchDropdownData = async () => {
        try {
            const response = await fetch('/api/purchases/dropdown-data', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.success) {
                setSuppliers(data.data.suppliers);
                setUnits(data.data.units);
            }
        } catch (error) {
            console.error('Failed to fetch dropdown data:', error);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const searchMaterials = async (query: string, index: number) => {
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`/api/purchases/search-materials?q=${encodeURIComponent(query)}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.success) {
                setSearchResults(data.data);
                setActiveSearchIndex(index);
            }
        } catch (error) {
            console.error('Failed to search materials:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleMaterialSearch = (value: string, index: number) => {
        const newItems = [...items];
        newItems[index].material_name = value;
        newItems[index].material_id = null;
        setItems(newItems);

        // Debounce search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            searchMaterials(value, index);
        }, 300);
    };

    const selectMaterial = (material: Material, index: number) => {
        const newItems = [...items];
        newItems[index].material_id = material.id;
        newItems[index].material_name = `${material.code} - ${material.name}`;
        setItems(newItems);
        setSearchResults([]);
        setActiveSearchIndex(null);
    };

    const addItem = () => {
        setItems([...items, { ...emptyItem }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: string | number | null) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    // Get unit conversion factor for an item
    const getUnitConversion = (unitId: number | null): number => {
        if (!unitId) return 1;
        const unit = units.find(u => u.id === unitId);
        return unit?.conversion_to_base || 1;
    };

    // Calculate total with unit conversion applied to unit price
    // User enters price per base unit (kg), convert to price per selected unit
    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const pricePerBaseUnit = parseFloat(item.unit_price) || 0;
            const conversion = getUnitConversion(item.unit_id);
            // Convert: price per base unit ÷ conversion_to_base = price per selected unit
            // E.g., 100 LKR/kg ÷ 0.001 = 100,000 LKR for 1 gram? NO!
            // Actually: if 100 LKR per kg, and we want price per gram:
            // 1 kg = 1000 g, so 100 LKR / 1000 = 0.1 LKR per gram
            // Since gram's conversion_to_base = 0.001 (1g = 0.001kg)
            // We need: 100 × 0.001 = 0.1 LKR per gram
            const pricePerSelectedUnit = pricePerBaseUnit * conversion;
            return sum + qty * pricePerSelectedUnit;
        }, 0);
    };

    // Calculate item total with unit conversion
    const calculateItemTotal = (item: PurchaseItem) => {
        const qty = parseFloat(item.quantity) || 0;
        const pricePerBaseUnit = parseFloat(item.unit_price) || 0;
        const conversion = getUnitConversion(item.unit_id);
        // Price per selected unit = price per base × conversion_to_base
        const pricePerSelectedUnit = pricePerBaseUnit * conversion;
        return qty * pricePerSelectedUnit;
    };

    // Get the converted unit price for display
    const getConvertedUnitPrice = (item: PurchaseItem): string => {
        const pricePerBaseUnit = parseFloat(item.unit_price) || 0;
        const conversion = getUnitConversion(item.unit_id);
        // Convert: price per base × conversion_to_base = price per selected unit
        const convertedPrice = pricePerBaseUnit * conversion;
        return convertedPrice.toFixed(2);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!supplierId) {
            newErrors.supplier = 'Please select a supplier';
        }

        if (!date) {
            newErrors.date = 'Please select a date';
        }

        const validItems = items.filter(item => item.material_id && item.quantity && item.unit_id);
        if (validItems.length === 0) {
            newErrors.items = 'Please add at least one valid item';
        }

        items.forEach((item, index) => {
            if (item.material_name && !item.material_id) {
                newErrors[`item_${index}_material`] = 'Please select a material from the dropdown';
            }
            if (item.material_id && !item.quantity) {
                newErrors[`item_${index}_quantity`] = 'Quantity is required';
            }
            if (item.material_id && !item.unit_id) {
                newErrors[`item_${index}_unit`] = 'Unit is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const validItems = items
                .filter(item => item.material_id && item.quantity && item.unit_id)
                .map(item => {
                    const basePricePerKg = parseFloat(item.unit_price) || 0;
                    const conversion = getUnitConversion(item.unit_id);
                    // Convert base price to selected unit price before sending
                    const convertedUnitPrice = basePricePerKg * conversion;
                    return {
                        material_id: item.material_id,
                        quantity: parseFloat(item.quantity),
                        unit_id: item.unit_id,
                        unit_price: convertedUnitPrice,
                    };
                });

            const response = await fetch('/api/purchases', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    supplier_id: supplierId,
                    date: date,
                    items: validItems,
                }),
            });

            const data = await response.json();

            if (data.success) {
                handleClose();
                onSuccess();
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    alert(data.message || 'Failed to create purchase request');
                }
            }
        } catch (error) {
            console.error('Failed to create purchase request:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSupplierId(null);
        setDate(new Date().toISOString().split('T')[0]);
        setItems([{ ...emptyItem }]);
        setErrors({});
        setSearchResults([]);
        setActiveSearchIndex(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl transform transition-all">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">New Purchase Request</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                {loadingDropdowns ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Supplier and Date Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Supplier Select */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={supplierId || ''}
                                    onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.supplier
                                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'
                                    }`}
                                >
                                    <option value="">Select a supplier...</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name} ({supplier.phone})
                                        </option>
                                    ))}
                                </select>
                                {errors.supplier && (
                                    <p className="mt-1.5 text-sm text-red-500">{errors.supplier}</p>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Request Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.date
                                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'
                                    }`}
                                />
                                {errors.date && (
                                    <p className="mt-1.5 text-sm text-red-500">{errors.date}</p>
                                )}
                            </div>
                        </div>

                        {/* Items Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Materials <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                            </div>

                            {errors.items && (
                                <p className="mb-3 text-sm text-red-500">{errors.items}</p>
                            )}

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            {/* Material Search */}
                                            <div className="md:col-span-4 relative">
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    Material
                                                </label>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={item.material_name}
                                                        onChange={(e) => handleMaterialSearch(e.target.value, index)}
                                                        onFocus={() => {
                                                            if (item.material_name) {
                                                                searchMaterials(item.material_name, index);
                                                            }
                                                        }}
                                                        placeholder="Search material..."
                                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                                            errors[`item_${index}_material`]
                                                                ? 'border-red-300 focus:ring-red-500/20'
                                                                : 'border-slate-200 focus:ring-teal-500/20'
                                                        }`}
                                                    />
                                                    {searchLoading && activeSearchIndex === index && (
                                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                                                    )}
                                                </div>

                                                {/* Search Results Dropdown */}
                                                {activeSearchIndex === index && searchResults.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {searchResults.map((material) => (
                                                            <button
                                                                key={material.id}
                                                                type="button"
                                                                onClick={() => selectMaterial(material, index)}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-0"
                                                            >
                                                                <div className="font-medium text-slate-800">
                                                                    {material.code} - {material.name}
                                                                </div>
                                                                {material.category && (
                                                                    <div className="text-xs text-slate-500">
                                                                        {material.category}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {errors[`item_${index}_material`] && (
                                                    <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_material`]}</p>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    placeholder="0.00"
                                                    className={`w-full px-3 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                                        errors[`item_${index}_quantity`]
                                                            ? 'border-red-300 focus:ring-red-500/20'
                                                            : 'border-slate-200 focus:ring-teal-500/20'
                                                    }`}
                                                />
                                            </div>

                                            {/* Unit */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    Unit
                                                </label>
                                                <select
                                                    value={item.unit_id || ''}
                                                    onChange={(e) => updateItem(index, 'unit_id', e.target.value ? parseInt(e.target.value) : null)}
                                                    className={`w-full px-3 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                                        errors[`item_${index}_unit`]
                                                            ? 'border-red-300 focus:ring-red-500/20'
                                                            : 'border-slate-200 focus:ring-teal-500/20'
                                                    }`}
                                                >
                                                    <option value="">Select...</option>
                                                    {units.map((unit) => (
                                                        <option key={unit.id} value={unit.id}>
                                                            {unit.unit_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Unit Price */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    Price (per kg)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                                />
                                                {item.unit_id && parseFloat(item.unit_price) > 0 && getUnitConversion(item.unit_id) !== 1 && (
                                                    <p className="mt-1 text-xs text-teal-600">
                                                        = {getConvertedUnitPrice(item)} per {units.find(u => u.id === item.unit_id)?.unit_symbol || 'unit'}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Total & Delete */}
                                            <div className="md:col-span-2 flex items-end justify-between gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                                        Total
                                                    </label>
                                                    <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700">
                                                        {calculateItemTotal(item).toFixed(2)}
                                                    </div>
                                                </div>
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Grand Total */}
                            <div className="flex justify-end mt-4">
                                <div className="px-6 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">Grand Total: </span>
                                    <span className="text-xl font-bold text-teal-700">
                                        LKR {calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-5 py-3 text-slate-700 font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Request'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
