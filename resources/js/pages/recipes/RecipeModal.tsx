import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChefHat, Save, Loader2 } from 'lucide-react';
import { Material, MeasurementUnit, Recipe, RecipeItem, MenuItem } from '../../types';

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItem: MenuItem | null;
}

interface ValidationErrors {
    version?: string;
    standard_yield?: string;
    items?: string;
    general?: string;
}

export default function RecipeModal({ isOpen, onClose, menuItem }: RecipeModalProps) {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [units, setUnits] = useState<MeasurementUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const getCsrfToken = (): string => {
        const name = 'XSRF-TOKEN=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let c of ca) {
            const trimmed = c.trim();
            if (trimmed.startsWith(name)) {
                return trimmed.substring(name.length);
            }
        }
        return '';
    };

    useEffect(() => {
        if (isOpen && menuItem) {
            fetchData();
        }
    }, [isOpen, menuItem]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch current recipe
            const recipeResponse = await fetch(`/api/menu-items/${menuItem!.id}/recipes/current`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (recipeResponse.ok) {
                const recipeData = await recipeResponse.json();
                if (recipeData.success) {
                    setRecipe(recipeData.data);
                }
            }

            // Fetch materials
            const materialsResponse = await fetch('/api/materials', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (materialsResponse.ok) {
                const materialsData = await materialsResponse.json();
                if (materialsData.success) {
                    setMaterials(materialsData.data);
                }
            }

            // Fetch units
            const unitsResponse = await fetch('/api/measurement-units', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (unitsResponse.ok) {
                const unitsData = await unitsResponse.json();
                if (unitsData.success) {
                    setUnits(unitsData.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!menuItem) return;

        setErrors({});
        setSaving(true);

        try {
            const recipeData = {
                version: recipe?.version || '1.0',
                standard_yield: Number(recipe?.standard_yield) || 1,
                instructions: recipe?.instructions || null,
                is_current: recipe?.is_current ?? true,
                items: (recipe?.items || []).map(item => ({
                    id: item.id,
                    material_id: item.material_id,
                    quantity: Number(item.quantity),
                    unit_id: item.unit_id,
                })),
            };

            // Validate
            if (!recipeData.items.length) {
                setErrors({ items: 'At least one ingredient is required' });
                return;
            }

            if (recipeData.standard_yield <= 0) {
                setErrors({ standard_yield: 'Standard yield must be greater than 0' });
                return;
            }

            let response;
            if (recipe?.id) {
                // Update existing recipe
                response = await fetch(`/api/recipes/${recipe.id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        version: recipeData.version,
                        standard_yield: recipeData.standard_yield,
                        instructions: recipeData.instructions,
                        is_current: recipeData.is_current,
                    }),
                });

                if (response.ok) {
                    // Update items
                    await fetch(`/api/recipes/${recipe.id}/items`, {
                        method: 'PUT',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': getCsrfToken(),
                        },
                        body: JSON.stringify({ items: recipeData.items }),
                    });
                }
            } else {
                // Create new recipe
                response = await fetch(`/api/menu-items/${menuItem.id}/recipes`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify(recipeData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Show success message (you can implement a toast here)
                    alert('Recipe saved successfully!');
                    onClose();
                } else {
                    setErrors({ general: result.message || 'Failed to save recipe' });
                }
            } else {
                const errorData = await response.json();
                setErrors({ general: errorData.message || 'Failed to save recipe' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setErrors({ general: 'An error occurred while saving' });
        } finally {
            setSaving(false);
        }
    };

    const addIngredient = () => {
        const newItem: RecipeItem = {
            material_id: materials[0]?.id || 0,
            unit_id: units[0]?.id || 0,
            quantity: 1,
        };

        setRecipe(prev => prev ? {
            ...prev,
            items: [...(prev.items || []), newItem]
        } : {
            version: '1.0',
            standard_yield: 1,
            instructions: null,
            is_current: true,
            items: [newItem]
        });
    };

    const updateIngredient = (index: number, field: keyof RecipeItem, value: any) => {
        setRecipe(prev => prev ? {
            ...prev,
            items: prev.items?.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        } : null);
    };

    const removeIngredient = (index: number) => {
        setRecipe(prev => prev ? {
            ...prev,
            items: prev.items?.filter((_, i) => i !== index)
        } : null);
    };

    if (!isOpen || !menuItem) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ChefHat className="w-6 h-6 text-emerald-600" />
                            Recipe - {menuItem.name}
                        </h2>
                        <p className="text-slate-600">Code: {menuItem.code}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <span className="ml-2 text-slate-600">Loading recipe data...</span>
                        </div>
                    ) : (
                        <>
                            {/* Recipe Header */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Version
                                    </label>
                                    <input
                                        type="text"
                                        value={recipe?.version || '1.0'}
                                        onChange={(e) => setRecipe(prev => prev ? { ...prev, version: e.target.value } : null)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    {errors.version && <p className="text-red-500 text-sm mt-1">{errors.version}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Standard Yield
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={recipe?.standard_yield || 1}
                                        onChange={(e) => setRecipe(prev => prev ? { ...prev, standard_yield: parseFloat(e.target.value) || 1 } : null)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    {errors.standard_yield && <p className="text-red-500 text-sm mt-1">{errors.standard_yield}</p>}
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={recipe?.is_current ?? true}
                                            onChange={(e) => setRecipe(prev => prev ? { ...prev, is_current: e.target.checked } : null)}
                                            className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Current Recipe</span>
                                    </label>
                                </div>
                            </div>

                            {/* Ingredients Table */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Ingredients</h3>
                                    <button
                                        onClick={addIngredient}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Ingredient
                                    </button>
                                </div>

                                {errors.items && <p className="text-red-500 text-sm mb-4">{errors.items}</p>}

                                <div className="overflow-x-auto">
                                    <table className="w-full border border-slate-200 rounded-lg">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Material</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Quantity</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Unit</th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(recipe?.items || []).map((item, index) => (
                                                <tr key={index} className="border-t border-slate-200">
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={item.material_id}
                                                            onChange={(e) => updateIngredient(index, 'material_id', parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        >
                                                            {materials.map(material => (
                                                                <option key={material.id} value={material.id}>
                                                                    {material.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            value={item.quantity}
                                                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={item.unit_id}
                                                            onChange={(e) => updateIngredient(index, 'unit_id', parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        >
                                                            {units.map(unit => (
                                                                <option key={unit.id} value={unit.id}>
                                                                    {unit.unit_name} ({unit.unit_symbol})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => removeIngredient(index)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Instructions
                                </label>
                                <textarea
                                    value={recipe?.instructions || ''}
                                    onChange={(e) => setRecipe(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Enter preparation instructions..."
                                />
                            </div>

                            {errors.general && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{errors.general}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {recipe?.id ? 'Save Recipe' : 'Create Recipe'}
                    </button>
                </div>
            </div>
        </div>
    );
}