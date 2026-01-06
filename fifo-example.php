<?php

/**
 * FIFO Consumption Example Script
 * 
 * This demonstrates how FIFO consumption works
 */

use App\Services\FIFOConsumptionService;
use App\Models\Store;
use App\Models\Material;

echo "=== FIFO Consumption Example ===\n\n";

// Initialize service
$fifoService = new FIFOConsumptionService();

// Example: Material ID 5 (Flour) in Kitchen Store (Store ID 1)
$materialId = 5;
$storeId = 1; // Kitchen

echo "1. Checking available quantity...\n";
$available = $fifoService->getAvailableQuantity($materialId, $storeId);
echo "   Available: {$available} units\n\n";

echo "2. Getting batch details...\n";
$batches = $fifoService->getBatches($materialId, $storeId);
echo "   Total batches: " . $batches->count() . "\n";
foreach ($batches as $batch) {
    echo "   - Batch #{$batch->id}: {$batch->remaining_quantity} units (transferred: {$batch->transferred_at})\n";
}
echo "\n";

echo "3. Previewing consumption of 50 units...\n";
$preview = $fifoService->previewConsumption($materialId, $storeId, 50);
if ($preview['can_fulfill']) {
    echo "   ✅ Can fulfill! Will use {$preview['batches']->count()} batches\n";
    foreach ($preview['batches'] as $batch) {
        echo "   - Will take {$batch['will_consume']} from batch #{$batch['batch_id']} " .
             "(transferred: {$batch['transferred_at']})\n";
    }
    echo "   Total cost: \${$preview['total_cost']}\n";
} else {
    echo "   ❌ Cannot fulfill. Shortage: {$preview['shortage']} units\n";
}
echo "\n";

echo "4. Actually consuming 50 units...\n";
$result = $fifoService->consume(
    $materialId,
    $storeId,
    50,
    'example',
    null,
    'Testing FIFO consumption'
);

if ($result['success']) {
    echo "   ✅ Success!\n";
    echo "   Total consumed: {$result['total_consumed']}\n";
    echo "   Batches used: {$result['batches_used']}\n";
    foreach ($result['consumptions'] as $consumption) {
        echo "   - Used {$consumption['quantity']} from batch #{$consumption['batch_id']}\n";
    }
} else {
    echo "   ❌ Failed: {$result['message']}\n";
}
echo "\n";

echo "5. Checking consumption history...\n";
$history = $fifoService->getConsumptionHistory($materialId, $storeId, 5);
echo "   Recent consumptions: " . $history->count() . "\n";
foreach ($history as $consumption) {
    echo "   - {$consumption->quantity_consumed} units consumed at {$consumption->consumed_at} " .
         "(from batch #{$consumption->store_batch_id})\n";
}
echo "\n";

echo "=== How FIFO Works ===\n\n";
echo "FIFO (First In, First Out) means:\n";
echo "1. When material is transferred to store, it's saved with 'transferred_at' timestamp\n";
echo "2. Each transfer becomes a 'batch' with original_quantity and remaining_quantity\n";
echo "3. When consuming, system finds all batches with remaining_quantity > 0\n";
echo "4. Orders batches by transferred_at ASC (oldest first)\n";
echo "5. Consumes from oldest batch first\n";
echo "6. If oldest batch doesn't have enough, moves to next oldest\n";
echo "7. Records which batches were used in store_consumptions table\n";
echo "8. Uses database locks (SELECT ... FOR UPDATE) to prevent race conditions\n\n";

echo "=== Benefits ===\n\n";
echo "✓ Use oldest materials first (reduce expiry waste)\n";
echo "✓ Accurate FIFO costing (COGS = sum of batch costs)\n";
echo "✓ Full audit trail (know exactly which batches were used)\n";
echo "✓ Concurrent-safe (multiple users can consume simultaneously)\n";
echo "✓ Transparent (preview shows what will be used before consuming)\n";
