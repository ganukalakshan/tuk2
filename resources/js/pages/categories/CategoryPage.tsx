import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateCategory from './CreateCategory';
import EditCategory from './EditCategory';
import DeleteCategory from './DeleteCategory';

interface Category {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function CategoryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const getDashboardPath = () => {
        return '/dashboard';
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories', {
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
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter((category) => {
        const q = searchQuery.toLowerCase();
        return (
            category.name.toLowerCase().includes(q) ||
            (category.description && category.description.toLowerCase().includes(q))
        );
    });

    const handleCreateSuccess = () => {
        fetchCategories();
    };

    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchCategories();
    };

    const handleDeleteSuccess = () => {
        setDeleteConfirmId(null);
        fetchCategories();
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
                                    Category
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
                        <h2 className="text-3xl font-bold text-slate-800">Categories</h2>
                        <p className="text-slate-500 mt-1">Group your menu and materials by category</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add Category
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Category Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <Sparkles className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery ? 'No categories found' : 'No categories yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Start by adding your first category'}
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
                                            Description
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                            Status
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
                                                {category.description ? (
                                                    <p className="text-slate-600 max-w-md line-clamp-2">{category.description}</p>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
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
                                                    {deleteConfirmId === category.id ? (
                                                        <DeleteCategory
                                                            category={category}
                                                            onSuccess={handleDeleteSuccess}
                                                            onCancel={() => setDeleteConfirmId(null)}
                                                        />
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(category)}
                                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                                                title="Edit Category"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(category.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                                title="Delete Category"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                    <p>Showing {filteredCategories.length} of {categories.length} categories</p>
                    <p>{categories.filter((c) => c.is_active).length} active categories</p>
                </div>
            </main>

            {/* Create Modal */}
            <CreateCategory
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                categories={categories}
            />

            {/* Edit Modal */}
            <EditCategory
                isOpen={isEditModalOpen}
                category={editingCategory}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                }}
                onSuccess={handleEditSuccess}
                categories={categories}
            />
        </div>
    );
}
