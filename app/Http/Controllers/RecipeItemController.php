<?php

namespace App\Http\Controllers;

use App\Models\RecipeItem;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RecipeItemController extends Controller
{
    public function store(Request $request, Recipe $recipe): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.material_id' => 'required|exists:materials,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_id' => 'required|exists:measurement_units,id',
        ]);

        DB::beginTransaction();
        try {
            $createdItems = [];
            foreach ($validated['items'] as $itemData) {
                $item = $recipe->items()->create($itemData);
                $item->load(['material', 'unit']);
                $createdItems[] = $item;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $createdItems,
                'message' => 'Recipe items added successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to add recipe items: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, RecipeItem $recipeItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'material_id' => 'sometimes|required|exists:materials,id',
            'quantity' => 'sometimes|required|numeric|min:0.001',
            'unit_id' => 'sometimes|required|exists:measurement_units,id',
        ]);

        try {
            $recipeItem->update($validated);
            $recipeItem->load(['material', 'unit']);

            return response()->json([
                'success' => true,
                'data' => $recipeItem,
                'message' => 'Recipe item updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update recipe item: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, RecipeItem $recipeItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        try {
            $recipeItem->delete();

            return response()->json([
                'success' => true,
                'message' => 'Recipe item deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete recipe item: ' . $e->getMessage()
            ], 500);
        }
    }

    // Bulk update recipe items (replace all)
    public function updateBulk(Request $request, Recipe $recipe): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'nullable|exists:recipe_items,id',
            'items.*.material_id' => 'required|exists:materials,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_id' => 'required|exists:measurement_units,id',
        ]);

        DB::beginTransaction();
        try {
            $existingIds = $recipe->items()->pluck('id')->toArray();
            $updatedIds = [];

            foreach ($validated['items'] as $itemData) {
                if (isset($itemData['id']) && in_array($itemData['id'], $existingIds)) {
                    // Update existing
                    $recipe->items()->where('id', $itemData['id'])->update([
                        'material_id' => $itemData['material_id'],
                        'quantity' => $itemData['quantity'],
                        'unit_id' => $itemData['unit_id'],
                    ]);
                    $updatedIds[] = $itemData['id'];
                } else {
                    // Create new
                    $newItem = $recipe->items()->create([
                        'material_id' => $itemData['material_id'],
                        'quantity' => $itemData['quantity'],
                        'unit_id' => $itemData['unit_id'],
                    ]);
                    $updatedIds[] = $newItem->id;
                }
            }

            // Delete items not in the update
            $toDelete = array_diff($existingIds, $updatedIds);
            if (!empty($toDelete)) {
                $recipe->items()->whereIn('id', $toDelete)->delete();
            }

            DB::commit();

            $updatedItems = $recipe->items()->with(['material', 'unit'])->get();

            return response()->json([
                'success' => true,
                'data' => $updatedItems,
                'message' => 'Recipe items updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update recipe items: ' . $e->getMessage()
            ], 500);
        }
    }
}