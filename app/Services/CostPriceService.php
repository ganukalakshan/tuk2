<?php

namespace App\Services;

use App\Models\SalesItem;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\Store;
use App\Models\GrnItem;
use App\Models\Material;
use App\Models\MeasurementUnit;
use App\Models\StoreConsumption;
use Illuminate\Support\Facades\DB;

class CostPriceService
{
    /**
     * Calculate cost price for a sales item based on its recipe
     * Uses actual store batches (FIFO) to get real costs
     * Handles multiple GRN batches with different prices
     */
    public function calculateCostPrice(SalesItem $salesItem): float
    {
        $menuItem = $salesItem->menuItem;
        if (!$menuItem) {
            return 0;
        }

        // Get the current/latest recipe for this menu item
        $recipe = $menuItem->currentRecipe ?? $menuItem->recipes()->latest()->first();
        if (!$recipe) {
            return 0;
        }

        $totalCost = 0;

        // Process each recipe item
        foreach ($recipe->items as $recipeItem) {
            // Calculate cost based on actual store batches (FIFO)
            $itemCost = $this->calculateCostFromStoreBatches(
                $recipeItem->material_id,
                (float)$recipeItem->quantity * (float)$salesItem->quantity,
                $recipeItem->unit_id
            );
            
            $totalCost += $itemCost;
        }

        return round($totalCost, 2);
    }

    /**
     * Calculate cost based on actual store batches using FIFO
     * This accounts for different GRN prices by using actual store records
     */
    private function calculateCostFromStoreBatches(
        int $materialId,
        float $quantityNeeded,
        int $recipeUnitId
    ): float {
        $remainingInRecipeUnit = $quantityNeeded;
        $totalCost = 0;

        // Get recipe unit for conversion
        $recipeUnit = MeasurementUnit::find($recipeUnitId);
        if (!$recipeUnit) {
            return 0;
        }

        // Get store entries in FIFO order (oldest first, with remaining quantity)
        $storeEntries = Store::where('material_id', $materialId)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('transferred_at')
            ->orderBy('created_at')
            ->get();

        if ($storeEntries->count() === 0) {
            // Fallback to GRN if no store inventory
            return $this->getLatestCostPerUnit($materialId, $recipeUnitId) * $quantityNeeded;
        }

        // Process each store batch
        foreach ($storeEntries as $storeEntry) {
            if ($remainingInRecipeUnit <= 0) {
                break;
            }

            // Get the store unit
            $storeUnit = MeasurementUnit::where('unit_symbol', $storeEntry->unit)->first();
            if (!$storeUnit) {
                continue;
            }

            // Convert quantity from recipe unit to store unit
            $quantityInStoreUnit = $this->convertQuantity(
                $remainingInRecipeUnit,
                $recipeUnit,
                $storeUnit
            );

            // Get available quantity from this batch
            $availableInBatch = (float)$storeEntry->remaining_quantity;
            $consumeFromBatch = min($quantityInStoreUnit, $availableInBatch);

            if ($consumeFromBatch > 0) {
                // Get cost per unit from this store batch
                $costPerUnit = (float)$storeEntry->cost_per_unit ?? 0;
                
                // Add to total cost
                $totalCost += $consumeFromBatch * $costPerUnit;
                
                // Convert consumed quantity back to recipe unit to update remaining
                $consumedInRecipeUnit = $this->convertQuantity(
                    $consumeFromBatch,
                    $storeUnit,
                    $recipeUnit
                );
                
                // Reduce remaining quantity
                $remainingInRecipeUnit -= $consumedInRecipeUnit;
            }
        }

        return round($totalCost, 2);
    }

    /**
     * Get the latest cost per unit for a material in a specific unit
     * Converts from base unit if necessary
     */
    private function getLatestCostPerUnit(int $materialId, int $unitId): ?float
    {
        // Get the unit details
        $unit = MeasurementUnit::find($unitId);
        if (!$unit) {
            return null;
        }

        // Get the latest GRN item for this material
        $grnItem = GrnItem::where('material_id', $materialId)
            ->latest('created_at')
            ->first();

        if (!$grnItem) {
            return null;
        }

        $grnUnitPrice = (float)$grnItem->unit_price;
        $grnUnit = $grnItem->unit;

        // If the recipe unit is the same as GRN unit, return the cost directly
        if ($grnUnit->id === $unit->id) {
            return $grnUnitPrice;
        }

        // Convert the cost per unit based on unit conversion
        return $this->convertCostPerUnit(
            $grnUnitPrice,
            $grnUnit,
            $unit
        );
    }

