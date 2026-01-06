# FIFO Store Consumption System

## Overview

The Coffee Shop system now implements **FIFO (First In, First Out)** consumption for all store materials. This means that when materials are used from any store (Kitchen, Bakery, Pastry, or Beverage), the **earliest transferred batches are consumed first**.

## Key Concepts

### Batches
Each transfer to a store creates a **batch** - a distinct record with:
- Original quantity (immutable audit data)
- Remaining quantity (decreases as material is consumed)
- Transfer timestamp (used for FIFO ordering)
- Optional: batch number, expiry date, cost per unit

### FIFO Consumption
When you consume 100kg of flour from Kitchen Store:
1. System finds all available batches for that material in that store
2. Orders batches by `transferred_at` (oldest first)
3. Consumes from oldest batch first
4. If oldest batch doesn't have enough, moves to next oldest
5. Continues until full quantity is consumed
6. Records which batches were used for audit trail

## Database Schema

### `stores` Table (Modified)
```sql
- id
- material_id
- material_name
- original_quantity       -- Initial quantity when transferred
- remaining_quantity      -- Current available quantity (mutable)
- unit
- store_id                -- 1=Kitchen, 2=Bakery, 3=Pastry, 4=Beverage
- store_name
- grn_id
- transferred_at          -- Critical for FIFO ordering
- batch_number            -- Optional batch identifier
- expiry_date             -- Optional expiry tracking
- cost_per_unit           -- Optional for FIFO costing
- created_at
- updated_at
```

**Indexes:**
- `(material_id, store_id, remaining_quantity)` - Find available batches
- `(material_id, store_id, transferred_at)` - FIFO ordering

### `store_consumptions` Table (New)
Tracks every consumption for audit trail and COGS:
```sql
- id
- store_batch_id          -- Which batch was consumed from
- material_id
- store_id
- store_name
- quantity_consumed
- unit
- cost_per_unit           -- Cost from batch
- total_cost              -- Quantity × cost_per_unit
- reference_type          -- e.g., 'sale', 'recipe', 'wastage'
- reference_id            -- ID of the sale/recipe/etc
- notes
- consumed_at
- created_at
- updated_at
```

## API Endpoints

### 1. Consume Material (FIFO)
```http
POST /api/store-consumption/consume
Content-Type: application/json

{
  "material_id": 5,
  "store_id": 1,
  "quantity": 50,
  "reference_type": "sale",
  "reference_id": 123,
  "notes": "Used for order #123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Material consumed successfully using FIFO",
  "total_consumed": 50,
  "batches_used": 2,
  "consumptions": [
    {
      "batch_id": 15,
      "batch_number": "TR-ST-20260101-0001",
      "quantity": 30,
      "unit": "kg",
      "cost": 150.00,
      "transferred_at": "2026-01-01T08:00:00Z"
    },
    {
      "batch_id": 18,
      "batch_number": "TR-ST-20260101-0005",
      "quantity": 20,
      "unit": "kg",
      "cost": 100.00,
      "transferred_at": "2026-01-01T10:00:00Z"
    }
  ]
}
```

### 2. Preview Consumption
See which batches will be used WITHOUT actually consuming:
```http
POST /api/store-consumption/preview
Content-Type: application/json

{
  "material_id": 5,
  "store_id": 1,
  "quantity": 50
}
```

**Response:**
```json
{
  "batches": [
    {
      "batch_id": 15,
      "batch_number": "TR-ST-20260101-0001",
      "transferred_at": "2026-01-01T08:00:00Z",
      "available_in_batch": 30,
      "will_consume": 30,
      "unit": "kg",
      "cost_per_unit": 5.00,
      "batch_cost": 150.00,
      "expiry_date": null
    },
    {
      "batch_id": 18,
      "batch_number": "TR-ST-20260101-0005",
      "transferred_at": "2026-01-01T10:00:00Z",
      "available_in_batch": 45,
      "will_consume": 20,
      "unit": "kg",
      "cost_per_unit": 5.00,
      "batch_cost": 100.00,
      "expiry_date": null
    }
  ],
  "total_cost": 250.00,
  "can_fulfill": true,
  "shortage": 0
}
```

### 3. Get Available Quantity
```http
GET /api/store-consumption/available/{materialId}/{storeId}
```

**Response:**
```json
{
  "material_id": 5,
  "store_id": 1,
  "available_quantity": 125.50
}
```

### 4. Get Batches
```http
GET /api/store-consumption/batches/{materialId}/{storeId}
```

**Response:**
```json
{
  "material_id": 5,
  "store_id": 1,
  "total_available": 125.50,
  "batches": [
    {
      "id": 15,
      "material_name": "Flour",
      "original_quantity": 50.00,
      "remaining_quantity": 30.00,
      "transferred_at": "2026-01-01T08:00:00Z",
      "batch_number": "TR-ST-20260101-0001",
      "expiry_date": null,
      "cost_per_unit": 5.00
    },
    ...
  ]
}
```

