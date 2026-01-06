<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class MenuCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = MenuCategory::with('parent');

        if ($request->has('active_only') && $request->active_only === 'true') {
            $query->where('is_active', true);
        }

        $categories = $query->orderBy('display_order')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:menu_categories,name',
            'parent_id' => 'nullable|exists:menu_categories,id',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $category = MenuCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Menu category created successfully',
            'data' => $category->load('parent'),
        ], 201);
    }

    public function show(MenuCategory $menuCategory): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'success' => true,
            'data' => $menuCategory->load('parent'),
        ]);
    }

    public function update(Request $request, MenuCategory $menuCategory): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('menu_categories', 'name')->ignore($menuCategory->id),
            ],
            'parent_id' => 'nullable|exists:menu_categories,id',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $menuCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Menu category updated successfully',
            'data' => $menuCategory->load('parent'),
        ]);
    }

    public function destroy(MenuCategory $menuCategory): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $menuCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu category deleted successfully',
        ]);
    }
}