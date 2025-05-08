<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Article;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Supplier::query();

        // Search functionality
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%")
                    ->orWhere('phone', 'like', "%{$searchTerm}%")
                    ->orWhere('address', 'like', "%{$searchTerm}%");
            });
        }

        // Sort by field
        if ($request->has('sort_by')) {
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($request->sort_by, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        $suppliers = $query->get();

        return response()->json([
            'data' => $suppliers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|unique:suppliers,email',
        ]);

        $supplier = Supplier::create($validated);

        return response()->json([
            'message' => 'Supplier created successfully',
            'supplier' => $supplier
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Supplier  $supplier
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Supplier $supplier)
    {
        return response()->json([
            'data' => $supplier
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Supplier  $supplier
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|email|unique:suppliers,email,' . $supplier->id,
        ]);

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully',
            'supplier' => $supplier
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Supplier  $supplier
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Supplier $supplier)
    {
        // Check if the supplier has any associated articles
        $articlesCount = Article::where('supplier_id', $supplier->id)->count();

        if ($articlesCount > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier because it has associated articles',
                'articles_count' => $articlesCount
            ], 409); // Conflict status code
        }



        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully'
        ]);
    }

    /**
     * Get all articles supplied by a specific supplier.
     *
     * @param  \App\Models\Supplier  $supplier
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getArticles(Supplier $supplier, Request $request)
    {
        $query = Article::where('supplier_id', $supplier->id);

        // Search functionality
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('barcode', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by low stock
        if ($request->has('low_stock') && $request->low_stock === 'true') {
            $threshold = $request->get('threshold', 10); // Default threshold is 10
            $query->where('quantity', '<', $threshold);
        }

        // Sort by field
        if ($request->has('sort_by')) {
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($request->sort_by, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        $articles = $query->get();
        $totalQuantity = $articles->sum('quantity');

        return response()->json([
            'supplier' => $supplier,
            'articles' => $articles,
            'total_count' => $articles->count(),
            'total_quantity' => $totalQuantity
        ]);
    }



    /**
     * Get suppliers with article counts.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuppliersWithCounts()
    {
        $suppliers = Supplier::withCount('articles')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'data' => $suppliers
        ]);
    }
}
