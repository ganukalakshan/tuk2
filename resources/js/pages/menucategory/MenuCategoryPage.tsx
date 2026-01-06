import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MenuCreateCategory from  './MenuCreateCategory';
import MenuEditCategory from './MenuEditCategory';import MenuDeleteCategory from './MenuDeleteCategory';
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

export default function MenuCategoryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeOnly, setActiveOnly] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const getDashboardPath = () => {
        if (user?.role === 'manager') return '/manager';
        return '/admin';
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/menu-categories', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Failed to load categories', response.status, text);
                return;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Unexpected response', contentType, text);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCategories = categories.filter((category) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = category.name.toLowerCase().includes(q) ||
            (category.parent?.name && category.parent.name.toLowerCase().includes(q));
        const matchesActive = !activeOnly || category.is_active;
        return matchesSearch && matchesActive;
    });

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false);
        fetchCategories();
    };

    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
    };

    const handleDelete = (category: Category) => {
        setDeletingCategory(category);
    };

    const handleDeleteSuccess = () => {
        setDeletingCategory(null);
        fetchCategories();
    };

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(getDashboardPath())}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/25">
                                <Grid3X3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Menu Categories
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg">
                                Categories
                            </span>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Menu Categories</h2>
                        <p className="text-slate-500 mt-1">Manage your menu categories and hierarchy</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Active Only Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={activeOnly}
                                onChange={(e) => setActiveOnly(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-slate-700">Active only</span>
                        </label>
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 w-64"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            New Category
                        </button>
                    </div>
                </div>

                {/* Category Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <span className="ml-2 text-slate-600">Loading categories...</span>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <Sparkles className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery || !activeOnly ? 'No categories found' : 'No categories yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery || !activeOnly
                                    ? 'Try adjusting your search or filters'
                                    : 'Start by adding your first menu category'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                            Parent Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                            Display Order
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                            Active
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-slate-50/50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-bold text-emerald-700">
                                                            {category.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{category.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600">{category.parent?.name || 'None'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600">{category.display_order}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        category.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(category)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                                        title="Edit Category"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <MenuCreateCategory
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
            <MenuEditCategory
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                }}
                onSuccess={handleEditSuccess}
                category={editingCategory}
            />
            {deletingCategory && (
                <MenuDeleteCategory
                    category={deletingCategory}
                    onSuccess={handleDeleteSuccess}
                    onCancel={() => setDeletingCategory(null)}
                />
            )}
        </div>
    );
}