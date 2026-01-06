<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RecipeController extends Controller

   
{
    public function index(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $recipes = $menuItem->recipes()
            ->with(['items.material', 'items.unit', 'createdBy'])
            ->orderBy('is_current', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $recipes
        ]);
    }

    public function current(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $recipe = $menuItem->currentRecipe()
            ->with(['items.material', 'items.unit'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => $recipe
        ]);
    }

    public function store(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'version' => 'required|string|max:10',
            'standard_yield' => 'required|numeric|min:0.001',
            'instructions' => 'nullable|string',
            'is_current' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.material_id' => 'required|exists:materials,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_id' => 'required|exists:measurement_units,id',
        ]);

        DB::beginTransaction();
        try {
            // If this is current, unset other current recipes
            if ($validated['is_current']) {
                $menuItem->recipes()->update(['is_current' => false]);
            }

            $recipe = $menuItem->recipes()->create([
                'version' => $validated['version'],
                'standard_yield' => $validated['standard_yield'],
                'instructions' => $validated['instructions'] ?? null,
                'is_current' => $validated['is_current'],
                'created_by' => auth()->id(),
            ]);

            foreach ($validated['items'] as $itemData) {
                $recipe->items()->create($itemData);
            }

            DB::commit();

            $recipe->load(['items.material', 'items.unit']);

            return response()->json([
                'success' => true,
                'data' => $recipe,
                'message' => 'Recipe created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create recipe: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'version' => 'sometimes|required|string|max:10',
            'standard_yield' => 'sometimes|required|numeric|min:0.001',
            'instructions' => 'nullable|string',
            'is_current' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            // If setting as current, unset other current recipes for this menu item
            if (isset($validated['is_current']) && $validated['is_current']) {
                $recipe->menuItem->recipes()->where('id', '!=', $recipe->id)->update(['is_current' => false]);
            }

            $recipe->update($validated);
            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $recipe->load(['items.material', 'items.unit']),
                'message' => 'Recipe updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update recipe: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, Recipe $recipe): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        try {
            $recipe->delete(); // Soft delete

            return response()->json([
                'success' => true,
                'message' => 'Recipe deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete recipe: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cost(Request $request, Recipe $recipe): JsonResponse
    {
        try {
            if (!auth()->check()) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
            }

            // Debug: Check if recipe exists
            if (!$recipe) {
                return response()->json(['success' => false, 'message' => 'Recipe not found'], 404);
            }

            $recipe->load(['items.material', 'items.unit', 'menuItem']);

            // Debug: Check relationships
            if (!$recipe->menuItem) {
                return response()->json(['success' => false, 'message' => 'Recipe menu item not found'], 404);
            }

            if ($recipe->items->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'Recipe has no items'], 400);
            }

            // Calculate cost using conversion_to_base from measurement_units table
            $items = $recipe->items->map(function ($item) {
                if (!$item->material) {
                    \Log::warning("Recipe item {$item->id} has no material");
                    return null;
                }
                if (!$item->unit) {
                    \Log::warning("Recipe item {$item->id} has no unit");
                    return null;
                }

                // Get the latest GRN item cost for this material
                $latestGrnItem = \DB::table('grn_items')
                    ->where('material_id', $item->material_id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if (!$latestGrnItem) {
                    \Log::warning("No GRN found for material {$item->material->name}");
                    return [
                        'material' => $item->material->name,
                        'recipe_quantity' => $item->quantity . ' ' . $item->unit->unit_name,
                        'grn_unit_price' => 0,
                        'converted_quantity' => 0,
                        'line_total' => 0,
                    ];
                }

                // Get GRN unit
                $grnUnit = \App\Models\MeasurementUnit::find($latestGrnItem->unit_id);
                if (!$grnUnit) {
                    \Log::warning("GRN unit not found for item {$latestGrnItem->id}");
                    return [
                        'material' => $item->material->name,
                        'recipe_quantity' => $item->quantity . ' ' . $item->unit->unit_name,
                        'grn_unit_price' => 0,
                        'converted_quantity' => 0,
                        'line_total' => 0,
                    ];
                }

                $recipeUnit = $item->unit;

                // Convert recipe quantity to base unit
                // E.g., If recipe uses 100g and base is kg: 100 / 0.001 = 100,000 base units? NO!
                // Actually: 100g with conversion_to_base=0.001 means 100g = 100 * 0.001 kg = 0.1kg
                // So to convert TO base: multiply by conversion_to_base
                $qty_in_base = $item->quantity * $recipeUnit->conversion_to_base;

                // Convert from base unit to GRN unit
                // E.g., 0.1 kg in base, GRN unit is g (conversion=0.001): 0.1 / 0.001 = 100g
                if ($grnUnit->conversion_to_base > 0) {
                    $qty_in_grn_unit = $qty_in_base / $grnUnit->conversion_to_base;
                } else {
                    $qty_in_grn_unit = $qty_in_base;
                }

                $line_total_lkr = $qty_in_grn_unit * $latestGrnItem->unit_price;

                return [
                    'material' => $item->material->name,
                    'recipe_quantity' => $item->quantity . ' ' . $item->unit->unit_name,
                    'grn_unit_price' => $latestGrnItem->unit_price,
                    'converted_quantity' => $qty_in_grn_unit,
                    'line_total' => $line_total_lkr,
                ];
            })->filter()->values(); // Remove null values

            if ($items->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'No valid recipe items found'], 400);
            }

            $recipeTotal = $items->sum('line_total');
            $costPerUnit = $recipe->standard_yield > 0 ? $recipeTotal / $recipe->standard_yield : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'name' => $recipe->menuItem->name . ' - ' . $recipe->version,
                    'items' => $items,
                    'recipe_total' => $recipeTotal,
                    'cost_per_unit' => $costPerUnit,
                    'standard_yield' => $recipe->standard_yield,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Recipe cost calculation error: ' . $e->getMessage(), [
                'recipe_id' => $recipe->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate recipe cost: ' . $e->getMessage()
            ], 500);
        }
    }
     /**
     * Get required raw materials for a ready-made product and quantity
     */
    public function requiredMaterials(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $quantity = (float) $request->input('quantity', 1);
        $recipe = $menuItem->currentRecipe()->with(['items.material', 'items.unit'])->first();
        if (!$recipe) {
            return response()->json(['success' => false, 'message' => 'No current recipe found for this product'], 404);
        }

        $materials = $recipe->items->map(function ($item) use ($quantity) {
            return [
                'material_id' => $item->material_id,
                'material_name' => $item->material->name,
                'required_quantity' => $item->quantity * $quantity,
                'unit' => $item->unit->unit_name,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'recipe_id' => $recipe->id,
                'materials' => $materials,
            ]
        ]);
    }
}