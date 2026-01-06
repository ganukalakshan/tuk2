import { useState, useEffect } from 'react';
import { X, Package, Hash, Tag, DollarSign, Loader2, Image, MapPin } from 'lucide-react';

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

interface MenuCategory {
    id: number;
    name: string;
    is_active: boolean;
}

interface Department {
    store_id: number;
    name: string;
    key: string;
    description?: string;
    is_active: boolean;
}

interface MenuItemFormData {
    code: string;
    name: string;
    category_id: string;
    department_id: string;
    sale_type: 'kot' | 'bot' | 'both';
    prep_type: 'made_to_order' | 'ready_made';
    price: string;
    cost: string;
    is_active: boolean;
    display_order: string;
    image: File | null;
}

interface CreateMenuItemProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const initialFormData: MenuItemFormData = {
    code: '',
    name: '',
    category_id: '',
    department_id: '',
    sale_type: 'kot',
    prep_type: 'made_to_order',
    price: '',
    cost: '0',
    is_active: true,
    display_order: '0',
    image: null,
};

export default function CreateMenuItem({ isOpen, onClose, onSuccess }: CreateMenuItemProps) {
    const [formData, setFormData] = useState<MenuItemFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Partial<MenuItemFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchDepartments();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/menu-categories?active_only=true', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
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

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/departments?active_only=true', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDepartments(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<MenuItemFormData> = {};

        if (!formData.code.trim()) {
            errors.code = 'Code is required';
        }

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!formData.category_id) {
            errors.category_id = 'Category is required';
        }

        if (!formData.price.trim()) {
            errors.price = 'Price is required';
        } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
            errors.price = 'Price must be a valid positive number';
        }

        if (formData.cost && (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0)) {
            errors.cost = 'Cost must be a valid positive number';
        }

        if (formData.display_order && (isNaN(parseInt(formData.display_order)) || parseInt(formData.display_order) < 0)) {
            errors.display_order = 'Display order must be a valid non-negative integer';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('code', formData.code);
            formDataToSend.append('name', formData.name);
            formDataToSend.append('category_id', formData.category_id);
            if (formData.department_id) {
                formDataToSend.append('department_id', formData.department_id);
            }
            formDataToSend.append('sale_type', formData.sale_type);
            formDataToSend.append('prep_type', formData.prep_type);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('cost', formData.cost || '0');
            formDataToSend.append('is_active', formData.is_active ? '1' : '0');
            formDataToSend.append('display_order', formData.display_order || '0');

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            const response = await fetch('/api/menu-items', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                console.error('API Error:', response.status);
                const text = await response.text();
                console.error('Response:', text);
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
            console.error('Failed to create menu item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, files } = e.target as HTMLInputElement;
        const checked = (e.target as HTMLInputElement).checked;

        if (type === 'file' && files && files.length > 0) {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                [name]: null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        if (formErrors[name as keyof MenuItemFormData]) {
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
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Add New Menu Item</h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Code */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Hash className="w-4 h-4 text-slate-400" />
                                Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                placeholder="Enter item code"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.code
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            />
                            {formErrors.code && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.code}</p>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Package className="w-4 h-4 text-slate-400" />
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter item name"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.name
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            />
                            {formErrors.name && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Image className="w-4 h-4 text-slate-400" />
                                Image
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                />
                                <p className="text-xs text-slate-500">
                                    Accepted formats: JPEG, PNG, JPG, GIF. Max size: 2MB
                                </p>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Tag className="w-4 h-4 text-slate-400" />
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.category_id
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {formErrors.category_id && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.category_id}</p>
                            )}
                        </div>

                        {/* Department */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                Department
                            </label>
                            <select
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.department_id
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            >
                                <option value="">Select a department</option>
                                {departments.map(department => (
                                    <option key={department.store_id} value={department.store_id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                            {formErrors.department_id && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.department_id}</p>
                            )}
                        </div>

                        {/* Sale Type */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Tag className="w-4 h-4 text-slate-400" />
                                Sale Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="sale_type"
                                value={formData.sale_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                            >
                                <option value="kot">KOT (Kitchen Order)</option>
                                <option value="bot">BOT (Bar Order)</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        {/* Prep Type */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Package className="w-4 h-4 text-slate-400" />
                                Preparation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="prep_type"
                                value={formData.prep_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                            >
                                <option value="made_to_order">Made to Order</option>
                                <option value="ready_made">Ready Made</option>
                            </select>
                        </div>

                        {/* Price */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <DollarSign className="w-4 h-4 text-slate-400" />
                                Price <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.price
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            />
                            {formErrors.price && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.price}</p>
                            )}
                        </div>

                        {/* Cost */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <DollarSign className="w-4 h-4 text-slate-400" />
                                Cost
                            </label>
                            <input
                                type="number"
                                name="cost"
                                value={formData.cost}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.cost
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            />
                            {formErrors.cost && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.cost}</p>
                            )}
                        </div>

                        {/* Display Order */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Hash className="w-4 h-4 text-slate-400" />
                                Display Order
                            </label>
                            <input
                                type="number"
                                name="display_order"
                                value={formData.display_order}
                                onChange={handleInputChange}
                                placeholder="0"
                                min="0"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.display_order
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'
                                }`}
                            />
                            {formErrors.display_order && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.display_order}</p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500 focus:ring-2"
                            />
                            <label className="text-sm font-semibold text-slate-700">
                                Active
                            </label>
                        </div>
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
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Add Menu Item'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}