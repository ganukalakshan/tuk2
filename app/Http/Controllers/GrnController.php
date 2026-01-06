<?php

namespace App\Http\Controllers;

use App\Models\Grn;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GrnController extends Controller
{
    /**
     * Display a listing of GRNs (view-only).
     */
    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = Grn::with(['purchaseOrder.purchaseRequest', 'supplier', 'receivedBy', 'items.material', 'items.unit']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('grn_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $grns = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $grns
        ]);
    }

    /**
     * Display the specified GRN (view-only).
     */
    public function show(Grn $grn): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $grn->load(['purchaseOrder.purchaseRequest', 'supplier', 'receivedBy', 'items.material', 'items.unit']);

        return response()->json([
            'success' => true,
            'data' => $grn
        ]);
    }
}