    /**
     * Convert cost per unit from one measurement unit to another
     * Example: If carrot costs Rs 10 per kg, and we need cost per gram
     * kg conversion_to_base = 1000, gram conversion_to_base = 1
     * Calculation: Rs 10 per 1000g = Rs 10/1000 = Rs 0.01 per gram
     */
    private function convertCostPerUnit(
        float $sourcePrice,
        MeasurementUnit $sourceUnit,
        MeasurementUnit $targetUnit
    ): float {
        // If units are the same, return price as is
        if ($sourceUnit->id === $targetUnit->id) {
            return $sourcePrice;
        }

        $sourceToBase = (float)$sourceUnit->conversion_to_base;
        $targetToBase = (float)$targetUnit->conversion_to_base;

        // CORRECT FORMULA:
        // If sourcePrice is per (sourceToBase) base units
        // We want price per (targetToBase) base units
        
        // Price per base unit = sourcePrice / sourceToBase
        // Price per target unit = (price per base unit) × targetToBase
        //                       = (sourcePrice / sourceToBase) × targetToBase
        
        $pricePerTargetUnit = ($sourcePrice / $sourceToBase) * $targetToBase;

        return $pricePerTargetUnit;
    }

    /**
     * Deduct materials from store based on recipe
     * Handles FIFO (First In First Out) consumption
     */
    public function deductMaterialsFromStore(SalesItem $salesItem): bool
    {
        $menuItem = $salesItem->menuItem;
        if (!$menuItem) {
            return false;
        }

        $recipe = $menuItem->currentRecipe ?? $menuItem->recipes()->latest()->first();
        if (!$recipe) {
            return false;
        }

        DB::beginTransaction();
        try {
            foreach ($recipe->items as $recipeItem) {
                $quantityNeeded = (float)$recipeItem->quantity * (float)$salesItem->quantity;
                
                // Deduct from store using FIFO
                $this->deductFromStore(
                    $recipeItem->material_id,
                    $quantityNeeded,
                    $recipeItem->unit_id,
                    'SalesItem',
                    $salesItem->id,
                    $recipeItem
                );
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deducting materials: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Deduct a specific quantity of material from store
     * Uses FIFO approach: deducts from oldest batches first
     */
    private function deductFromStore(
        int $materialId,
        float $quantityToDeduct,
        int $recipeUnitId,
        string $referenceType,
        int $referenceId,
        RecipeItem $recipeItem
    ): void {
        $remainingInRecipeUnit = $quantityToDeduct;

        // Get store entries in FIFO order (oldest first)
        $storeEntries = Store::where('material_id', $materialId)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('transferred_at')
            ->orderBy('created_at')
            ->get();

        $recipeUnit = MeasurementUnit::find($recipeUnitId);
        if (!$recipeUnit) {
            return;
        }

        foreach ($storeEntries as $storeEntry) {
            if ($remainingInRecipeUnit <= 0) {
                break;
            }

            // Get the store unit
            $storeUnit = MeasurementUnit::where('unit_symbol', $storeEntry->unit)->first();
            if (!$storeUnit) {
                continue;
            }

            // Convert quantity from recipe unit to store unit
            $quantityInStoreUnit = $this->convertQuantity(
                $remainingInRecipeUnit,
                $recipeUnit,
                $storeUnit
            );

            // Determine how much to deduct from this batch
            $deductQuantity = min($quantityInStoreUnit, (float)$storeEntry->remaining_quantity);

            if ($deductQuantity > 0) {
                // Update store entry
                $storeEntry->remaining_quantity -= $deductQuantity;
                $storeEntry->save();

                // Calculate cost for consumption record
                $costPerUnit = (float)$storeEntry->cost_per_unit;
                $totalCost = $deductQuantity * $costPerUnit;

                // Create consumption record
                StoreConsumption::create([
                    'store_batch_id' => $storeEntry->id,
                    'material_id' => $materialId,
                    'store_id' => $storeEntry->store_id,
                    'store_name' => $storeEntry->store_name,
                    'quantity_consumed' => $deductQuantity,
                    'unit' => $storeEntry->unit,
                    'cost_per_unit' => $costPerUnit,
                    'total_cost' => $totalCost,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'notes' => 'Consumed for ' . $recipeItem->recipe->menuItem->name,
                    'consumed_at' => now(),
                ]);

                // Convert consumed quantity back to recipe unit to update remaining
                $consumedInRecipeUnit = $this->convertQuantity(
                    $deductQuantity,
                    $storeUnit,
                    $recipeUnit
                );
                
                // Update remaining quantity
                $remainingInRecipeUnit -= $consumedInRecipeUnit;
            }
        }
    }

    /**
     * Convert quantity from one measurement unit to another
     */
    private function convertQuantity(
        float $quantity,
        MeasurementUnit $sourceUnit,
        MeasurementUnit $targetUnit
    ): float {
        if ($sourceUnit->id === $targetUnit->id) {
            return $quantity;
        }

        // Convert to base unit first
        $sourceToBase = (float)$sourceUnit->conversion_to_base;
        $targetToBase = (float)$targetUnit->conversion_to_base;

        // quantity in sourceUnit = quantity * sourceToBase (in base units)
        // quantity in targetUnit = (quantity * sourceToBase) / targetToBase

        return ($quantity * $sourceToBase) / $targetToBase;
    }
}
