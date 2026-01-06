import { useState, useEffect } from 'react';
import { X, Truck, Mail, MapPin, FileText, Loader2, User, ToggleLeft, ToggleRight } from 'lucide-react';

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
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
}

interface SupplierFormData {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    is_active: boolean;
}

interface EditSupplierProps {
    isOpen: boolean;
    supplier: Supplier | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditSupplier({ isOpen, supplier, onClose, onSuccess }: EditSupplierProps) {
    const [formData, setFormData] = useState<SupplierFormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState<Partial<SupplierFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                notes: supplier.notes || '',
                is_active: supplier.is_active,
            });
        }
    }, [supplier]);

    const validateForm = (): boolean => {
        const errors: Partial<SupplierFormData> = {};

        if (!formData.name.trim()) {
            errors.name = 'Supplier name is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !supplier) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/suppliers/${supplier.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                console.error('API Error:', response.status);
                return;
            }

            const data = await response.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                if (data.errors) {
                    setFormErrors(data.errors);
                }
            }
        } catch (error) {
            console.error('Failed to update supplier:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof SupplierFormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const toggleActive = () => {
        setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
    };

    if (!isOpen || !supplier) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl transform transition-all flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Edit Supplier</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Supplier Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                    formErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'
                                }`}
                            />
                        </div>
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>

                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full pl-11 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                            formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'
                                        }`}
                                    />
                                </div>
                                {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                        <button
                            type="button"
                            onClick={toggleActive}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full ${
                                formData.is_active
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-300 bg-slate-50'
                            }`}
                        >
                            {formData.is_active ? (
                                <ToggleRight className="w-6 h-6 text-emerald-600" />
                            ) : (
                                <ToggleLeft className="w-6 h-6 text-slate-400" />
                            )}
                            <span className={`font-semibold ${formData.is_active ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {formData.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Supplier'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
