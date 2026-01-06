<?php

namespace App\Http\Controllers;

use App\Models\CompanyInformation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CompanyInformationController extends Controller
{
    public function get(): JsonResponse
    {
        $company = CompanyInformation::first();
        
        if (!$company) {
            return response()->json([
                'success' => false,
                'data' => null
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $company
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'phone_secondary' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'email' => 'nullable|email|max:255',
            'tax_id' => 'nullable|string|max:50',
            'vat_number' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:10',
        ]);

        $company = CompanyInformation::first();
        
        if ($company) {
            $company->update($validated);
        } else {
            $company = CompanyInformation::create($validated);
        }

        return response()->json([
            'success' => true,
            'data' => $company
        ]);
    }
}
