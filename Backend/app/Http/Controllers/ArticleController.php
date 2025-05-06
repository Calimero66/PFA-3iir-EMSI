<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Supplier;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class ArticleController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }
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
            // Check if article with this barcode already exists
            $existingArticle = Article::where('barcode', $validated['barcode'])->first();

            if ($existingArticle) {
                // Article already exists, update its price if needed
                if ($existingArticle->price != $validated['price']) {
                    $existingArticle->price = $validated['price'];
                    $existingArticle->save();
                }

                // If supplier_id is provided, add stock supply
                if ($request->has('supplier_id') && $request->supplier_id !== null) {
                    $stockSupply = $this->stockService->addSupply([
                        'article_id' => $existingArticle->id,
                        'supplier_id' => $request->supplier_id,
                        'quantity' => $validated['quantity'],
                        'supply_date' => now()
                    ]);

                    // Refresh the article to get the updated quantity
                    $existingArticle->refresh();

                    return response()->json([
                        'message' => 'Article stock updated successfully',
                        'article' => $existingArticle,
                        'stock_supply' => $stockSupply
                    ], 200);
                }

                return response()->json([
                    'message' => 'Article already exists',
                    'article' => $existingArticle
                ], 200);
            }

            // Create a new article with quantity 0 initially
            $initialQuantity = $validated['quantity'];
            $validated['quantity'] = 0;
            $article = Article::create($validated);

            // If supplier_id is provided, create a stock supply record
            $stockSupply = null;
            if ($request->has('supplier_id') && $request->supplier_id !== null) {
                $stockSupply = $this->stockService->addSupply([
                    'article_id' => $article->id,
                    'supplier_id' => $request->supplier_id,
                    'quantity' => $initialQuantity,
                    'supply_date' => now()
                ]);

                // Refresh the article to get the updated quantity
                $article->refresh();
            } else {
                // If no supplier_id, just set the quantity directly
                $article->quantity = $initialQuantity;
                $article->save();
            }

            return response()->json([
                'message' => 'Article created successfully',
                'article' => $article,
                'stock_supply' => $stockSupply
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
