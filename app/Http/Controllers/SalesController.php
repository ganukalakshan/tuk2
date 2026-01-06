<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\TableOrder;
use App\Models\Product;
use App\Models\MenuItem;
use App\Models\Store;
use App\Models\SalesMaterialConsumption;
use App\Models\FoodStoreRecord;
use App\Services\FIFOConsumptionService;
use App\Services\CostPriceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'table_id' => 'nullable|integer|min:1',
            'table_number' => 'nullable|integer|min:1',
            'order_type' => 'nullable|in:table,live_bill',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.is_kot' => 'boolean',
            'items.*.is_bot' => 'boolean',
            'items.*.item_status' => 'required|in:pending,kot,bot,both',
            'subtotal' => 'required|numeric|min:0',
            'service_charge' => 'nullable|numeric|min:0',
            'service_charge_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'cash_amount' => 'nullable|numeric|min:0',
            'card_amount' => 'nullable|numeric|min:0',
            'pickme_amount' => 'nullable|numeric|min:0',
            'uber_amount' => 'nullable|numeric|min:0',
            'additional_payment' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,card,pickme,uber,partial',
            'kitchen_note' => 'nullable|string',
            'status' => 'required|in:pending,order,kot,bot,completed',
        ]);

        DB::beginTransaction();
        try {
            // Generate order ID
            $orderId = Sale::generateOrderId();

            // Calculate balance - include all payment methods
            // For cash: can be negative (change to return)
            // For partial/other: should be zero or positive
            $totalPayments = ($validated['cash_amount'] ?? 0) + 
                           ($validated['card_amount'] ?? 0) + 
                           ($validated['pickme_amount'] ?? 0) + 
                           ($validated['uber_amount'] ?? 0) + 
                           ($validated['additional_payment'] ?? 0);
            
            // Balance calculation: negative = change to return, positive = amount owed
            $balance = $validated['total_amount'] - $totalPayments;

            // Create sale
            $sale = Sale::create([
                'order_id' => $orderId,
                'customer_id' => $validated['customer_id'],
                'user_id' => auth()->id(),
                'table_id' => $validated['table_id'] ?? null,
                'table_number' => $validated['table_number'],
                'status' => $validated['status'],
                'subtotal' => $validated['subtotal'],
                'service_charge' => $validated['service_charge'] ?? 0,
                'service_charge_amount' => $validated['service_charge_amount'] ?? 0,
                'total_amount' => $validated['total_amount'],
                'cash_amount' => $validated['cash_amount'] ?? 0,
                'card_amount' => $validated['card_amount'] ?? 0,
                'pickme_amount' => $validated['pickme_amount'] ?? 0,
                'uber_amount' => $validated['uber_amount'] ?? 0,
                'additional_payment' => $validated['additional_payment'] ?? 0,
                'balance' => $balance,
                'payment_method' => $validated['payment_method'] ?? null,
                'kitchen_note' => $validated['kitchen_note'],
            ]);

            // Create sale items
            $costPriceService = new CostPriceService();
            
            foreach ($validated['items'] as $item) {
                $salesItem = SalesItem::create([
                    'sale_id' => $sale->id,
                    'menu_item_id' => $item['menu_item_id'],
                    'product_name' => $item['product_name'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_price' => $item['total_price'],
                    'is_kot' => $item['is_kot'] ?? false,
                    'is_bot' => $item['is_bot'] ?? false,
                    'item_status' => $item['item_status'] ?? 'pending',
                ]);

                // Calculate and save cost price
                $costPrice = $costPriceService->calculateCostPrice($salesItem);
                $salesItem->update(['cost_price' => $costPrice]);

                // Deduct materials from store
                $costPriceService->deductMaterialsFromStore($salesItem);
            }

            // Consume raw materials from stores when order is completed
            if ($validated['status'] === 'completed') {
                try {
                    $fifoService = app(FIFOConsumptionService::class);
                    
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
                            // This is a ready-made product - deduct from food_store_records
                            $quantityToDeduct = $item['quantity'];
                            
                            if ($foodStoreRecord->quantity >= $quantityToDeduct) {
                                $foodStoreRecord->quantity -= $quantityToDeduct;
                                $foodStoreRecord->save();
                                
                                Log::info("Ready-made product quantity deducted", [
                                    'menu_item' => $menuItem->name,
                                    'quantity_deducted' => $quantityToDeduct,
                                    'remaining' => $foodStoreRecord->quantity,
                                    'sale_id' => $sale->id
                                ]);
                            } else {
                                Log::warning("Insufficient ready-made product quantity", [
                                    'menu_item' => $menuItem->name,
                                    'needed' => $quantityToDeduct,
                                    'available' => $foodStoreRecord->quantity,
                                    'sale_id' => $sale->id
                                ]);
                            }
                            
                            continue; // Skip raw material consumption
                        }

                        // If not ready-made, proceed with raw material consumption from recipe
                        $menuItemWithRecipe = MenuItem::with(['currentRecipe.items.material'])->find($item['menu_item_id']);
                        
                        if (!$menuItemWithRecipe || !$menuItemWithRecipe->currentRecipe) {
                            Log::info("No recipe found for menu item", [
                                'menu_item_id' => $item['menu_item_id'],
                                'name' => $item['product_name']
                            ]);
                            continue;
                        }

                        $recipe = $menuItemWithRecipe->currentRecipe;
                        
                        // Consume each raw material in the recipe
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
                                Log::warning("No stock found for material", [
                                    'material_id' => $material->id,
                                    'material_name' => $material->name,
                                    'sale_id' => $sale->id
                                ]);
                                continue;
                            }

                            $storeId = $storeBatch->store_id;

                            // Check available quantity
                            $available = $fifoService->getAvailableQuantity($material->id, $storeId);
                            
                            if ($available < $quantityNeeded) {
                                Log::warning("Insufficient stock", [
                                    'material' => $material->name,
                                    'needed' => $quantityNeeded,
                                    'available' => $available,
                                    'sale_id' => $sale->id
                                ]);
                                continue;
                            }

                            // Consume using FIFO
                            $consumeResult = $fifoService->consume(
                                materialId: $material->id,
                                storeId: $storeId,
                                quantityNeeded: $quantityNeeded,
                                referenceType: 'sale',
                                referenceId: $sale->id,
                                notes: "Order {$sale->order_id} - {$menuItem->name} (qty: {$item['quantity']})"
                            );

                            if (!$consumeResult['success']) {
                                Log::error("Failed to consume material", [
                                    'material' => $material->name,
                                    'error' => $consumeResult['message'],
                                    'sale_id' => $sale->id
                                ]);
                                continue;
                            }

                            // Track in sales_material_consumption table
                            try {
                                $totalCost = 0;
                                foreach ($consumeResult['consumptions'] ?? [] as $consumption) {
                                    $totalCost += $consumption['cost'] ?? 0;
                                }

                                SalesMaterialConsumption::create([
                                    'sale_id' => $sale->id,
                                    'order_id' => $sale->order_id,
                                    'menu_item_id' => $menuItem->id,
                                    'menu_item_name' => $menuItem->name,
                                    'material_id' => $material->id,
                                    'material_name' => $material->name,
                                    'quantity_consumed' => $quantityNeeded,
                                    'unit' => $storeBatch->unit ?? 'units',
                                    'cost_per_unit' => $storeBatch->cost_per_unit ?? 0,
                                    'total_cost' => $totalCost,
                                    'store_id' => $storeId,
                                    'store_name' => $storeBatch->store_name ?? Store::getStoreName($storeId),
                                    'batches_used' => $consumeResult['batches_used'] ?? 1,
                                ]);

                                Log::info("Material consumption tracked", [
                                    'sale_id' => $sale->id,
                                    'material' => $material->name,
                                    'quantity' => $quantityNeeded
                                ]);
                            } catch (\Exception $trackError) {
                                Log::error("Failed to track consumption", [
                                    'error' => $trackError->getMessage(),
                                    'sale_id' => $sale->id
                                ]);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Log error but don't fail the order
                    Log::error("Error consuming materials", [
                        'sale_id' => $sale->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            // Consume raw materials from stores when order is completed
            if ($validated['status'] === 'completed') {
                try {
                    $fifoService = app(FIFOConsumptionService::class);
                    
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
                            // This is a ready-made product - deduct from food_store_records
                            $quantityToDeduct = $item['quantity'];
                            
                            if ($foodStoreRecord->quantity >= $quantityToDeduct) {
                                $foodStoreRecord->quantity -= $quantityToDeduct;
                                $foodStoreRecord->save();
                                
                                Log::info("Ready-made product quantity deducted", [
                                    'menu_item' => $menuItem->name,
                                    'quantity_deducted' => $quantityToDeduct,
                                    'remaining' => $foodStoreRecord->quantity,
                                    'sale_id' => $sale->id
                                ]);
                            } else {
                                Log::warning("Insufficient ready-made product quantity", [
                                    'menu_item' => $menuItem->name,
                                    'needed' => $quantityToDeduct,
                                    'available' => $foodStoreRecord->quantity,
                                    'sale_id' => $sale->id
                                ]);
                            }
                            
                            continue; // Skip raw material consumption
                        }

                        // If not ready-made, proceed with raw material consumption from recipe
                        $menuItemWithRecipe = MenuItem::with(['currentRecipe.items.material'])->find($item['menu_item_id']);
                        
                        if (!$menuItemWithRecipe || !$menuItemWithRecipe->currentRecipe) {
                            Log::info("No recipe found for menu item", [
                                'menu_item_id' => $item['menu_item_id'],
                                'name' => $item['product_name']
                            ]);
                            continue;
                        }

                        $recipe = $menuItemWithRecipe->currentRecipe;
                        
                        // Consume each raw material in the recipe
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
                                Log::warning("No stock found for material", [
                                    'material_id' => $material->id,
                                    'material_name' => $material->name,
                                    'sale_id' => $sale->id
                                ]);
                                continue;
                            }

                            $storeId = $storeBatch->store_id;

                            // Check available quantity
                            $available = $fifoService->getAvailableQuantity($material->id, $storeId);
                            
                            if ($available < $quantityNeeded) {
                                Log::warning("Insufficient stock", [
                                    'material' => $material->name,
                                    'needed' => $quantityNeeded,
                                    'available' => $available,
                                    'sale_id' => $sale->id
                                ]);
                                continue;
                            }

                            // Consume using FIFO
                            $consumeResult = $fifoService->consume(
                                materialId: $material->id,
                                storeId: $storeId,
                                quantityNeeded: $quantityNeeded,
                                referenceType: 'sale',
                                referenceId: $sale->id,
                                notes: "Order {$sale->order_id} - {$menuItem->name} (qty: {$item['quantity']})"
                            );

                            if (!$consumeResult['success']) {
                                Log::error("Failed to consume material", [
                                    'material' => $material->name,
                                    'error' => $consumeResult['message'],
                                    'sale_id' => $sale->id
                                ]);
                                continue;
                            }

                            // Track in sales_material_consumption table
                            try {
                                $totalCost = 0;
                                foreach ($consumeResult['consumptions'] ?? [] as $consumption) {
                                    $totalCost += $consumption['cost'] ?? 0;
                                }

                                SalesMaterialConsumption::create([
                                    'sale_id' => $sale->id,
                                    'order_id' => $sale->order_id,
                                    'menu_item_id' => $menuItem->id,
                                    'menu_item_name' => $menuItem->name,
                                    'material_id' => $material->id,
                                    'material_name' => $material->name,
                                    'quantity_consumed' => $quantityNeeded,
                                    'unit' => $storeBatch->unit ?? 'units',
                                    'cost_per_unit' => $storeBatch->cost_per_unit ?? 0,
                                    'total_cost' => $totalCost,
                                    'store_id' => $storeId,
                                    'store_name' => $storeBatch->store_name ?? Store::getStoreName($storeId),
                                    'batches_used' => $consumeResult['batches_used'] ?? 1,
                                ]);

                                Log::info("Material consumption tracked", [
                                    'sale_id' => $sale->id,
                                    'material' => $material->name,
                                    'quantity' => $quantityNeeded
                                ]);
                            } catch (\Exception $trackError) {
                                Log::error("Failed to track consumption", [
                                    'error' => $trackError->getMessage(),
                                    'sale_id' => $sale->id
                                ]);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Log error but don't fail the order
                    Log::error("Error consuming materials", [
                        'sale_id' => $sale->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            // Create table_order entry if status is 'order' to track table status
            if ($validated['status'] === 'order' && isset($validated['table_number'])) {
                TableOrder::create([
                    'table_number' => $validated['table_number'],
                    'sale_id' => $sale->id,
                    'status' => 'open',
                    'opened_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $sale->load('salesItems', 'customer', 'user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, Sale $sale): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,kot,bot,completed,cancelled'
        ]);

        $sale->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $sale
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = Sale::with(['customer', 'user', 'salesItems.product']);

        if ($request->has('table_number')) {
            $query->where('table_number', $request->table_number);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $sales
        ]);
    }

    public function getBill(Sale $sale): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Load relationships
        $sale->load(['customer', 'user', 'salesItems']);

        // Get company information
        $company = \App\Models\CompanyInformation::first();

        // Calculate total discount
        $totalDiscount = 0;
        $items = $sale->salesItems->map(function ($item) use (&$totalDiscount) {
            $discountPercentage = 0;
            $discountAmount = 0;
            
            // Check if item has a discount (you can customize this logic)
            // For now, we'll calculate based on any price difference
            
            return [
                'name' => $item->product_name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total' => (float) $item->total_price,
                'discount_percentage' => $discountPercentage,
            ];
        });

        // Prepare bill data
        $billData = [
            'order_no' => $sale->order_id,
            'date' => $sale->created_at ? $sale->created_at->format('d/m/Y') : date('d/m/Y'),
            'table_number' => $sale->table_number,
            'cashier' => $sale->user ? $sale->user->name : '',
            'order_type' => 'Dine In',
            'items' => $items,
            'subtotal' => (float) $sale->subtotal,
            'discount' => $totalDiscount,
            'service_charge' => (float) $sale->service_charge_amount,
            'service_charge_percentage' => (float) $sale->service_charge,
            'total' => (float) $sale->total_amount,
            'total_discount' => $totalDiscount,
            'company' => [
                'name' => $company ? $company->name : 'TÜK',
                'phone' => $company ? $company->phone : '',
                'address' => $company ? $company->address : '',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $billData
        ]);
    }
}
