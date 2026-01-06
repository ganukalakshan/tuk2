import { useEffect, useState } from 'react';
import { X, Grid3X3, FileText, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

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
    description: string | null;
    parent_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface CategoryFormData {
    name: string;
    description: string;
    is_active: boolean;
    parent_id: number | null;
}

interface EditCategoryProps {
    isOpen: boolean;
    category: Category | null;
    onClose: () => void;
    onSuccess: () => void;
    categories?: Array<{ id: number; name: string; parent_id: number | null }>;
}

export default function EditCategory({ isOpen, category, onClose, onSuccess, categories = [] }: EditCategoryProps) {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        is_active: true,
        parent_id: null,
    });
    const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                is_active: category.is_active,
                parent_id: category.parent_id || null,
            });
        }
    }, [category]);

    const validateForm = (): boolean => {
        const errors: Partial<CategoryFormData> = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !category) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/categories/${category.id}`, {
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
                return;
            }

            const data = await response.json();
            if (data.success) {
                setFormErrors({});
                onSuccess();
                onClose();
            } else if (data.errors) {
                setFormErrors(data.errors);
            }
        } catch (error) {
            console.error('Failed to update category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof CategoryFormData]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleToggleActive = () => {
        setFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
    };

    const handleClose = () => {
        setFormErrors({});
        onClose();
    };

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
                            <Grid3X3 className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Edit Category</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Grid3X3 className="w-4 h-4 text-slate-400" />
                            Parent Category (Optional)
                        </label>
                        <select
                            name="parent_id"
                            value={formData.parent_id || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, parent_id: value ? parseInt(value) : null }));
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        >
                            <option value="">None (Main Category)</option>
                            {categories.filter(cat => !cat.parent_id && cat.id !== category?.id).map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1.5">Select a parent category to make this a subcategory</p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Grid3X3 className="w-4 h-4 text-slate-400" />
                            {formData.parent_id ? 'Sub-Category Name' : 'Category Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={formData.parent_id ? "Enter sub-category name" : "Enter category name"}
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                formErrors.name
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                            }`}
                        />
                        {formErrors.name && (
                            <p className="mt-1.5 text-sm text-red-500">{formErrors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Add a short description (optional)"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Active</p>
                            <p className="text-xs text-slate-500">Toggle to enable or disable the category</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleActive}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 transition-colors"
                        >
                            {formData.is_active ? (
                                <>
                                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-medium text-emerald-700">Active</span>
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">Inactive</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
