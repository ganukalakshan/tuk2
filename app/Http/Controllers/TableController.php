<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\TableOrder;
use Illuminate\Http\Request;

class TableController extends Controller
{
    /**
     * Get all tables with their status
     */
    public function index()
    {
        try {
            // Get all 25 tables (static for now)
            $tables = [];
            
            // Get open table orders
            $openTables = TableOrder::where('status', 'open')
                                   ->get()
                                   ->keyBy('table_number');

            // Generate 25 tables with proper status
            for ($i = 1; $i <= 25; $i++) {
                $status = 'available';
                
                if (isset($openTables[$i])) {
                    $status = 'occupied';
                }

                $tables[] = [
                    'id' => $i,
                    'status' => $status
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $tables
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading tables: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get table orders
     */
    public function getOrders($tableId)
    {
        try {
            // Get open table order
            $tableOrder = TableOrder::where('table_number', $tableId)
                                   ->where('status', 'open')
                                   ->with('customer')
                                   ->first();

            if (!$tableOrder) {
                return response()->json([
                    'success' => true,
                    'orders' => [],
                    'order_id' => null,
                    'total' => 0
                ]);
            }

            // Return the items from table_order
            $orders = collect($tableOrder->items)->map(function($item) {
                return [
                    'id' => $item['menu_item_id'],
                    'name' => $item['product_name'],
                    'price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'is_kot' => $item['is_kot'] ?? false,
                    'is_bot' => $item['is_bot'] ?? false,
                    'item_status' => $item['item_status'] ?? 'pending'
                ];
            });

            return response()->json([
                'success' => true,
                'orders' => $orders,
                'order_id' => $tableOrder->order_id,
                'total' => $tableOrder->total_amount,
                'subtotal' => $tableOrder->subtotal,
                'service_charge' => $tableOrder->service_charge,
                'service_charge_amount' => $tableOrder->service_charge_amount,
                'kitchen_note' => $tableOrder->kitchen_note
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading table orders: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create or update table order
     */
    public function storeOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'table_number' => 'required|integer',
                'customer_id' => 'nullable|exists:customers,id',
                'items' => 'required|array',
                'items.*.menu_item_id' => 'required|integer',
                'items.*.product_name' => 'required|string',
                'items.*.unit_price' => 'required|numeric',
                'items.*.quantity' => 'required|integer',
                'items.*.total_price' => 'required|numeric',
                'items.*.is_kot' => 'boolean',
                'items.*.is_bot' => 'boolean',
                'items.*.item_status' => 'required|string',
                'subtotal' => 'required|numeric',
                'service_charge' => 'nullable|numeric',
                'service_charge_amount' => 'nullable|numeric',
                'total_amount' => 'required|numeric',
                'kitchen_note' => 'nullable|string',
            ]);

            // Check if table already has an open order
            $tableOrder = TableOrder::where('table_number', $validated['table_number'])
                                   ->where('status', 'open')
                                   ->first();

            if ($tableOrder) {
                // Update existing order
                $tableOrder->update([
                    'customer_id' => $validated['customer_id'],
                    'items' => $validated['items'],
                    'subtotal' => $validated['subtotal'],
                    'service_charge' => $validated['service_charge'] ?? 0,
                    'service_charge_amount' => $validated['service_charge_amount'] ?? 0,
                    'total_amount' => $validated['total_amount'],
                    'kitchen_note' => $validated['kitchen_note'],
                ]);
            } else {
                // Create new order
                $orderId = TableOrder::generateOrderId();
                
                $tableOrder = TableOrder::create([
                    'table_number' => $validated['table_number'],
                    'order_id' => $orderId,
                    'customer_id' => $validated['customer_id'],
                    'items' => $validated['items'],
                    'subtotal' => $validated['subtotal'],
                    'service_charge' => $validated['service_charge'] ?? 0,
                    'service_charge_amount' => $validated['service_charge_amount'] ?? 0,
                    'total_amount' => $validated['total_amount'],
                    'kitchen_note' => $validated['kitchen_note'],
                    'status' => 'open',
                    'opened_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Table order saved successfully',
                'data' => $tableOrder
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving table order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Close table order
     */
    public function closeTableOrder($tableNumber)
    {
        try {
            // Find open table order
            $tableOrder = TableOrder::where('table_number', $tableNumber)
                                   ->where('status', 'open')
                                   ->first();

            if ($tableOrder) {
                $tableOrder->update([
                    'status' => 'closed',
                    'closed_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Table closed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error closing table: ' . $e->getMessage()
            ], 500);
        }
    }
}
