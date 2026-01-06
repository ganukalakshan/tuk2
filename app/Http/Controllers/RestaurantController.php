<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RestaurantController extends Controller
{
    public function show()
    {
        $restaurant = Restaurant::first();
        
        return Inertia::render('Company/Show', [
            'restaurant' => $restaurant,
        ]);
    }

    public function get()
    {
        $restaurant = Restaurant::first();
        
        if (!$restaurant) {
            return response()->json([
                'success' => false,
                'data' => null
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $restaurant
        ]);
    }

    public function update(Request $request)
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

        $restaurant = Restaurant::first();
        
        if ($restaurant) {
            $restaurant->update($validated);
        } else {
            $restaurant = Restaurant::create($validated);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => $restaurant
            ]);
        }

        return redirect()->back()->with('success', 'Company information updated successfully.');
    }
}
