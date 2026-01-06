import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

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

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent?: Category | null;
    display_order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface MenuDeleteCategoryProps {
    category: Category;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function MenuDeleteCategory({ category, onSuccess, onCancel }: MenuDeleteCategoryProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/menu-categories/${category.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.ok) {
                onSuccess();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('Failed to delete category');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Delete Menu Category</h3>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2">
                                Are you sure you want to delete this menu category?
                            </h4>
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                <p className="font-medium text-slate-800">{category.name}</p>
                                <p className="text-sm text-slate-500">Display Order: {category.display_order}</p>
                                {category.parent && (
                                    <p className="text-sm text-slate-500">Parent: {category.parent.name}</p>
                                )}
                                <p className="text-sm text-slate-500">Status: {category.is_active ? 'Active' : 'Inactive'}</p>
                            </div>
                            <p className="text-sm text-slate-600">
                                This action cannot be undone. The menu category will be permanently removed from the system.
                                Any child categories will become top-level categories.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6">
                        <button
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="flex-1 px-5 py-3 text-slate-700 font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}