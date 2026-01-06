import { useState } from 'react';
import { X, Truck, Mail, MapPin, FileText, Loader2, User } from 'lucide-react';

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

interface SupplierFormData {
    name: string;
   phone: string;
    email: string;
    address: string;
    notes: string;
}

interface CreateSupplierProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const initialFormData: SupplierFormData = {
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
};

export default function CreateSupplier({ isOpen, onClose, onSuccess }: CreateSupplierProps) {
    const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Partial<SupplierFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/suppliers', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                try {
                    const errData = await response.json();
                    if (response.status === 422 && errData?.errors) {
                        const mapped: Partial<SupplierFormData> = {};
                        Object.entries(errData.errors).forEach(([key, msgs]) => {
                            const first = Array.isArray(msgs) ? msgs[0] : String(msgs);
                            // @ts-expect-error dynamic assignment to partial
                            mapped[key] = first;
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
            } else {
                if (data.errors) {
                    setFormErrors(data.errors);
                }
            }
        } catch (error) {
            console.error('Failed to create supplier:', error);
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

    const handleClose = () => {
        setFormData(initialFormData);
        setFormErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl transform transition-all flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Add New Supplier</h3>
                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
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
                                placeholder="Enter supplier name"
                            />
                        </div>
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                        </div>

                        <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Contact  Person</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                placeholder="Enter phone number"
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
                                placeholder="Enter email address"
                            />
                        </div>
                        {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                        </div>

                        <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                placeholder="Enter supplier address"
                            />
                        </div>
                        </div>

                        <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                placeholder="Add any notes or remarks"
                            />
                        </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
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
                                    Creating...
                                </>
                            ) : (
                                'Create Supplier'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
