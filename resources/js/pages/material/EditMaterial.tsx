import { useState, useEffect } from 'react';
import { X, Loader2, Layers } from 'lucide-react';

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

interface Material {
    id: number;
    code: string;
    name: string;
    category: string | null;
    description: string | null;
    is_active: boolean;
}

interface Category {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
}

interface MaterialFormData {
    code: string;
    name: string;
    category: string;
    description: string;
}

interface EditMaterialProps {
    isOpen: boolean;
    material: Material | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditMaterial({ isOpen, material, onClose, onSuccess }: EditMaterialProps) {
    const [formData, setFormData] = useState<MaterialFormData>({
        code: '',
        name: '',
        category: '',
        description: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<MaterialFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
        if (material) {
            setFormData({
                code: material.code || '',
                name: material.name || '',
                category: material.category || '',
                description: material.description || '',
            });
        }
    }, [isOpen, material]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories/active', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<MaterialFormData> = {};

        if (!formData.code.trim()) {
            errors.code = 'Code is required';
        }

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !material) return;

        setIsSubmitting(true);

        try {
            const submitData = {
                code: formData.code,
                name: formData.name,
                category: formData.category || null,
                description: formData.description || null,
                is_active: material.is_active,
            };

            const response = await fetch(`/api/materials/${material.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                if (response.status === 422) {
                    // Validation error
                    const data = await response.json();
                    if (data.errors) {
                        setFormErrors(data.errors);
                    }
                } else {
                    console.error('API Error:', response.status);
                    const text = await response.text();
                    console.error('Response:', text);
                }
                return;
            }

            const data = await response.json();

            if (data.success) {
                setFormErrors({});
                onSuccess();
                onClose();
            } else {
                if (data.errors) {
                    setFormErrors(data.errors);
                }
            }
        } catch (error) {
            console.error('Failed to update material:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof MaterialFormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleClose = () => {
        setFormErrors({});
        onClose();
    };

    if (!isOpen || !material) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Edit Material</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Material Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            placeholder="e.g., MAT-001"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                formErrors.code
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'
                            }`}
                        />
                        {formErrors.code && (
                            <p className="mt-1.5 text-sm text-red-500">{formErrors.code}</p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Material Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Coffee Beans"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                formErrors.name
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'
                            }`}
                        />
                        {formErrors.name && (
                            <p className="mt-1.5 text-sm text-red-500">{formErrors.name}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        >
                            <option value="">Select a category (optional)</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Add description (optional)"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
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
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:from-sky-600 hover:to-sky-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Update Material'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
