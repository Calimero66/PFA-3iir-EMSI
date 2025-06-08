<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\StockSupply;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class StockSupplyController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $supplies = StockSupply::with(['article.category', 'article.supplier'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform the data to include article name prominently
        $transformedSupplies = $supplies->map(function ($supply) {
            // Skip supplies with missing articles
            if (!$supply->article) {
                return null;
            }

            return [
                'id' => $supply->id,
                'article_id' => $supply->article_id,
                'article_name' => $supply->article->name,
                'article_barcode' => $supply->article->barcode,
                'article_price' => $supply->article->price,
                'category_name' => $supply->article->category?->name ?? 'Uncategorized',
                'supplier_name' => $supply->article->supplier?->name ?? 'No Supplier',
                'quantity' => $supply->quantity,
                'supply_date' => $supply->supply_date,
                'notes' => $supply->notes,
                'created_at' => $supply->created_at,
                'updated_at' => $supply->updated_at,
                // Include full article object for backward compatibility
                'article' => $supply->article
            ];
        })->filter(); // Remove null entries

        return response()->json([
            'data' => $transformedSupplies
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'article_id' => 'required|exists:articles,id',
            'quantity' => 'required|integer|min:1',
            'supply_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if we should update an existing stock supply
            $data = $request->all();
            $data['update_existing'] = true; 

            $user = auth()->user();

            if ($user) {
                $userId = $user->id;
                Log::info('StockSupplyController: Using authenticated user ID: ' . $userId);
            } else {
                // Try to get the first user as a fallback
                $user = User::first();
                $userId = $user ? $user->id : null;
                Log::info('StockSupplyController: Using fallback user ID: ' . ($userId ?? 'null'));
            }

            // Set the user ID in the data - force it to be an integer
            $data['user_id'] = (int) $userId;

            $supply = $this->stockService->addSupply($data);

            // Load relationships and format response
            $supply->load(['article.category', 'article.supplier']);

            // Check if article exists
            if (!$supply->article) {
                return response()->json([
                    'message' => 'Article not found for this stock supply'
                ], 404);
            }

            $formattedSupply = [
                'id' => $supply->id,
                'article_id' => $supply->article_id,
                'article_name' => $supply->article->name,
                'article_barcode' => $supply->article->barcode,
                'article_price' => $supply->article->price,
                'category_name' => $supply->article->category?->name ?? 'Uncategorized',
                'supplier_name' => $supply->article->supplier?->name ?? 'No Supplier',
                'quantity' => $supply->quantity,
                'supply_date' => $supply->supply_date,
                'notes' => $supply->notes,
                'created_at' => $supply->created_at,
                'updated_at' => $supply->updated_at,
                'article' => $supply->article
            ];

            return response()->json([
                'message' => 'Stock supply added or updated successfully',
                'data' => $formattedSupply
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add stock supply',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Find the stock supply manually
        $stock_supply = StockSupply::with(['article.category', 'article.supplier'])->find($id);

        if (!$stock_supply) {
            return response()->json([
                'message' => 'Stock supply not found'
            ], 404);
        }



        // Check if article exists
        if (!$stock_supply->article) {
            return response()->json([
                'message' => 'Article not found for this stock supply'
            ], 404);
        }

        $formattedSupply = [
            'id' => $stock_supply->id,
            'article_id' => $stock_supply->article_id,
            'article_name' => $stock_supply->article->name,
            'article_barcode' => $stock_supply->article->barcode,
            'article_price' => $stock_supply->article->price,
            'category_name' => $stock_supply->article->category?->name ?? 'Uncategorized',
            'supplier_name' => $stock_supply->article->supplier?->name ?? 'No Supplier',
            'quantity' => $stock_supply->quantity,
            'supply_date' => $stock_supply->supply_date,
            'notes' => $stock_supply->notes,
            'created_at' => $stock_supply->created_at,
            'updated_at' => $stock_supply->updated_at,
            'article' => $stock_supply->article
        ];

        return response()->json([
            'data' => $formattedSupply
        ]);
    }

    /**
     * Get stock by category
     */
    public function getStockByCategory($categoryId)
    {
        // Check if category exists
        $category = Category::find($categoryId);
        if (!$category) {
            return response()->json([
                'message' => 'Category not found'
            ], 404);
        }

        $stockData = $this->stockService->getStockByCategory($categoryId);

        return response()->json([
            'data' => $stockData
        ]);
    }

    /**
     * Get supplies for a specific article
     */
    public function getArticleSupplies($articleId)
    {
        // Check if article exists
        $article = Article::with(['category', 'supplier'])->find($articleId);
        if (!$article) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        }

        $supplies = $this->stockService->getArticleSupplies($articleId);

        // Transform supplies to include article name for consistency
        $transformedSupplies = $supplies->map(function ($supply) use ($article) {
            return [
                'id' => $supply->id,
                'article_id' => $supply->article_id,
                'article_name' => $article->name,
                'article_barcode' => $article->barcode,
                'article_price' => $article->price,
                'quantity' => $supply->quantity,
                'supply_date' => $supply->supply_date,
                'notes' => $supply->notes,
                'created_at' => $supply->created_at,
                'updated_at' => $supply->updated_at,
            ];
        });

        return response()->json([
            'data' => [
                'article' => [
                    'id' => $article->id,
                    'name' => $article->name,
                    'barcode' => $article->barcode,
                    'price' => $article->price,
                    'current_quantity' => $article->quantity,
                    'category_name' => $article->category?->name ?? 'Uncategorized',
                    'supplier_name' => $article->supplier?->name ?? 'No Supplier',
                ],
                'supplies' => $transformedSupplies,
                'total_supplies' => $supplies->count(),
                'total_quantity_supplied' => $supplies->sum('quantity')
            ]
        ]);
    }

    /**
     * Get stock movements for a specific article
     */
    public function getArticleMovements($articleId)
    {
        // Check if article exists
        $article = Article::find($articleId);
        if (!$article) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        }

        $movements = $this->stockService->getArticleMovements($articleId);

        return response()->json([
            'data' => [
                'article' => $article,
                'movements' => $movements
            ]
        ]);
    }
}
