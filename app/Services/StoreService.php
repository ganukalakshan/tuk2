<?php

namespace App\Services;

use App\Models\Store;
use App\Models\Material;

class StoreService {
    /**
     * Add material to central store
     * 
     * @param string $storeName The store name (hot_kitchen, beverage, pastry, bakery)
     * @param string $materialName The name of the material
     * @param float $quantity The quantity to add
     * @param string $unit The unit of measurement
     * @param int|null $materialId The material ID
     * @param int|null $grnId The GRN ID (if from GRN)
     * @return Store
     */
    public static function addMaterialToStore(
        string $storeName,
        string $materialName,
        float $quantity,
        string $unit,
        ?int $materialId = null,
        ?int $grnId = null
    ): Store {
        $storeId = Store::getStoreId($storeName);

        // Generate unique batch number for this material/store combination
        $latestBatchNumber = Store::where('material_id', $materialId)
            ->where('store_id', $storeId)
            ->whereNotNull('batch_number')
            ->orderByRaw('CAST(SUBSTRING(batch_number, 6) AS UNSIGNED) DESC')
            ->value('batch_number');
        
        $nextBatchNum = 1;
        if ($latestBatchNumber && preg_match('/batch(\d+)/', $latestBatchNumber, $matches)) {
            $nextBatchNum = intval($matches[1]) + 1;
        }
        $batchNumber = 'batch' . str_pad($nextBatchNum, 3, '0', STR_PAD_LEFT);

        // Create record in stores table
        $storeRecord = Store::create([
            'material_name' => $materialName,
            'original_quantity' => $quantity,
            'remaining_quantity' => $quantity,
            'unit' => $unit,
            'store_name' => $storeName,
            'store_id' => $storeId,
            'material_id' => $materialId,
            'grn_id' => $grnId,
            'batch_number' => $batchNumber,
            'transferred_at' => now(),
        ]);

        return $storeRecord;
    }

    /**
     * Get all materials in a specific store
     */
    public static function getStoreMaterials(string $storeName)
    {
        return Store::where('store_name', $storeName)
            ->where('quantity', '>', 0)
            ->with(['material', 'grn'])
            ->get();
    }

    /**
     * Get all materials in a specific store by ID
     */
    public static function getStoreMaterialsById(int $storeId)
    {
        return Store::where('store_id', $storeId)
            ->where('quantity', '>', 0)
            ->with(['material', 'grn'])
            ->get();
    }

    /**
     * Get all materials across all stores
     */
    public static function getAllStoreMaterials()
    {
        return Store::where('quantity', '>', 0)
            ->with(['material', 'grn'])
            ->orderBy('store_id')
            ->orderBy('material_name')
            ->get();
    }

    /**
     * Get store summary by store name
     */
    public static function getStoreSummary(string $storeName)
    {
        return Store::where('store_name', $storeName)
            ->selectRaw('store_name, store_id, COUNT(*) as total_items, SUM(quantity) as total_quantity')
            ->groupBy('store_name', 'store_id')
            ->first();
    }

    /**
     * Get store summary by store ID
     */
    public static function getStoreSummaryById(int $storeId)
    {
        return Store::where('store_id', $storeId)
            ->selectRaw('store_name, store_id, COUNT(*) as total_items, SUM(quantity) as total_quantity')
            ->groupBy('store_name', 'store_id')
            ->first();
    }

    /**
     * Get all store summaries
     */
    public static function getAllStoreSummaries()
    {
        return Store::selectRaw('store_name, store_id, COUNT(*) as total_items, SUM(quantity) as total_quantity')
            ->groupBy('store_name', 'store_id')
            ->orderBy('store_id')
            ->get();
    }

    /**
     * Update material quantity in store
     */
    public static function updateMaterialQuantity(
        int $storeRecordId,
        float $newQuantity
    ): Store {
        $storeRecord = Store::findOrFail($storeRecordId);
        $storeRecord->update(['quantity' => $newQuantity]);
        return $storeRecord;
    }

    /**
     * Remove material from store
     */
    public static function removeMaterialFromStore(int $storeRecordId): bool
    {
        $storeRecord = Store::findOrFail($storeRecordId);
        return $storeRecord->delete();
    }
   /**
     * Check if store has enough raw materials for requirements
     * @param array $requirements [['material_id' => int, 'required_quantity' => float]]
     * @return array ['material_id' => int, 'enough' => bool, 'available' => float, 'required' => float]
     */
    
    public static function checkRawMaterialAvailability(array $requirements, $storeId = null)
    {
        $results = [];
        foreach ($requirements as $req) {
            $query = Store::where('material_id', $req['material_id']);
            if ($storeId) {
                $query->where('store_id', $storeId);
            }
            $available = $query->sum('remaining_quantity');
            $results[] = [
                'material_id' => $req['material_id'],
                'enough' => $available >= $req['required_quantity'],
                'available' => $available,
                'required' => $req['required_quantity'],
            ];
        }
        return $results;
    }
}
