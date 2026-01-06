# FIFO Consumption - Quick Reference

## What Changed

### ✅ `stores` Table
- `quantity` → renamed to `original_quantity` (immutable)
- **NEW:** `remaining_quantity` (mutable, decreases when consumed)
- **NEW:** `transferred_at` (timestamp, used for FIFO ordering)
- **NEW:** `batch_number`, `expiry_date`, `cost_per_unit`

### ✅ `store_consumptions` Table (New)
Tracks every consumption with batch traceability

## Core Concept

**Each transfer = One batch**
```
Transfer 100kg flour → Store batch with:
  - original_quantity: 100
  - remaining_quantity: 100
  - transferred_at: 2026-01-01 08:00
```

**Consumption uses oldest first**
```
Consume 50kg → System finds batches ordered by transferred_at ASC
               → Takes from oldest batch first
               → Records which batches were used
```

## API Quick Reference

### Consume (FIFO)
```bash
POST /api/store-consumption/consume
{
  "material_id": 5,
  "store_id": 1,
  "quantity": 50,
  "reference_type": "sale",
  "reference_id": 123
}
```

### Preview (No actual consumption)
```bash
POST /api/store-consumption/preview
{
  "material_id": 5,
  "store_id": 1,
  "quantity": 50
}
```

### Check Available
```bash
GET /api/store-consumption/available/{materialId}/{storeId}
```

### View Batches
```bash
GET /api/store-consumption/batches/{materialId}/{storeId}
```

### History
```bash
GET /api/store-consumption/history/{materialId}/{storeId}
```

## Code Usage

```php
use App\Services\FIFOConsumptionService;

$fifo = new FIFOConsumptionService();

// Consume
$result = $fifo->consume(5, 1, 50, 'sale', 123);

// Preview
$preview = $fifo->previewConsumption(5, 1, 50);

// Check availability
$qty = $fifo->getAvailableQuantity(5, 1);
```

## Safety Features

✓ **Database locks** - Prevents double consumption  
✓ **Transactions** - All-or-nothing updates  
✓ **Deadlock retry** - Auto-retry with backoff  
✓ **Validation** - Checks availability before consuming

## Benefits

1. **Expiry management** - Use oldest materials first
2. **Accurate COGS** - Track exact batch costs
3. **Full audit** - Know which batches were used
4. **Concurrent-safe** - Multiple users OK
5. **Transparent** - Preview before consuming

## Migration Notes

✅ Migrations run automatically  
✅ Existing records: `remaining_quantity` = `original_quantity`  
✅ Existing records: `transferred_at` = `created_at`

## Store IDs
```
1 = Kitchen
2 = Bakery
3 = Pastry
4 = Beverage
```

## Files Created/Modified

- ✅ Migration: `add_batch_fields_to_stores_table.php`
- ✅ Migration: `create_store_consumptions_table.php`
- ✅ Model: `Store.php` (updated)
- ✅ Model: `StoreConsumption.php` (new)
- ✅ Service: `FIFOConsumptionService.php` (new)
- ✅ Controller: `StoreConsumptionController.php` (new)
- ✅ Routes: Added consumption endpoints

## Testing

```bash
# View available batches
curl http://localhost/api/store-consumption/batches/5/1

# Preview consumption
curl -X POST http://localhost/api/store-consumption/preview \
  -H "Content-Type: application/json" \
  -d '{"material_id":5, "store_id":1, "quantity":50}'

# Consume material
curl -X POST http://localhost/api/store-consumption/consume \
  -H "Content-Type: application/json" \
  -d '{"material_id":5, "store_id":1, "quantity":50}'
```

## Important!

- Transfers now save both `original_quantity` AND `remaining_quantity`
- `remaining_quantity` decreases when consumed
- Always use `/store-consumption/consume` endpoint for FIFO consumption
- Preview endpoint shows exact batches that will be used
- All consumption is logged in `store_consumptions` table
