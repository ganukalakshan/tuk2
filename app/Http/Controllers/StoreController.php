<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Services\StoreService;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    /**
     * Get all store materials across all stores
     */
    public function index()
    {
        $stores = StoreService::getAllStoreMaterials();

        return response()->json($stores);
    }

    /**
     * Get materials in a specific store
     */
    public function show($storeName)
    {
        $materials = StoreService::getStoreMaterials($storeName);

        return response()->json($materials);
    }

    /**
     * Get store summary for all stores
     */
    public function summary()
    {
        $summaries = StoreService::getAllStoreSummaries();

        return response()->json($summaries);
    }

    /**
     * Get store summary for a specific store
     */
    public function storeSummary($storeName)
    {
        $summary = StoreService::getStoreSummary($storeName);

        return response()->json($summary);
    }

    /**
     * Update material quantity
     */
    public function updateQuantity(Request $request, $storeRecordId)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0',
        ]);

        $store = StoreService::updateMaterialQuantity($storeRecordId, $validated['quantity']);

        return response()->json([
            'message' => 'Quantity updated successfully',
            'store' => $store
        ]);
    }

    /**
     * Delete material from store
     */
    public function destroy($storeRecordId)
    {
        StoreService::removeMaterialFromStore($storeRecordId);

        return response()->json([
            'message' => 'Material removed successfully'
        ]);
    }

    /**
     * Get materials by store ID
     */
    public function getByStoreId($storeId)
    {
        $materials = Store::where('store_id', $storeId)
            ->where('quantity', '>', 0)
            ->with(['material', 'grn'])
            ->get();

        return response()->json($materials);
    }

    /**
     * Get all store types
     */
    public function getStoreTypes()
    {
        $storeTypes = Store::getAllStoreTypes();
        
        $formatted = [];
        foreach ($storeTypes as $id => $name) {
            $formatted[] = [
                'id' => $id,
                'name' => $name,
                'key' => Store::getStoreName($id),
            ];
        }

        return response()->json($formatted);
    }

        /**
     * Save ready-made product transaction, set expiry date, update store quantities
     * Expects: menu_item_id, quantity, store_id (optional)
     */
    public function saveReadyMadeProduct(Request $request)
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|integer|exists:menu_items,id',
            'quantity' => 'required|numeric|min:0.001',
            'store_id' => 'nullable|integer',
            'cost' => 'nullable|numeric|min:0',
        ]);

        $menuItem = \App\Models\MenuItem::findOrFail($validated['menu_item_id']);
        $recipe = $menuItem->currentRecipe()->with(['items.material', 'items.unit'])->first();
        if (!$recipe) {
            return response()->json(['success' => false, 'message' => 'No current recipe found for this product'], 404);
        }

        // Calculate required materials
        $requirements = $recipe->items->map(function ($item) use ($validated) {
            return [
                'material_id' => $item->material_id,
                'required_quantity' => $item->quantity * $validated['quantity'],
            ];
        })->toArray();

        // Check availability
        $availability = \App\Services\StoreService::checkRawMaterialAvailability($requirements, isset($validated['store_id']) ? $validated['store_id'] : null);
        $notEnough = collect($availability)->where('enough', false);
        if ($notEnough->isNotEmpty()) {
            return response()->json(['success' => false, 'message' => 'Not enough raw materials', 'details' => $availability], 422);
        }

        // Deduct raw materials (FIFO)
        foreach ($requirements as $req) {
            $remaining = $req['required_quantity'];
            $batches = \App\Models\Store::where('material_id', $req['material_id'])
                ->where('remaining_quantity', '>', 0)
                ->when(isset($validated['store_id']) && $validated['store_id'], function($q) use ($validated) {
                    $q->where('store_id', $validated['store_id']);
                })
                ->orderBy('expiry_date')
                ->orderBy('id')
                ->get();
            foreach ($batches as $batch) {
                if ($remaining <= 0) break;
                $deduct = min($batch->remaining_quantity, $remaining);
                $batch->remaining_quantity -= $deduct;
                $batch->save();
                $remaining -= $deduct;
            }
        }

        // Set expiry date (use shelf_life from menuItem or default, here 3 days)
        $expiryDays = $menuItem->shelf_life ?? 3;
        $expiryDate = now()->addDays($expiryDays);

        // Calculate cost per unit using the same logic as RecipeController@cost
        // Use the cost from frontend if provided, otherwise calculate it
        $costPerUnit = $validated['cost'] ?? null;
        if ($costPerUnit === null) {
            $items = $recipe->items->map(function ($item) {
                // Get the latest GRN item cost for this material
                $latestGrnItem = \DB::table('grn_items')
                    ->where('material_id', $item->material_id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if (!$latestGrnItem) {
                    return 0;
                }
                // Assume 1:1 unit conversion for simplicity (match RecipeController if you have more logic)
                $qty = $item->quantity;
                return $qty * $latestGrnItem->unit_price;
            });
            $recipeTotal = $items->sum();
            $costPerUnit = $recipe->standard_yield > 0 ? $recipeTotal / $recipe->standard_yield : 0;
        }

        // Save to food_store_records table
        $foodStoreRecord = \App\Models\FoodStoreRecord::create([
            'menu_item_id' => $menuItem->id,
            'user_id' => auth()->id(),
            'quantity' => $validated['quantity'],
            'expiry_date' => $expiryDate,
            'cost' => $costPerUnit,
        ]);

        return response()->json(['success' => true, 'message' => 'Ready-made product saved', 'food_store_record' => $foodStoreRecord]);
    }

    /**
     * Get all food store records with menu item and user details
     */
    public function getFoodStoreRecords()
    {
        $records = \App\Models\FoodStoreRecord::with(['menuItem', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $records]);
    }

    /**
     * Check if store has enough raw materials for requirements
     * Expects: [{material_id: int, required_quantity: float}]
     * Optional: store_id
     */
    public function checkRawMaterialAvailability(Request $request)
    {
        $validated = $request->validate([
            'requirements' => 'required|array|min:1',
            'requirements.*.material_id' => 'required|integer|exists:materials,id',
            'requirements.*.required_quantity' => 'required|numeric|min:0.001',
            'store_id' => 'nullable|integer',
        ]);
        $results = \App\Services\StoreService::checkRawMaterialAvailability($validated['requirements'], isset($validated['store_id']) ? $validated['store_id'] : null);
        return response()->json(['success' => true, 'data' => $results]);
    }

    /**
     * Move food store record to wastage
     */
    public function moveToWastage(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $record = \App\Models\FoodStoreRecord::findOrFail($id);

        // Create wastage record using the existing Wastage model
        $wastage = \App\Models\Wastage::create([
            'menu_item_id' => $record->menu_item_id,
            'food_store_record_id' => $record->id,
            'quantity' => $record->quantity,
            'cost' => $record->cost,
            'reason' => $validated['reason'] ?? 'Moved to wastage',
            'location' => 'store',
            'recorded_by' => auth()->id(),
            'date' => now()->toDateString(),
        ]);

        // Delete the food store record
        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product moved to wastage successfully',
            'wastage' => $wastage
        ]);
    }
}
