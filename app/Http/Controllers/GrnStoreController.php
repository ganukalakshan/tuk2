<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\Department;
use App\Models\Grn;
use App\Models\GrnItem;
use Illuminate\Http\Request;

class GrnStoreController extends Controller
{
    public function getAvailableGrnMaterials()
    {
        // Get all GRN items with their material details
        // All GRNs in the table are considered "received"
        $grnItems = GrnItem::with(['material', 'grn', 'unit'])
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'material_name' => $item->material->name ?? 'Unknown',
                    'quantity' => $item->quantity,
                    'unit' => $item->unit->unit_name ?? '',
                    'unit_id' => $item->unit_id,
                    'unit_symbol' => $item->unit->unit_symbol ?? '',
                    'conversion_to_base' => $item->unit->conversion_to_base ?? 1,
                    'grn_id' => $item->grn_id,
                    'batch_number' => $item->batch_number,
                    'material_id' => $item->material_id,
                ];
            });

        return response()->json($grnItems);
    }

    public function getStoreData($category)
    {
        // Handle "all" category - fetch from all stores
        if ($category === 'all') {
            $items = Store::with(['material', 'department'])
                ->get()
                ->map(function($item) {
                    // Get the unit info from material's storage_unit
                    $unit = $item->material?->storageUnit;
                    return [
                        'id' => $item->id,
                        'material_name' => $item->material_name,
                        'quantity' => $item->remaining_quantity,
                        'unit' => $item->unit,
                        'unit_id' => $unit?->id,
                        'unit_symbol' => $unit?->unit_symbol ?? $item->unit,
                        'conversion_to_base' => $unit?->conversion_to_base ?? 1,
                        'grn_id' => $item->grn_id,
                        'material_id' => $item->material_id,
                        'store_category' => $item->department->name ?? 'Unknown',
                    ];
                });
            return response()->json($items);
        }
        
        $storeId = $this->getStoreId($category);
        
        if (!$storeId) {
            return response()->json(['error' => 'Invalid category'], 400);
        }

        $items = Store::with(['material', 'department'])
            ->where('store_id', $storeId)
            ->get()
            ->map(function($item) {
                // Get the unit info from material's storage_unit
                $unit = $item->material?->storageUnit;
                return [
                    'id' => $item->id,
                    'material_name' => $item->material_name,
                    'quantity' => $item->remaining_quantity,
                    'unit' => $item->unit,
                    'unit_id' => $unit?->id,
                    'unit_symbol' => $unit?->unit_symbol ?? $item->unit,
                    'conversion_to_base' => $unit?->conversion_to_base ?? 1,
                    'grn_id' => $item->grn_id,
                    'material_id' => $item->material_id,
                ];
            });

        return response()->json($items);
    }

    public function addToStore(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|in:hot_kitchen,beverage,pastry,bakery',
            'material_name' => 'required|string',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'nullable|string',
            'unit_id' => 'nullable|exists:measurement_units,id',
            'grn_id' => 'nullable|exists:grns,id',
            'material_id' => 'nullable|exists:materials,id',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        $storeId = $this->getStoreId($validated['category']);
        
        if (!$storeId) {
            return response()->json(['error' => 'Invalid category'], 400);
        }

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

        // Get cost from GRN item if grn_id and material_id are provided
        $costPerUnit = $validated['cost_per_unit'] ?? null;
        if (!$costPerUnit && $validated['grn_id'] && $validated['material_id']) {
            $grnItem = \App\Models\GrnItem::where('grn_id', $validated['grn_id'])
                ->where('material_id', $validated['material_id'])
                ->first();
            if ($grnItem) {
                $costPerUnit = $grnItem->unit_price;
            }
        }

        $item = Store::create([
            'material_name' => $validated['material_name'],
            'original_quantity' => $validated['quantity'],
            'remaining_quantity' => $validated['quantity'],
            'unit' => $validated['unit'] ?? '',
            'unit_id' => $validated['unit_id'] ?? null,
            'store_name' => $validated['category'],
            'store_id' => $storeId,
            'grn_id' => $validated['grn_id'] ?? null,
            'material_id' => $validated['material_id'] ?? null,
            'batch_number' => $batchNumber,
            'transferred_at' => now(),
            'cost_per_unit' => $costPerUnit,
            'expiry_date' => $validated['expiry_date'] ?? null,
        ]);

        return response()->json($item, 201);
    }

    public function deleteFromStore($category, $id)
    {
        $storeId = $this->getStoreId($category);
        
        if (!$storeId) {
            return response()->json(['error' => 'Invalid category'], 400);
        }

        $item = Store::where('store_id', $storeId)->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }

    private function getStoreId($category)
    {
        return match($category) {
            'hot_kitchen' => Department::KITCHEN,
            'beverage' => Department::BEVERAGE,
            'pastry' => Department::PASTRY,
            'bakery' => Department::BAKERY,
            default => null,
        };
    }
}
