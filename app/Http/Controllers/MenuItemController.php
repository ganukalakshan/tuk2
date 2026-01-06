<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class MenuItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = MenuItem::with(['category', 'department']);

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
        }

        if ($request->has('active_only') && $request->active_only === 'true') {
            $query->where('is_active', true);
        }

        if ($request->has('prep_type') && in_array($request->prep_type, ['made_to_order', 'ready_made'])) {
            $query->where('prep_type', $request->prep_type);
        }

        $menuItems = $query->orderBy('display_order')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $menuItems
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:menu_items,code',
            'name' => 'required|string|max:100',
            'category_id' => 'required|exists:menu_categories,id',
            'department_id' => 'nullable|exists:departments,store_id',
            'sale_type' => 'required|in:kot,bot,both',
            'prep_type' => 'required|in:made_to_order,ready_made',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
            'image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $validated;

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->storeAs('menu-items', $imageName, 'public');
            $data['image'] = $imageName;
        }

        $menuItem = MenuItem::create($data);

        return response()->json([
            'success' => true,
            'data' => $menuItem->load(['category', 'department']),
            'message' => 'Menu item created successfully'
        ], 201);
    }

    public function show(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'success' => true,
            'data' => $menuItem->load(['category', 'department'])
        ]);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('menu_items')->ignore($menuItem->id)],
            'name' => 'required|string|max:100',
            'category_id' => 'required|exists:menu_categories,id',
            'department_id' => 'nullable|exists:departments,store_id',
            'sale_type' => 'required|in:kot,bot,both',
            'prep_type' => 'required|in:made_to_order,ready_made',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
            'image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $validated;

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($menuItem->image) {
                \Storage::disk('public')->delete('menu-items/' . $menuItem->image);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->storeAs('menu-items', $imageName, 'public');
            $data['image'] = $imageName;
        }

        $menuItem->update($data);

        return response()->json([
            'success' => true,
            'data' => $menuItem->load(['category', 'department']),
            'message' => 'Menu item updated successfully'
        ]);
    }

    public function destroy(Request $request, MenuItem $menuItem): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Check if menu item is used in any orders
        if ($menuItem->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete menu item that has been ordered'
            ], 422);
        }

        // Delete associated image if exists
        if ($menuItem->image) {
            \Storage::disk('public')->delete('menu-items/' . $menuItem->image);
        }

        $menuItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu item deleted successfully'
        ]);
    }
    /**
     * Get ready-made products for dropdown
     */
    public function readyMadeProducts(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $products = MenuItem::where('prep_type', 'ready_made')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}