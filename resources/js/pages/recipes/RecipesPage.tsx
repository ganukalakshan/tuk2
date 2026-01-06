import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft, Package, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Recipe, MenuItem } from '../../types';
import RecipeModal from './RecipeModal';
import RecipeCostModal from '../../components/RecipeCostModal';

interface RecipeWithMenuItem extends Recipe {
    menu_item?: MenuItem;
}

export default function RecipesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<RecipeWithMenuItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

    const getDashboardPath = () => {
        if (user?.role === 'manager') return '/manager';
        return '/admin';
    };

    useEffect(() => {
        fetchRecipes();
        fetchMenuItems();
    }, []);

    const fetchRecipes = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all menu items with their current recipes
            const response = await fetch('/api/menu-items', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch menu items');
            }

            const data = await response.json();
            if (data.success) {
                // Get current recipes for each menu item
                const recipesWithItems = await Promise.all(
                    data.data.map(async (menuItem: MenuItem) => {
                        try {
                            const recipeResponse = await fetch(`/api/menu-items/${menuItem.id}/recipes/current`, {
                                credentials: 'include',
                                headers: { 'Accept': 'application/json' },
                            });

                            if (recipeResponse.ok) {
                                const recipeData = await recipeResponse.json();
                                if (recipeData.success && recipeData.data) {
                                    return {
                                        ...recipeData.data,
                                        menu_item: menuItem
                                    };
                                }
                            }
                        } catch (error) {
                            console.error(`Failed to fetch recipe for menu item ${menuItem.id}:`, error);
                        }
                        return null;
                    })
                );

                setRecipes(recipesWithItems.filter(recipe => recipe !== null));
            } else {
                throw new Error(data.message || 'Failed to fetch menu items');
            }
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch recipes');
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await fetch('/api/menu-items', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMenuItems(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch menu items:', error);
        }
    };

    const filteredRecipes = recipes.filter(recipe =>
        recipe.menu_item?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.menu_item?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.version.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateRecipe = () => {
        // Open modal to select a menu item first
        setSelectedMenuItem(null);
        setSelectedRecipe(null);
        setIsRecipeModalOpen(true);
    };

    const handleEditRecipe = (recipe: RecipeWithMenuItem) => {
        if (recipe.menu_item) {
            setSelectedMenuItem(recipe.menu_item);
            setSelectedRecipe(recipe);
            setIsRecipeModalOpen(true);
        }
    };

    const handleRecipeSuccess = () => {
        setIsRecipeModalOpen(false);
        setSelectedMenuItem(null);
        setSelectedRecipe(null);
        fetchRecipes();
    };

    const handleViewCost = (recipe: RecipeWithMenuItem) => {
        if (recipe.id) {
            setSelectedRecipeId(recipe.id);
            setIsCostModalOpen(true);
        }
    };

    const handleMenuItemSelect = (menuItem: MenuItem) => {
        setSelectedMenuItem(menuItem);
        setSelectedRecipe(null);
        setIsRecipeModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header – same format as Menu Items, but recipe colors & text */}
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
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Recipe Management
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg">
                                Recipes
                            </span>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title & Action bar under header (like product page) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Recipe Management</h2>
                        <p className="text-slate-500 mt-1">
                            Manage recipes for your menu items
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 w-64"
                            />
                        </div>
                        <button
                            onClick={handleCreateRecipe}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Create Recipe
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="ml-2 text-slate-600">Loading recipes...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchRecipes}
                            className="mt-2 text-red-600 hover:text-red-800 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Recipes Grid */}
                {!loading && !error && (
                    <>
                        {filteredRecipes.length === 0 ? (
                            <div className="text-center py-12">
                                <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                    No recipes found
                                </h3>
                                <p className="text-slate-500 mb-4">
                                    {searchQuery
                                        ? 'Try adjusting your search terms.'
                                        : 'Get started by creating your first recipe.'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={handleCreateRecipe}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Recipe
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRecipes.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
                                    >
                                        {/* Recipe Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">
                                                    {recipe.menu_item?.name}
                                                </h3>
                                                <p className="text-sm text-slate-600">
                                                    Code: {recipe.menu_item?.code}
                                                </p>
                                            </div>
                                            {recipe.is_current && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Current
                                                </span>
                                            )}
                                        </div>

                                        {/* Recipe Details */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Version:</span>
                                                <span className="font-medium">{recipe.version}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Yield:</span>
                                                <span className="font-medium">{recipe.standard_yield}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Ingredients:</span>
                                                <span className="font-medium">{recipe.items?.length || 0}</span>
                                            </div>
                                        </div>

                                        {/* Instructions Preview */}
                                        {recipe.instructions && (
                                            <div className="mb-4">
                                                <p className="text-xs text-slate-500 mb-1">Instructions:</p>
                                                <p className="text-sm text-slate-700 line-clamp-2">
                                                    {recipe.instructions}
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditRecipe(recipe)}
                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleViewCost(recipe)}
                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Cost
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Recipe Modal */}
            {isRecipeModalOpen && (
                <RecipeModal
                    isOpen={isRecipeModalOpen}
                    onClose={() => {
                        setIsRecipeModalOpen(false);
                        setSelectedMenuItem(null);
                        setSelectedRecipe(null);
                    }}
                    menuItem={selectedMenuItem}
                />
            )}

            {/* Recipe Cost Modal */}
            {isCostModalOpen && selectedRecipeId && (
                <RecipeCostModal
                    isOpen={isCostModalOpen}
                    onClose={() => {
                        setIsCostModalOpen(false);
                        setSelectedRecipeId(null);
                    }}
                    recipeId={selectedRecipeId}
                />
            )}

            {/* Menu Item Selection Modal for New Recipe */}
            {isRecipeModalOpen && !selectedMenuItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">Select Menu Item</h2>
                            <p className="text-slate-600">Choose a menu item to create a recipe for</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                {menuItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleMenuItemSelect(item)}
                                        className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-colors"
                                    >
                                        <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                        <p className="text-sm text-slate-600">Code: {item.code}</p>
                                        <p className="text-sm text-slate-500">{item.category?.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    setIsRecipeModalOpen(false);
                                    setSelectedMenuItem(null);
                                }}
                                className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
