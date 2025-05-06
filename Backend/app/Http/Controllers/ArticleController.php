<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class ArticleController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Article::query();

        // Search functionality
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('type', 'like', "%{$searchTerm}%")
                    ->orWhere('barcode', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
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

        return response()->json([
            'data' => $articles
        ]);
    }

    /**
     * Get articles with low stock.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function lowStock(Request $request)
    {
        $threshold = $request->get('threshold', 10); // Default threshold is 10

        $articles = Article::where('quantity', '<', $threshold)
            ->orderBy('quantity', 'asc')
            ->get();

        return response()->json([
            'data' => $articles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string|max:12',
            'name' => 'required|string|max:255',
            // 'type' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            // Create the article
            $article = Article::create($validated);

            // If supplier_id is provided, create a stock supply record
            if ($request->has('supplier_id')) {
                $supplier = Supplier::findOrFail($request->supplier_id);

                // Create stock supply record
                $stockSupply = StockSupply::create([
                    'article_id' => $article->id,
                    'supplier_id' => $supplier->id,
                    'quantity' => $validated['quantity'],
                    'supply_date' => now(),
                    // 'notes' => $request->input('notes', 'Initial stock supply')
                ]);

                // Create stock movement record
                StockMovement::create([
                    'article_id' => $article->id,
                    'type' => 'in',
                    'quantity' => $validated['quantity'],
                    'date' => now(),
                    'reason' => 'Initial supply from ' . $supplier->name
                ]);
            }

            return response()->json([
                'message' => 'Article created successfully',
                'article' => $article,
                'stock_supply' => $request->has('supplier_id') ? $stockSupply : null
            ], 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Article $article)
    {
        return response()->json([
            'data' => $article
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * Note: This method is not typically used in API controllers
     * but is included for completeness.
     */
    public function edit(Article $article)
    {
        return response()->json([
            'message' => 'Form editing is not supported in API mode'
        ], 405);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Article $article)
    {
        $validated = $request->validate([
            'barcode' => 'sometimes|required|string|max:12|unique:articles,barcode,' . $article->id,
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:0',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'supplier_id' => 'sometimes|nullable|exists:suppliers,id',
        ]);

        $article->update($validated);

        return response()->json([
            'message' => 'Article updated successfully',
            'article' => $article
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Article $article)
    {
        $article->delete();

        return response()->json([
            'message' => 'Article deleted successfully'
        ]);
    }
}
