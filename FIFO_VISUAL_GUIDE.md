# FIFO Consumption Flow - Visual Guide

## 📦 Batch Creation (Transfer)

```
┌─────────────────────────────────────────────────────────────┐
│  GRN STORE                                                  │
│  Material: Flour (500kg)                                    │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Transfer 100kg to Kitchen
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  KITCHEN STORE (stores table)                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Batch #1                                              │  │
│  │ material_id: 5 (Flour)                                │  │
│  │ original_quantity: 100                                │  │
│  │ remaining_quantity: 100                               │  │
│  │ transferred_at: 2026-01-01 08:00:00                   │  │
│  │ batch_number: TR-ST-20260101-0001                     │  │
│  │ cost_per_unit: 5.00                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Multiple Batches Over Time

```
┌─────────────────────────────────────────────────────────────┐
│  KITCHEN STORE - Flour Batches                              │
│                                                             │
│  ┌────────────────────────────────────┐                     │
│  │ Batch #15 (Oldest)                 │                     │
│  │ transferred_at: 08:00              │                     │
│  │ original: 100kg                    │                     │
│  │ remaining: 100kg                   │  ← Will use FIRST   │
│  └────────────────────────────────────┘                     │
│                                                             │
│  ┌────────────────────────────────────┐                     │
│  │ Batch #18                          │                     │
│  │ transferred_at: 10:00              │                     │
│  │ original: 80kg                     │                     │
│  │ remaining: 80kg                    │  ← Will use SECOND  │
│  └────────────────────────────────────┘                     │
│                                                             │
│  ┌────────────────────────────────────┐                     │
│  │ Batch #22 (Newest)                 │                     │
│  │ transferred_at: 14:00              │                     │
│  │ original: 50kg                     │                     │
│  │ remaining: 50kg                    │  ← Will use LAST    │
│  └────────────────────────────────────┘                     │
│                                                             │
│  Total Available: 230kg                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 FIFO Consumption Process

### Request: Consume 150kg Flour from Kitchen

```
Step 1: Lock & Order Batches
┌──────────────────────────────────────────────────────────────┐
│ SELECT * FROM stores                                         │
│ WHERE material_id = 5 AND store_id = 1                       │
│   AND remaining_quantity > 0                                 │
│ ORDER BY transferred_at ASC                                  │
│ FOR UPDATE  ← Locks rows to prevent concurrent conflicts    │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Batch #15 (08:00) - 100kg available                          │
│ Batch #18 (10:00) - 80kg available                           │
│ Batch #22 (14:00) - 50kg available                           │
└──────────────────────────────────────────────────────────────┘
```

```
Step 2: Consume from Batch #15 (Oldest)
┌──────────────────────────────────────────────────────────────┐
│ Need: 150kg                                                  │
│ Batch #15 has: 100kg                                         │
│                                                              │
│ Action:                                                      │
│   - Take 100kg from Batch #15                                │
│   - Update: remaining_quantity = 0                           │
│   - Create consumption record:                               │
│     * quantity_consumed: 100kg                               │
│     * cost: 100kg × $5 = $500                                │
│                                                              │
│ Still need: 50kg                                             │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Batch #15                                                    │
│ remaining_quantity: 100 → 0  ✓ Fully consumed               │
└──────────────────────────────────────────────────────────────┘
```

```
Step 3: Consume from Batch #18 (Next Oldest)
┌──────────────────────────────────────────────────────────────┐
│ Need: 50kg (remaining)                                       │
│ Batch #18 has: 80kg                                          │
│                                                              │
│ Action:                                                      │
│   - Take 50kg from Batch #18                                 │
│   - Update: remaining_quantity = 30kg                        │
│   - Create consumption record:                               │
│     * quantity_consumed: 50kg                                │
│     * cost: 50kg × $5 = $250                                 │
│                                                              │
│ Still need: 0kg  ✓ Done!                                     │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│ Batch #18                                                    │
│ remaining_quantity: 80 → 30  ✓ Partially consumed           │
└──────────────────────────────────────────────────────────────┘
```

```
Step 4: Final State
┌──────────────────────────────────────────────────────────────┐
│  KITCHEN STORE - After Consumption                           │
│                                                              │
│  ✗ Batch #15: 0kg remaining (fully consumed)                │
│  ✓ Batch #18: 30kg remaining                                │
│  ✓ Batch #22: 50kg remaining                                │
│                                                              │
│  Total Available: 80kg (was 230kg)                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  STORE_CONSUMPTIONS - Audit Trail                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Consumption #1                                         │  │
│  │ store_batch_id: 15                                     │  │
│  │ quantity_consumed: 100kg                               │  │
│  │ cost: $500                                             │  │
│  │ consumed_at: 2026-01-01 16:00:00                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Consumption #2                                         │  │
│  │ store_batch_id: 18                                     │  │
│  │ quantity_consumed: 50kg                                │  │
│  │ cost: $250                                             │  │
│  │ consumed_at: 2026-01-01 16:00:00                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Total Cost (COGS): $750                                     │
└──────────────────────────────────────────────────────────────┘
```

