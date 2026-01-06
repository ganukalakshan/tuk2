<?php

namespace App\Http\Controllers;

use App\Models\Wastage;
use App\Models\MenuItem;
use App\Models\Recipe;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WastageController extends Controller
{
    /**
     * Get all wastage records
     */
    public function index()
    {
        $records = Wastage::with(['material', 'menuItem', 'unit', 'recordedBy'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'material_id' => $record->material_id,
                    'menu_item_id' => $record->menu_item_id,
                    'food_store_record_id' => $record->food_store_record_id,
                    'quantity' => $record->quantity,
                    'cost' => $record->cost,
                    'unit_id' => $record->unit_id,
                    'reason' => $record->reason,
                    'location' => $record->location,
                    'recorded_by' => $record->recorded_by,
                    'date' => $record->date,
                    'created_at' => $record->created_at,
                    'material' => $record->material ? [
                        'id' => $record->material->id,
                        'name' => $record->material->name,
                    ] : null,
                    'menu_item' => $record->menuItem ? [
                        'id' => $record->menuItem->id,
                        'name' => $record->menuItem->name,
                    ] : null,
                    'unit' => $record->unit ? [
                        'id' => $record->unit->id,
                        'name' => $record->unit->name,
                        'symbol' => $record->unit->symbol,
                    ] : null,
                    'recorded_by_user' => $record->recordedBy ? [
                        'id' => $record->recordedBy->id,
                        'name' => $record->recordedBy->name,
                    ] : null,
                ];
            });

        return response()->json(['success' => true, 'data' => $records]);
    }

    /**
     * Store a new wastage record
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'nullable|integer|exists:materials,id',
            'menu_item_id' => 'nullable|integer|exists:menu_items,id',
            'quantity' => 'required|numeric|min:0.001',
            'cost' => 'nullable|numeric|min:0',
            'unit_id' => 'nullable|integer|exists:measurement_units,id',
            'reason' => 'nullable|string|max:500',
            'location' => 'required|in:store,kitchen,bar',
        ]);

        DB::beginTransaction();

        try {
            $wastage = Wastage::create([
                'material_id' => $validated['material_id'] ?? null,
                'menu_item_id' => $validated['menu_item_id'] ?? null,
                'quantity' => $validated['quantity'],
                'cost' => $validated['cost'] ?? null,
                'unit_id' => $validated['unit_id'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'location' => $validated['location'],
                'recorded_by' => auth()->id(),
                'date' => now()->toDateString(),
            ]);

            // If this is a product (menu_item) wastage, deduct raw materials from store
            $deductionInfo = [];
            if (!empty($validated['menu_item_id'])) {
                $deductionInfo = $this->deductRawMaterialsFromStore($validated['menu_item_id'], $validated['quantity']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Wastage record created successfully',
                'data' => $wastage,
                'deduction_info' => $deductionInfo
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create wastage record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deduct raw materials from store based on product recipe
     * @return array Debug information about the deduction
     */
    private function deductRawMaterialsFromStore(int $menuItemId, float $productQuantity): array
    {
        // Get the menu item with its department
        $menuItem = MenuItem::with('department')->find($menuItemId);
        
        if (!$menuItem) {
            return [];
        }

        // Get the current recipe for this product
        $recipe = Recipe::where('menu_item_id', $menuItemId)
            ->where('is_current', true)
            ->with('items.material')
            ->first();

        if (!$recipe || $recipe->items->isEmpty()) {
            return [];
        }

        // Get the store_id from menu item's department
        $storeId = $menuItem->department_id;

        // For each recipe item, deduct from store using FIFO
        foreach ($recipe->items as $recipeItem) {
            $materialId = $recipeItem->material_id;
            $quantityToDeduct = floatval($recipeItem->quantity) * $productQuantity;
            $materialName = $recipeItem->material ? $recipeItem->material->name : 'Unknown';

            $deductionRecord = [
                'material_id' => $materialId,
                'material_name' => $materialName,
                'quantity_to_deduct' => $quantityToDeduct,
                'store_records_found' => 0,
                'actually_deducted' => 0,
            ];

            $debug['steps'][] = "Processing material: {$materialName} (ID: {$materialId}), need to deduct: {$quantityToDeduct}";

            // First try to get from the specific store
            $storeRecords = Store::where('material_id', $materialId)
                ->where('store_id', $storeId)
                ->where('remaining_quantity', '>', 0)
                ->orderBy('transferred_at', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            // If no records in specific store, try all stores
            if ($storeRecords->isEmpty()) {
                $storeRecords = Store::where('material_id', $materialId)
                    ->where('remaining_quantity', '>', 0)
                    ->orderBy('transferred_at', 'asc')
                    ->orderBy('id', 'asc')
                    ->get();
            }

            $deductionRecord['store_records_found'] = $storeRecords->count();
            $debug['steps'][] = "Found {$storeRecords->count()} store records with remaining stock";

            $remainingToDeduct = $quantityToDeduct;
            $totalDeducted = 0;

            foreach ($storeRecords as $storeRecord) {
                if ($remainingToDeduct <= 0) {
                    break;
                }

                $beforeQty = floatval($storeRecord->remaining_quantity);
                
                if ($beforeQty >= $remainingToDeduct) {
                    // This batch has enough quantity
                    $storeRecord->remaining_quantity = $beforeQty - $remainingToDeduct;
                    $storeRecord->save();
                    $totalDeducted += $remainingToDeduct;
                    $debug['steps'][] = "Store record #{$storeRecord->id}: Deducted {$remainingToDeduct}. Before: {$beforeQty}, After: {$storeRecord->remaining_quantity}";
                    $remainingToDeduct = 0;
                } else {
                    // Use all from this batch and continue to next
                    $deducted = $beforeQty;
                    $remainingToDeduct -= $beforeQty;
                    $storeRecord->remaining_quantity = 0;
                    $storeRecord->save();
                    $totalDeducted += $deducted;
                    $debug['steps'][] = "Store record #{$storeRecord->id}: Deducted {$deducted} (all). Before: {$beforeQty}, After: 0. Still need: {$remainingToDeduct}";
                }
            }

            $deductionRecord['actually_deducted'] = $totalDeducted;
            
            if ($remainingToDeduct > 0) {
                $deductionRecord['shortage'] = $remainingToDeduct;
                $debug['steps'][] = "WARNING: Insufficient stock for {$materialName}. Short by: {$remainingToDeduct}";
            }

            $debug['deductions'][] = $deductionRecord;
        }

        return $debug;
    }

    /**
     * Delete a wastage record
     */
    public function destroy($id)
    {
        $wastage = Wastage::findOrFail($id);
        $wastage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Wastage record deleted successfully'
        ]);
    }
}
