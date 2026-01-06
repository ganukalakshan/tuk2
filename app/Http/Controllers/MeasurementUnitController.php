<?php

namespace App\Http\Controllers;

use App\Models\MeasurementUnit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;

class MeasurementUnitController extends Controller
{
    /**
     * Display a listing of measurement units.
     */
    public function index(): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $units = MeasurementUnit::orderBy('unit_name')->get();

        return response()->json([
            'success' => true,
            'data' => $units,
        ]);
    }

    /**
     * Store a newly created measurement unit.
     */
    public function store(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'unit_name' => 'required|string|max:255|unique:measurement_units,unit_name',
            'unit_symbol' => 'required|string|max:50',
            'is_base' => 'boolean',
            'conversion_to_base' => 'nullable|numeric|min:0',
        ]);

        $unit = MeasurementUnit::create($validated);

        return response()->json([
            'success' => true,
            'data' => $unit,
            'message' => 'Measurement unit created successfully',
        ], 201);
    }

    /**
     * Display the specified measurement unit.
     */
    public function show(MeasurementUnit $measurementUnit): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'success' => true,
            'data' => $measurementUnit,
        ]);
    }

    /**
     * Update the specified measurement unit.
     */
    public function update(Request $request, MeasurementUnit $measurementUnit): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'unit_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('measurement_units', 'unit_name')->ignore($measurementUnit->id),
            ],
            'unit_symbol' => 'required|string|max:50',
            'is_base' => 'boolean',
            'conversion_to_base' => 'nullable|numeric|min:0',
        ]);

        $measurementUnit->update($validated);

        return response()->json([
            'success' => true,
            'data' => $measurementUnit,
            'message' => 'Measurement unit updated successfully',
        ]);
    }

    /**
     * Remove the specified measurement unit.
     */
    public function destroy(MeasurementUnit $measurementUnit): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $measurementUnit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Measurement unit deleted successfully',
        ]);
    }
}
