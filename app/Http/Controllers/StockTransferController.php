<?php

namespace App\Http\Controllers;

use App\Models\StockTransfer;
use App\Models\TransferItem;
use App\Models\GrnItem;
use App\Models\Material;
use App\Models\Store;
use App\Models\MeasurementUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    /**
     * Get all available materials from GRN Store for transfer
     */
    public function getAvailableMaterials()
    {
        // Get all GRN items grouped by material with total quantities
        $materials = GrnItem::with(['material', 'unit'])
            ->select('material_id', DB::raw('SUM(quantity) as total_quantity'), 'unit_id')
            ->groupBy('material_id', 'unit_id')
            ->having('total_quantity', '>', 0)
            ->get()
            ->map(function($item) {
                return [
                    'material_id' => $item->material_id,
                    'material_name' => $item->material->name ?? 'Unknown',
                    'available_quantity' => $item->total_quantity,
                    'unit_id' => $item->unit_id,
                    'unit_name' => $item->unit->name ?? '',
                ];
            });

        return response()->json($materials);
    }

    /**
     * Transfer material from GRN Store to specific store
     */
    public function transferMaterial(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'quantity' => 'required|numeric|min:0.001',
            'unit_id' => 'required|exists:measurement_units,id',
            'to_store' => 'required|in:hot_kitchen,beverage,pastry,bakery',
        ]);

        DB::beginTransaction();
        try {
            // Get material details
            $material = Material::findOrFail($validated['material_id']);
            
            // Get unit details
            $unit = MeasurementUnit::findOrFail($validated['unit_id']);
            
            // Get available quantity from GRN
            $availableQty = GrnItem::where('material_id', $validated['material_id'])
                ->where('unit_id', $validated['unit_id'])
                ->sum('quantity');

            if ($availableQty < $validated['quantity']) {
                return response()->json([
                    'error' => 'Insufficient quantity in GRN Store',
                    'available' => $availableQty,
                    'requested' => $validated['quantity']
                ], 400);
            }

            // Get average cost per unit from GRN
            $grnItems = GrnItem::where('material_id', $validated['material_id'])
                ->where('unit_id', $validated['unit_id'])
                ->get();
            
            $totalCost = $grnItems->sum(function($item) {
                return $item->unit_price * $item->quantity;
            });
            
            $totalQty = $grnItems->sum('quantity');
            $costPerUnit = $totalQty > 0 ? $totalCost / $totalQty : 0;

            // Generate transfer number
            $transferNo = 'ST-' . date('Ymd') . '-' . str_pad(StockTransfer::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

            // Create stock transfer record
            $transfer = StockTransfer::create([
                'transfer_no' => $transferNo,
                'from_location' => 'grn_store',
                'to_location' => $validated['to_store'],
                'date' => now(),
                'requested_by' => auth()->id(),
                'status' => 'completed',
            ]);

            // Create transfer item
            TransferItem::create([
                'transfer_id' => $transfer->id,
                'material_id' => $validated['material_id'],
                'quantity' => $validated['quantity'],
                'unit_id' => $validated['unit_id'],
            ]);

            // Add to stores table with proper unit symbol and cost
            $storeId = Store::getStoreId($validated['to_store']);
            
            // Generate unique batch number for this material/store combination
            $latestBatchNumber = Store::where('material_id', $validated['material_id'])
                ->where('store_id', $storeId)
                ->whereNotNull('batch_number')
                ->orderByRaw('CAST(SUBSTRING(batch_number, 6) AS UNSIGNED) DESC')
                ->value('batch_number');
            
            $nextBatchNum = 1;
            if ($latestBatchNumber && preg_match('/batch(\d+)/', $latestBatchNumber, $matches)) {
                $nextBatchNum = intval($matches[1]) + 1;
            }
            $batchNumber = 'batch' . str_pad($nextBatchNum, 3, '0', STR_PAD_LEFT);
            
            // Calculate weighted average cost from GRN items
            $avgCost = $this->getAverageCostFromGrnStore($validated['material_id'], $validated['unit_id'], $validated['quantity']);
            
            Store::create([
                'material_name' => $material->name,
                'original_quantity' => $validated['quantity'],
                'remaining_quantity' => $validated['quantity'], // Initially same as original
                'unit' => $material->unit->name ?? '',
                'unit_id' => $validated['unit_id'],
                'unit' => $unit->unit_symbol, // Use unit symbol (g, kg, ml, L, etc.)
                'store_name' => $validated['to_store'],
                'store_id' => $storeId,
                'material_id' => $validated['material_id'],
                'grn_id' => null,
                'transferred_at' => now(), // Critical for FIFO
                'batch_number' => 'TR-' . $transfer->transfer_no, // Link to transfer
                'cost_per_unit' => $costPerUnit, // Store the cost per unit from GRN
            ]);

            // Deduct from GRN Store (proportionally from available GRN items)
            $this->deductFromGrnStore($validated['material_id'], $validated['unit_id'], $validated['quantity']);

            DB::commit();

            return response()->json([
                'message' => 'Material transferred successfully',
                'transfer' => $transfer->load('items.material', 'items.unit')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get all stock transfers
     */
    public function index()
    {
        $transfers = StockTransfer::with(['items.material', 'items.unit', 'requestedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($transfers);
    }

    /**
     * Get materials in specific store with filter option
     */
    public function getStoreMaterials($store)
    {
        $materials = Store::where('store_name', $store)
            ->where('quantity', '>', 0)
            ->with('material')
            ->get()
            ->map(function($item) use ($store) {
                return [
                    'id' => $item->id,
                    'material_name' => $item->material_name,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'material_id' => $item->material_id,
                    'store' => $store,
                    'store_id' => $item->store_id,
                    'transferred_from_grn' => $item->material_id !== null,
                ];
            });

        return response()->json($materials);
    }

    /**
     * Get average cost from GRN Store for material transfer
     */
    private function getAverageCostFromGrnStore($materialId, $unitId, $quantity)
    {
        $grnItems = GrnItem::where('material_id', $materialId)
            ->where('unit_id', $unitId)
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        $totalCost = 0;
        $totalQuantity = 0;
        $remainingToCalculate = $quantity;

        foreach ($grnItems as $grnItem) {
            if ($remainingToCalculate <= 0) break;

            $quantityToTake = min($grnItem->quantity, $remainingToCalculate);
            $totalCost += $quantityToTake * $grnItem->unit_price;
            $totalQuantity += $quantityToTake;
            $remainingToCalculate -= $quantityToTake;
        }

        return $totalQuantity > 0 ? round($totalCost / $totalQuantity, 2) : 0;
    }

    /**
     * Deduct quantity from GRN Store proportionally
     */
    private function deductFromGrnStore($materialId, $unitId, $quantity)
    {
        $grnItems = GrnItem::where('material_id', $materialId)
            ->where('unit_id', $unitId)
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        $remainingToDeduct = $quantity;

        foreach ($grnItems as $grnItem) {
            if ($remainingToDeduct <= 0) break;

            if ($grnItem->quantity >= $remainingToDeduct) {
                $grnItem->quantity -= $remainingToDeduct;
                $grnItem->save();
                $remainingToDeduct = 0;
            } else {
                $remainingToDeduct -= $grnItem->quantity;
                $grnItem->quantity = 0;
                $grnItem->save();
            }
        }
    }
}
