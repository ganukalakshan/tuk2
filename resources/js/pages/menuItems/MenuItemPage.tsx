import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft, Package, ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';
import CreateMenuItem from './CreateMenuItem';
import EditMenuItem from './EditMenuItem';
import DeleteMenuItem from './DeleteMenuItem';
import RecipeModal from '../recipes/RecipeModal';

export default function MenuItemPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [recipeMenuItem, setRecipeMenuItem] = useState<MenuItem | null>(null);

    const getDashboardPath = () => {
        if (user?.role === 'manager') return '/manager';
        return '/admin';
    };

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/menu-items', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch menu items');
            }

            const data = await response.json();
            if (data.success) {
                setMenuItems(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch menu items');
            }
        } catch (error) {
            console.error('Failed to fetch menu items:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch menu items');
        } finally {
            setLoading(false);
        }
    };

    const filteredMenuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.name && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleEdit = (item: MenuItem) => {
        setEditingMenuItem(item);
        setIsEditModalOpen(true);
    };

    const handleDelete = (item: MenuItem) => {
        setMenuItemToDelete(item);
        setDeleteConfirmId(item.id);
    };

    const handleRecipe = (item: MenuItem) => {
        setRecipeMenuItem(item);
        setIsRecipeModalOpen(true);
    };

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false);
        fetchMenuItems();
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setEditingMenuItem(null);
        fetchMenuItems();
    };

    const handleDeleteSuccess = () => {
        setDeleteConfirmId(null);
        setMenuItemToDelete(null);
        fetchMenuItems();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50">
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
                            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/25">
                                <Box className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Menu Items
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-100 rounded-lg">
                                Products
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
                        <h2 className="text-3xl font-bold text-slate-800">Menu Items</h2>
                        <p className="text-slate-500 mt-1">Manage your menu items and pricing</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 w-64"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                        <span className="ml-2 text-slate-600">Loading menu items...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchMenuItems}
                            className="mt-2 text-red-600 hover:text-red-800 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Menu Items Grid */}
                {!loading && !error && (
                    <>
                        {filteredMenuItems.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                    {searchQuery ? 'No menu items found' : 'No menu items yet'}
                                </h3>
                                <p className="text-slate-500 text-center max-w-sm">
                                    {searchQuery
                                        ? 'Try adjusting your search query'
                                        : 'Get started by adding your first menu item'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredMenuItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Image */}
                                        {item.image ? (
                                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                                <img
                                                    src={`/storage/menu-items/${item.image}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                                <Package className="w-12 h-12 text-slate-400" />
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-slate-800 text-lg mb-1">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mb-2">
                                                        Code: {item.code}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mb-2">
                                                        Category: {item.category?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                {!item.is_active && (
                                                    <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-2xl font-bold text-red-600">
                                                    {item.price} LKR
                                                </p>
                                                {item.cost > 0 && (
                                                    <p className="text-sm text-slate-500">
                                                        Cost: {item.cost} LKR
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                                                <span>{item.sale_type.toUpperCase()}</span>
                                                <span>{item.prep_type.replace('_', ' ')}</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => handleRecipe(item)}
                                                    className="inline-flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                >
                                                    <ChefHat className="w-4 h-4" />
                                                    Recipe
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="inline-flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="inline-flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
            {/* Modals */}
            <CreateMenuItem
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
            <EditMenuItem
                isOpen={isEditModalOpen}
                menuItem={editingMenuItem}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingMenuItem(null);
                }}
                onSuccess={handleEditSuccess}
            />
            {menuItemToDelete && (
                <DeleteMenuItem
                    menuItem={menuItemToDelete}
                    onSuccess={handleDeleteSuccess}
                    onCancel={() => {
                        setDeleteConfirmId(null);
                        setMenuItemToDelete(null);
                    }}
                />
            )}
            <RecipeModal
                isOpen={isRecipeModalOpen}
                onClose={() => {
                    setIsRecipeModalOpen(false);
                    setRecipeMenuItem(null);
                }}
                menuItem={recipeMenuItem}
            />
        </div>
    );
}