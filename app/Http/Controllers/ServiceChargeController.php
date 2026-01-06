<?php

namespace App\Http\Controllers;

use App\Models\ServiceCharge;
use Illuminate\Http\Request;

class ServiceChargeController extends Controller
{
    public function index()
    {
        $serviceCharges = ServiceCharge::orderBy('created_at', 'desc')->get();
        return response()->json($serviceCharges);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // If setting this as active, deactivate all others
        if ($validated['is_active'] ?? false) {
            ServiceCharge::where('is_active', true)->update(['is_active' => false]);
        }

        $serviceCharge = ServiceCharge::create($validated);
        
        return response()->json($serviceCharge, 201);
    }

    public function update(Request $request, ServiceCharge $serviceCharge)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'percentage' => 'sometimes|required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // If setting this as active, deactivate all others
        if (isset($validated['is_active']) && $validated['is_active']) {
            ServiceCharge::where('id', '!=', $serviceCharge->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $serviceCharge->update($validated);
        
        return response()->json($serviceCharge);
    }

    public function destroy(ServiceCharge $serviceCharge)
    {
        $serviceCharge->delete();
        
        return response()->json(['message' => 'Service charge deleted successfully']);
    }

    public function toggleActive(ServiceCharge $serviceCharge)
    {
        // If activating this charge, deactivate all others
        if (!$serviceCharge->is_active) {
            ServiceCharge::where('is_active', true)->update(['is_active' => false]);
        }

        $serviceCharge->is_active = !$serviceCharge->is_active;
        $serviceCharge->save();
        
        return response()->json($serviceCharge);
    }
}
