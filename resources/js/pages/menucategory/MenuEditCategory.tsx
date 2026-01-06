import { useState, useEffect } from 'react';
import { X, Grid3X3, Loader2 } from 'lucide-react';

const getCsrfToken = (): string => {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    display_order: number;
    is_active: boolean;
}

interface CategoryFormData {
    name: string;
    parent_id: number | null;
    display_order: number;
    is_active: boolean;
}

interface FormErrors {
    name?: string;
    parent_id?: string;
    display_order?: string;
    is_active?: string;
}

interface MenuEditCategoryProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: Category | null;
}

export default function MenuEditCategory({ isOpen, onClose, onSuccess, category }: MenuEditCategoryProps) {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        parent_id: null,
        display_order: 0,
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        if (isOpen && category) {
            setFormData({
                name: category.name,
                parent_id: category.parent_id,
                display_order: category.display_order,
                is_active: category.is_active,
            });
            fetchCategories();
        }
    }, [isOpen, category]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/menu-categories', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (formData.display_order < 0) {
            errors.display_order = 'Display order must be >= 0';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !category) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/menu-categories/${category.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('API Error:', response.status, text);
                alert('Failed to update category');
                return;
            }

            const data = await response.json();
            if (data.success) {
                setFormErrors({});
                onSuccess();
                onClose();
            } else if (data.errors) {
                setFormErrors(data.errors);
            } else {
                alert(data.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Failed to update category:', error);
            alert('Failed to update category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value;
        setFormData((prev) => ({ ...prev, [name]: newValue }));
        if (formErrors[name as keyof CategoryFormData]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    if (!isOpen || !category) return null;

    const availableParents = categories.filter((cat) => cat.id !== category.id);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/25">
                            <Grid3X3 className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Edit Category</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-96">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                maxLength={50}
                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                                    formErrors.name ? 'border-red-300' : 'border-slate-300'
                                }`}
                                placeholder="Enter category name"
                            />
                            {formErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Parent Category */}
                        <div>
                            <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700 mb-2">
                                Parent Category
                            </label>
                            <select
                                id="parent_id"
                                name="parent_id"
                                value={formData.parent_id || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                            >
                                <option value="">None</option>
                                {availableParents.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Display Order */}
                        <div>
                            <label htmlFor="display_order" className="block text-sm font-medium text-slate-700 mb-2">
                                Display Order
                            </label>
                            <input
                                type="number"
                                id="display_order"
                                name="display_order"
                                value={formData.display_order}
                                onChange={handleInputChange}
                                min={0}
                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                                    formErrors.display_order ? 'border-red-300' : 'border-slate-300'
                                }`}
                            />
                            {formErrors.display_order && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.display_order}</p>
                            )}
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                Active
                            </label>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Category'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}