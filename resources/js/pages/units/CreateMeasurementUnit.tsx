import { useState, useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';

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

interface MeasurementUnitFormData {
    unit_name: string;
    unit_symbol: string;
    is_base: boolean;
    conversion_to_base: string;
    parent_unit_id?: string;
}

interface CreateMeasurementUnitProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const initialFormData: MeasurementUnitFormData = {
    unit_name: '',
    unit_symbol: '',
    is_base: false,
    conversion_to_base: '',
    parent_unit_id: '',
};

export default function CreateMeasurementUnit({ isOpen, onClose, onSuccess }: CreateMeasurementUnitProps) {
    const [formData, setFormData] = useState<MeasurementUnitFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Partial<MeasurementUnitFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [units, setUnits] = useState<Array<{ id: number; unit_name: string; unit_symbol: string; is_base: boolean }>>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);

    const validateForm = (): boolean => {
        const errors: Partial<MeasurementUnitFormData> = {};

        if (!formData.unit_name.trim()) {
            errors.unit_name = 'Unit name is required';
        }

        if (!formData.unit_symbol.trim()) {
            errors.unit_symbol = 'Unit symbol is required';
        }

        if (!formData.is_base && !formData.conversion_to_base.trim()) {
            errors.conversion_to_base = 'Conversion rate is required for derived units';
        }

        if (formData.conversion_to_base && isNaN(parseFloat(formData.conversion_to_base))) {
            errors.conversion_to_base = 'Conversion rate must be a valid number';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/measurement-units', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    unit_name: formData.unit_name,
                    unit_symbol: formData.unit_symbol,
                    is_base: formData.is_base,
                    conversion_to_base: formData.is_base ? 1 : (formData.conversion_to_base || 1),
                    // parent_unit_id intentionally not sent; backend currently doesn't support it
                }),
            });

            if (!response.ok) {
                // Attempt to parse validation errors
                try {
                    const errData = await response.json();
                    if (response.status === 422 && errData?.errors) {
                        const mapped: Partial<MeasurementUnitFormData> = {};
                        Object.entries(errData.errors).forEach(([key, msgs]) => {
                            const first = Array.isArray(msgs) ? msgs[0] : String(msgs);
                            if (key in formData) {
                                // @ts-expect-error dynamic assignment to partial
                                mapped[key] = first;
                            }
                        });
                        setFormErrors(mapped);
                        return;
                    }
                    console.error('API Error:', response.status, errData);
                } catch (e) {
                    const text = await response.text();
                    console.error('API Error:', response.status, text);
                }
                return;
            }

            const data = await response.json();

            if (data.success) {
                setFormData(initialFormData);
                setFormErrors({});
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Failed to create measurement unit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (formErrors[name as keyof MeasurementUnitFormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleClose = () => {
        setFormData(initialFormData);
        setFormErrors({});
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;
        setIsLoadingUnits(true);
        (async () => {
            try {
                const res = await fetch('/api/measurement-units', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.success && Array.isArray(data.data)) {
                        setUnits(data.data);
                    }
                }
            } catch (err) {
                console.error('Failed to load units', err);
            } finally {
                setIsLoadingUnits(false);
            }
        })();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Add New Unit</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Is Base Unit */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_base"
                            checked={formData.is_base}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label className="text-sm font-semibold text-slate-700 cursor-pointer">
                            Is Base Unit
                        </label>
                    </div>

                    {/* Parent Unit (only for derived units) */}
                    {!formData.is_base && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Parent Unit
                            </label>
                            <select
                                name="parent_unit_id"
                                value={formData.parent_unit_id}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border-slate-200 bg-slate-50 focus:border-blue-500"
                            >
                                <option value="">{isLoadingUnits ? 'Loading units...' : 'Select base unit'}</option>
                                {units.filter(u => u.is_base).map(u => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.unit_name} ({u.unit_symbol})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Parent unit selection is currently not stored.</p>
                        </div>
                    )}

                    {/* Unit Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Unit Name
                        </label>
                        <input
                            type="text"
                            name="unit_name"
                            value={formData.unit_name}
                            onChange={handleInputChange}
                            placeholder="e.g., Kilogram, Liter"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                formErrors.unit_name
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-slate-200 bg-slate-50 focus:border-blue-500'
                            }`}
                        />
                        {formErrors.unit_name && (
                            <p className="text-sm text-red-600 mt-1">{formErrors.unit_name}</p>
                        )}
                    </div>

                    {/* Unit Symbol */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Unit Symbol
                        </label>
                        <input
                            type="text"
                            name="unit_symbol"
                            value={formData.unit_symbol}
                            onChange={handleInputChange}
                            placeholder="e.g., kg, L, m"
                            maxLength={10}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                formErrors.unit_symbol
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-slate-200 bg-slate-50 focus:border-blue-500'
                            }`}
                        />
                        {formErrors.unit_symbol && (
                            <p className="text-sm text-red-600 mt-1">{formErrors.unit_symbol}</p>
                        )}
                    </div>

                    {/* Conversion Rate (only for derived units) */}
                    {!formData.is_base && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Conversion to Base Unit
                            </label>
                            <input
                                type="number"
                                name="conversion_to_base"
                                value={formData.conversion_to_base}
                                onChange={handleInputChange}
                                placeholder="e.g., 1000 for kg to g"
                                step="0.0001"
                                min="0"
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                    formErrors.conversion_to_base
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-slate-200 bg-slate-50 focus:border-blue-500'
                                }`}
                            />
                            {formErrors.conversion_to_base && (
                                <p className="text-sm text-red-600 mt-1">{formErrors.conversion_to_base}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                                For sub-units: how many base units equal 1 of this unit (e.g., 1g = 0.001kg)
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Creating...' : 'Create Unit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
