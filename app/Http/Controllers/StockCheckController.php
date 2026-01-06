<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Store;
use App\Models\FoodStoreRecord;
use App\Services\FIFOConsumptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class StockCheckController extends Controller
{
    /**
     * Check if there's sufficient stock for order items
     */
    public function checkStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $fifoService = app(FIFOConsumptionService::class);
        $insufficientItems = [];

        foreach ($validated['items'] as $item) {
            // Get menu item
            $menuItem = MenuItem::find($item['menu_item_id']);
            
            if (!$menuItem) {
                continue;
            }

            // First, check if this is a ready-made product in food_store_records
            $foodStoreRecord = FoodStoreRecord::where('menu_item_id', $menuItem->id)
                ->where('quantity', '>', 0)
                ->first();

            if ($foodStoreRecord) {
                // This is a ready-made product - check food_store_records quantity
                $availableQty = $foodStoreRecord->quantity;
                $neededQty = $item['quantity'];

                if ($availableQty < $neededQty) {
                    $insufficientItems[] = [
                        'menu_item' => $menuItem->name,
                        'material' => 'Ready-made product',
                        'needed' => $neededQty,
                        'available' => $availableQty,
                        'unit' => 'units'
                    ];
                }
                continue; // Skip raw material check
            }

            // If not ready-made, check raw materials from recipe
            $menuItemWithRecipe = MenuItem::with(['currentRecipe.items.material'])->find($item['menu_item_id']);
            
            if (!$menuItemWithRecipe || !$menuItemWithRecipe->currentRecipe) {
                // No recipe and no ready-made stock
                continue;
            }

            $recipe = $menuItemWithRecipe->currentRecipe;
            
            // Check each raw material in the recipe
            foreach ($recipe->items as $recipeItem) {
                if (!$recipeItem->material) {
                    continue;
                }

                $material = $recipeItem->material;
                $quantityNeeded = (float)$recipeItem->quantity * (float)$item['quantity'];

                // Find which store has this material
                $storeBatch = Store::where('material_id', $material->id)
                    ->where('remaining_quantity', '>', 0)
                    ->orderBy('store_id')
                    ->first();

                if (!$storeBatch) {
                    $insufficientItems[] = [
                        'menu_item' => $menuItem->name,
                        'material' => $material->name,
                        'needed' => $quantityNeeded,
                        'available' => 0,
                        'unit' => 'units'
                    ];
                    continue;
                }

                $storeId = $storeBatch->store_id;

                // Check available quantity
                $available = $fifoService->getAvailableQuantity($material->id, $storeId);
                
                if ($available < $quantityNeeded) {
                    $insufficientItems[] = [
                        'menu_item' => $menuItem->name,
                        'material' => $material->name,
                        'needed' => round($quantityNeeded, 2),
                        'available' => round($available, 2),
                        'unit' => $storeBatch->unit ?? 'units'
                    ];
                }
            }
        }

        if (!empty($insufficientItems)) {
            return response()->json([
                'success' => false,
                'has_stock' => false,
                'message' => 'Insufficient stock for some items',
                'insufficient_items' => $insufficientItems
            ], 200);
        }

        return response()->json([
            'success' => true,
            'has_stock' => true,
            'message' => 'All items have sufficient stock'
        ], 200);
    }
}
