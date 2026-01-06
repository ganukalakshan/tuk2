<?php

namespace App\Http\Controllers;

use App\Services\FIFOConsumptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StoreConsumptionController extends Controller
{
    protected $fifoService;

    public function __construct(FIFOConsumptionService $fifoService)
    {
        $this->fifoService = $fifoService;
    }

    /**
     * Consume material from store using FIFO
     */
    public function consume(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'store_id' => 'required|integer|min:1|max:4',
            'quantity' => 'required|numeric|min:0.001',
            'reference_type' => 'nullable|string|max:50',
            'reference_id' => 'nullable|integer',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->fifoService->consume(
                $validated['material_id'],
                $validated['store_id'],
                $validated['quantity'],
                $validated['reference_type'] ?? null,
                $validated['reference_id'] ?? null,
                $validated['notes'] ?? null
            );

            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }
        } catch (\Exception $e) {
            Log::error('Consumption failed', [
                'error' => $e->getMessage(),
                'request' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Consumption failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available quantity for a material in a store
     */
    public function getAvailable($materialId, $storeId)
    {
        $quantity = $this->fifoService->getAvailableQuantity($materialId, $storeId);

        return response()->json([
            'material_id' => $materialId,
            'store_id' => $storeId,
            'available_quantity' => $quantity
        ]);
    }

    /**
     * Get batch details for a material in a store
     */
    public function getBatches($materialId, $storeId)
    {
        $batches = $this->fifoService->getBatches($materialId, $storeId);

        return response()->json([
            'material_id' => $materialId,
            'store_id' => $storeId,
            'batches' => $batches,
            'total_available' => $batches->sum('remaining_quantity')
        ]);
    }

    /**
     * Preview consumption (what batches will be used)
     */
    public function preview(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'store_id' => 'required|integer|min:1|max:4',
            'quantity' => 'required|numeric|min:0.001',
        ]);

        $preview = $this->fifoService->previewConsumption(
            $validated['material_id'],
            $validated['store_id'],
            $validated['quantity']
        );

        return response()->json($preview);
    }

    /**
     * Get consumption history
     */
    public function getHistory($materialId, $storeId, Request $request)
    {
        $limit = $request->input('limit', 50);
        
        $history = $this->fifoService->getConsumptionHistory($materialId, $storeId, $limit);

        return response()->json([
            'material_id' => $materialId,
            'store_id' => $storeId,
            'history' => $history
        ]);
    }

    /**
     * Get all consumptions (recent)
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', 100);
        
        $consumptions = \App\Models\StoreConsumption::with(['storeBatch', 'material'])
            ->orderBy('consumed_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($consumptions);
    }
}
