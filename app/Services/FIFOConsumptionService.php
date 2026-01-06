<?php

namespace App\Services;

use App\Models\Store;
use App\Models\StoreConsumption;
use App\Models\Material;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FIFOConsumptionService
{
    /**
     * Consume material from store using FIFO (First In, First Out)
     * 
     * @param int $materialId
     * @param int $storeId Store ID (1=kitchen, 2=bakery, 3=pastry, 4=beverage)
     * @param float $quantityNeeded
     * @param string|null $referenceType Optional reference (e.g., 'sale', 'recipe', 'wastage')
     * @param int|null $referenceId Optional reference ID
     * @param string|null $notes Optional notes
     * @return array ['success' => bool, 'consumptions' => array, 'message' => string]
     * @throws \Exception
     */
    public function consume(
        int $materialId,
        int $storeId,
        float $quantityNeeded,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null
    ): array {
        // Input validation
        if ($quantityNeeded <= 0) {
            return [
                'success' => false,
                'consumptions' => [],
                'message' => 'Quantity must be greater than 0'
            ];
        }

        $consumptions = [];
        $retryCount = 0;
        $maxRetries = 3;

        while ($retryCount < $maxRetries) {
            try {
                return DB::transaction(function () use (
                    $materialId,
                    $storeId,
                    $quantityNeeded,
                    $referenceType,
                    $referenceId,
                    $notes,
                    &$consumptions
                ) {
                    // Get material details
                    $material = Material::find($materialId);
                    if (!$material) {
                        return [
                            'success' => false,
                            'consumptions' => [],
                            'message' => 'Material not found'
                        ];
                    }

                    $storeName = Store::getStoreName($storeId);

                    // Check total available quantity first (fast fail)
                    $totalAvailable = Store::where('material_id', $materialId)
                        ->where('store_id', $storeId)
                        ->where('remaining_quantity', '>', 0)
                        ->sum('remaining_quantity');

                    if ($totalAvailable < $quantityNeeded) {
                        return [
                            'success' => false,
                            'consumptions' => [],
                            'message' => "Insufficient quantity. Available: {$totalAvailable}, Needed: {$quantityNeeded}",
                            'available' => $totalAvailable,
                            'needed' => $quantityNeeded
                        ];
                    }

                    // Get batches ordered by transferred_at (FIFO) with row locks
                    $batches = Store::where('material_id', $materialId)
                        ->where('store_id', $storeId)
                        ->where('remaining_quantity', '>', 0)
                        ->orderBy('transferred_at', 'asc')
                        ->orderBy('id', 'asc') // Secondary sort for same timestamp
                        ->lockForUpdate() // Critical: lock rows to prevent race conditions
                        ->get();

                    $remainingNeeded = $quantityNeeded;

                    foreach ($batches as $batch) {
                        if ($remainingNeeded <= 0) {
                            break;
                        }

                        // Calculate how much to take from this batch
                        $takeFromBatch = min($batch->remaining_quantity, $remainingNeeded);

                        // Update batch remaining quantity
                        $batch->remaining_quantity -= $takeFromBatch;
                        $batch->save();

                        // Calculate cost if available
                        $costPerUnit = $batch->cost_per_unit;
                        $totalCost = $costPerUnit ? ($takeFromBatch * $costPerUnit) : null;

                        // Record the consumption
                        $consumption = StoreConsumption::create([
                            'store_batch_id' => $batch->id,
                            'material_id' => $materialId,
                            'store_id' => $storeId,
                            'store_name' => $storeName,
                            'quantity_consumed' => $takeFromBatch,
                            'unit' => $batch->unit,
                            'cost_per_unit' => $costPerUnit,
                            'total_cost' => $totalCost,
                            'reference_type' => $referenceType,
                            'reference_id' => $referenceId,
                            'notes' => $notes,
                            'consumed_at' => now(),
                        ]);

                        $consumptions[] = [
                            'batch_id' => $batch->id,
                            'batch_number' => $batch->batch_number,
                            'quantity' => $takeFromBatch,
                            'unit' => $batch->unit,
                            'cost' => $totalCost,
                            'transferred_at' => $batch->transferred_at,
                        ];

                        $remainingNeeded -= $takeFromBatch;
                    }

                    // Final verification
                    if ($remainingNeeded > 0.001) { // Allow small floating point errors
                        throw new \Exception("Failed to consume full quantity. Remaining: {$remainingNeeded}");
                    }

                    Log::info('FIFO consumption completed', [
                        'material_id' => $materialId,
                        'store_id' => $storeId,
                        'quantity' => $quantityNeeded,
                        'batches_used' => count($consumptions),
                        'reference' => $referenceType . ':' . $referenceId
                    ]);

                    return [
                        'success' => true,
                        'consumptions' => $consumptions,
                        'message' => 'Material consumed successfully using FIFO',
                        'total_consumed' => $quantityNeeded,
                        'batches_used' => count($consumptions)
                    ];
                });

            } catch (\Illuminate\Database\QueryException $e) {
                // Handle deadlock - retry with exponential backoff
                if ($e->getCode() == '40001' || strpos($e->getMessage(), 'Deadlock') !== false) {
                    $retryCount++;
                    if ($retryCount >= $maxRetries) {
                        throw $e;
                    }
                    usleep(100000 * pow(2, $retryCount)); // 100ms, 200ms, 400ms
                    continue;
                }
                throw $e;
            }
        }

        return [
            'success' => false,
            'consumptions' => [],
            'message' => 'Failed after maximum retries'
        ];
    }

    /**
     * Get available quantity for a material in a store
     * 
     * @param int $materialId
     * @param int $storeId
     * @return float
     */
    public function getAvailableQuantity(int $materialId, int $storeId): float
    {
        return Store::where('material_id', $materialId)
            ->where('store_id', $storeId)
            ->where('remaining_quantity', '>', 0)
            ->sum('remaining_quantity');
    }

    /**
     * Get batch details for a material in a store
     * 
     * @param int $materialId
     * @param int $storeId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getBatches(int $materialId, int $storeId)
    {
        return Store::where('material_id', $materialId)
            ->where('store_id', $storeId)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('transferred_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    /**
     * Preview which batches will be consumed (without actually consuming)
     * 
     * @param int $materialId
     * @param int $storeId
     * @param float $quantityNeeded
     * @return array
     */
    public function previewConsumption(int $materialId, int $storeId, float $quantityNeeded): array
    {
        $batches = $this->getBatches($materialId, $storeId);
        $preview = [];
        $remainingNeeded = $quantityNeeded;
        $totalCost = 0;

        foreach ($batches as $batch) {
            if ($remainingNeeded <= 0) {
                break;
            }

            $takeFromBatch = min($batch->remaining_quantity, $remainingNeeded);
            $batchCost = $batch->cost_per_unit ? ($takeFromBatch * $batch->cost_per_unit) : 0;

            $preview[] = [
                'batch_id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'transferred_at' => $batch->transferred_at,
                'available_in_batch' => $batch->remaining_quantity,
                'will_consume' => $takeFromBatch,
                'unit' => $batch->unit,
                'cost_per_unit' => $batch->cost_per_unit,
                'batch_cost' => $batchCost,
                'expiry_date' => $batch->expiry_date,
            ];

            $totalCost += $batchCost;
            $remainingNeeded -= $takeFromBatch;
        }

        return [
            'batches' => $preview,
            'total_cost' => $totalCost,
            'can_fulfill' => $remainingNeeded <= 0,
            'shortage' => max(0, $remainingNeeded)
        ];
    }

    /**
     * Get consumption history for a material in a store
     * 
     * @param int $materialId
     * @param int $storeId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getConsumptionHistory(int $materialId, int $storeId, int $limit = 50)
    {
        return StoreConsumption::where('material_id', $materialId)
            ->where('store_id', $storeId)
            ->with('storeBatch')
            ->orderBy('consumed_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
