<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $authenticatedUser = auth()->user();

        if (!$authenticatedUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not authenticated'
            ], 401);
        }
        // Start with base query excluding the authenticated user
        $query = User::where('id', '!=', $authenticatedUser->id);

        // If the authenticated user is a Manager, only show Managers and Agents
        if ($authenticatedUser->role === 'Manager') {
            $query->whereIn('role', ['Agent']);
        }
        $users = $query->get();
        return response()->json([
            'status' => 'success',
            'data' => $users,
            'authenticated_user_role' => $authenticatedUser->role,
            'total_users_returned' => $users->count()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'role' => 'required|in:Admin,Agent,Manager',
            'password' => 'required|string|confirmed|min:6',
        ]);

        $user = User::create($fields);
        $token = $user->createToken($request->name);

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'user' => $user,
            'access_token' => $token->plainTextToken,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $user
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        // Find user manually like in destroy method
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|required|in:Admin,Agent,Manager',
            'password' => 'nullable|string|confirmed|min:6',
        ];

        // Validate the fields
        $fields = $request->validate($rules);
        
        // Remove password_confirmation if it exists
        if (isset($fields['password_confirmation'])) {
            unset($fields['password_confirmation']);
        }
        
        // Handle password
        if (isset($fields['password'])) {
            if (empty($fields['password'])) {
                unset($fields['password']);
            } else {
                $fields['password'] = bcrypt($fields['password']);
            }
        }

        // Check if any fields were provided after cleanup
        if (empty($fields)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No valid fields provided for update'
            ], 422);
        }

        try {
            $user->update($fields);

            return response()->json([
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        $authenticatedUser = auth()->user();
        if ($user->id === $authenticatedUser->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot delete yourself'
            ], 403);
        }
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully'
        ], 200);

    }
    /**
     * Create a new agent.
     */
    public function CreateAgent(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|confirmed|min:6',
        ]);

        // Force the role to be 'Agent'
        $fields['role'] = 'Agent';

        $user = User::create($fields);
        $token = $user->createToken($request->name);

        return response()->json([
            'status' => 'success',
            'message' => 'Agent created successfully',
            'user' => $user,
            'access_token' => $token->plainTextToken,
        ], 201);
    }
}
