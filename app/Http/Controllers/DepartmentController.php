<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = Department::query();

        if ($request->has('active_only') && $request->active_only === 'true') {
            $query->where('is_active', true);
        }

        $departments = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    public function show(Request $request, Department $department): JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'success' => true,
            'data' => $department
        ]);
    }
}