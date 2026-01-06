<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployerController extends Controller
{
    private function authorizeAdmin(): ?JsonResponse
    {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        if (auth()->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($response = $this->authorizeAdmin()) {
            return $response;
        }

        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $employers = $query
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at', 'updated_at']);

        return response()->json([
            'success' => true,
            'data' => $employers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->authorizeAdmin()) {
            return $response;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'role' => ['required', Rule::in(['admin', 'manager', 'cashier'])],
            'password' => 'required|string|min:8',
        ]);

        $employer = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Employer created successfully',
            'data' => $employer,
        ], 201);
    }

    public function show(User $employer): JsonResponse
    {
        if ($response = $this->authorizeAdmin()) {
            return $response;
        }

        return response()->json([
            'success' => true,
            'data' => $employer->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
        ]);
    }

    public function update(Request $request, User $employer): JsonResponse
    {
        if ($response = $this->authorizeAdmin()) {
            return $response;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => [
                'required',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($employer->id),
            ],
            'role' => ['required', Rule::in(['admin', 'manager', 'cashier'])],
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $employer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Employer updated successfully',
            'data' => $employer->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
        ]);
    }

    public function destroy(User $employer): JsonResponse
    {
        if ($response = $this->authorizeAdmin()) {
            return $response;
        }

        if (auth()->id() === $employer->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account',
            ], 422);
        }

        $employer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employer deleted successfully',
        ]);
    }
}