### 5. Get Consumption History
```http
GET /api/store-consumption/history/{materialId}/{storeId}?limit=50
```

**Response:**
```json
{
  "material_id": 5,
  "store_id": 1,
  "history": [
    {
      "id": 45,
      "quantity_consumed": 20.00,
      "consumed_at": "2026-01-01T15:30:00Z",
      "reference_type": "sale",
      "reference_id": 123,
      "cost_per_unit": 5.00,
      "total_cost": 100.00,
      "store_batch": {
        "id": 18,
        "batch_number": "TR-ST-20260101-0005",
        "transferred_at": "2026-01-01T10:00:00Z"
      }
    },
    ...
  ]
}
```

## Usage Examples

### PHP/Laravel Code

```php
use App\Services\FIFOConsumptionService;

$fifoService = new FIFOConsumptionService();

// Consume material
$result = $fifoService->consume(
    materialId: 5,
    storeId: 1,  // Kitchen
    quantityNeeded: 50,
    referenceType: 'sale',
    referenceId: 123,
    notes: 'Used for customer order'
);

if ($result['success']) {
    echo "Consumed {$result['total_consumed']} from {$result['batches_used']} batches";
} else {
    echo "Error: {$result['message']}";
}

// Check availability
$available = $fifoService->getAvailableQuantity(5, 1);
echo "Available: $available kg";

// Preview consumption
$preview = $fifoService->previewConsumption(5, 1, 50);
if ($preview['can_fulfill']) {
    echo "Can fulfill. Will cost: {$preview['total_cost']}";
} else {
    echo "Shortage: {$preview['shortage']}";
}
```

### JavaScript/Frontend

```javascript
// Consume material
async function consumeMaterial(materialId, storeId, quantity) {
  const response = await fetch('/api/store-consumption/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      material_id: materialId,
      store_id: storeId,
      quantity: quantity,
      reference_type: 'sale',
      reference_id: 123
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Consumed:', result);
    showBatchesUsed(result.consumptions);
  } else {
    alert('Error: ' + result.message);
  }
}

// Preview before consuming
async function previewConsumption(materialId, storeId, quantity) {
  const response = await fetch('/api/store-consumption/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      material_id: materialId,
      store_id: storeId,
      quantity: quantity
    })
  });
  
  const preview = await response.json();
  
  if (preview.can_fulfill) {
    console.log('Batches to use:', preview.batches);
    console.log('Total cost:', preview.total_cost);
  } else {
    console.log('Shortage:', preview.shortage);
  }
}

// Check availability
async function checkAvailability(materialId, storeId) {
  const response = await fetch(
    `/api/store-consumption/available/${materialId}/${storeId}`
  );
  const data = await response.json();
  console.log('Available:', data.available_quantity);
}
```

## Concurrency & Safety

### Transaction Locking
The system uses **database row-level locking** (`SELECT ... FOR UPDATE`) to prevent race conditions:

```php
// Inside transaction
$batches = Store::where('material_id', $materialId)
    ->where('store_id', $storeId)
    ->where('remaining_quantity', '>', 0)
    ->orderBy('transferred_at', 'asc')
    ->lockForUpdate()  // ← Prevents concurrent access
    ->get();
```

### Deadlock Handling
Automatic retry with exponential backoff:
- Attempt 1: immediate
- Attempt 2: wait 100ms
- Attempt 3: wait 200ms
- Attempt 4: wait 400ms

### Atomic Operations
All consumption operations happen in a single database transaction:
1. Lock batches
2. Update remaining quantities
3. Record consumptions
4. Commit (or rollback on error)

## Migration & Backfill

If you have existing data in the `stores` table:

```php
// Run this once to backfill existing records
DB::table('stores')->update([
    'remaining_quantity' => DB::raw('quantity'),
    'transferred_at' => DB::raw('created_at')
]);

// Then rename column (done by migration)
Schema::table('stores', function ($table) {
    $table->renameColumn('quantity', 'original_quantity');
});
```

## Benefits

✅ **Accurate COGS** - Track exact cost of materials used  
✅ **Expiry Management** - Use oldest batches first (reduce waste)  
✅ **Audit Trail** - Know exactly which batches were consumed for each transaction  
✅ **Concurrent Safe** - Multiple users can consume simultaneously without errors  
✅ **Transparent** - Preview shows exactly what will be used  
✅ **Flexible** - Support for reference types (sales, recipes, wastage, etc.)

## Testing

Run the test suite:
```bash
php artisan test --filter=FIFOConsumption
```

## Store IDs Reference

```
1 = Kitchen Store
2 = Bakery Store
3 = Pastry Store
4 = Beverage Store
```

## Support

For issues or questions:
1. Check consumption history: `GET /api/store-consumption/history/{materialId}/{storeId}`
2. Review batch details: `GET /api/store-consumption/batches/{materialId}/{storeId}`
3. Check logs: `storage/logs/laravel.log` (search for "FIFO consumption")