## 🔒 Concurrency Protection

### Without Locking (WRONG)
```
User A                          User B
  │                               │
  ├─ Read Batch #15: 100kg        │
  │                               ├─ Read Batch #15: 100kg
  ├─ Consume 80kg                 │
  │                               ├─ Consume 50kg
  ├─ Update: remaining = 20kg     │
  │                               ├─ Update: remaining = 50kg
  │                               │
  └─ Result: ❌ WRONG!            └─ User B overwrites User A
     Only 50kg shown consumed        130kg actually consumed!
```

### With Locking (CORRECT)
```
User A                          User B
  │                               │
  ├─ Lock Batch #15               │
  ├─ Read: 100kg                  │
  ├─ Consume 80kg                 ├─ Tries to lock... WAITS
  ├─ Update: remaining = 20kg     │
  ├─ Commit & Unlock              │
  │                               ├─ Gets lock
  │                               ├─ Read: 20kg (updated)
  │                               ├─ Consume 20kg
  │                               ├─ Update: remaining = 0kg
  │                               ├─ Commit & Unlock
  │                               │
  └─ Result: ✓ CORRECT!           └─ Result: ✓ CORRECT!
     80kg from User A                20kg from User B
     Total: 100kg consumed           Both transactions safe
```

## 📊 API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Frontend/API Consumer)                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ POST /api/store-consumption/consume
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  StoreConsumptionController                                 │
│  - Validates request                                        │
│  - Calls FIFOConsumptionService                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  FIFOConsumptionService                                     │
│  1. Begin transaction                                       │
│  2. Check total availability                                │
│  3. Lock batches (SELECT ... FOR UPDATE)                    │
│  4. Iterate batches (oldest first)                          │
│  5. Update remaining_quantity                               │
│  6. Create consumption records                              │
│  7. Commit transaction                                      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE                                                   │
│  ┌────────────────┐          ┌──────────────────────────┐   │
│  │ stores         │          │ store_consumptions       │   │
│  │ - Update qty   │◀────────▶│ - Insert audit records  │   │
│  └────────────────┘          └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Response
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  {                                                          │
│    "success": true,                                         │
│    "total_consumed": 150,                                   │
│    "batches_used": 2,                                       │
│    "consumptions": [...]                                    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎬 Complete Example

```
SCENARIO: Coffee shop needs 150kg flour for daily baking

┌─────────────────────────────────────────────────────────────┐
│ 1. Check Available Quantity                                 │
│    GET /api/store-consumption/available/5/1                 │
│    Response: {"available_quantity": 230}  ✓ Enough!        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Preview Consumption (Optional)                           │
│    POST /api/store-consumption/preview                      │
│    Shows: Will use Batch #15 (100kg) + Batch #18 (50kg)    │
│           Total cost: $750                                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Consume Material                                         │
│    POST /api/store-consumption/consume                      │
│    {                                                        │
│      "material_id": 5,                                      │
│      "store_id": 1,                                         │
│      "quantity": 150,                                       │
│      "reference_type": "daily_baking",                      │
│      "reference_id": 2026010                                │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. System Actions (FIFO)                                    │
│    ✓ Locks oldest batches                                   │
│    ✓ Consumes 100kg from Batch #15 (08:00)                 │
│    ✓ Consumes 50kg from Batch #18 (10:00)                  │
│    ✓ Records 2 consumption entries                          │
│    ✓ Updates inventory                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Result                                                   │
│    ✓ 150kg consumed successfully                            │
│    ✓ COGS: $750 tracked automatically                       │
│    ✓ Audit trail: 2 consumption records                     │
│    ✓ Inventory updated: 230kg → 80kg                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Key Takeaways

1. **Each transfer = One batch** with timestamp
2. **FIFO = Oldest first** (by transferred_at)
3. **Locking prevents** race conditions
4. **Audit trail** in store_consumptions table
5. **Preview before** actual consumption
6. **Automatic COGS** calculation
7. **Concurrent-safe** for multiple users

## 📈 Benefits Visualization

```
Traditional System          →    FIFO Batch System
─────────────────────────────────────────────────────────
Single quantity field       →    original + remaining
No batch tracking          →    Full batch history
Manual COGS calculation    →    Automatic FIFO costing
No expiry management       →    Use oldest first
No audit trail             →    Complete traceability
Race conditions possible   →    Lock-protected
Unknown material age       →    Timestamp tracked
```
