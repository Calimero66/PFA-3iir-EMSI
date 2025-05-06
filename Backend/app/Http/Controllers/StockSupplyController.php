<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\StockSupply;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
        $supplies = StockSupply::with(['article', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $supplies
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'article_id' => 'required|exists:articles,id',
            'supplier_id' => 'required|exists:suppliers,id',
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
            $supply = $this->stockService->addSupply($request->all());

            return response()->json([
                'message' => 'Stock supply added successfully',
                'data' => $supply->load(['article', 'supplier'])
            ], 201);
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
    public function show(StockSupply $stockSupply)
    {
        return response()->json([
            'data' => $stockSupply->load(['article', 'supplier'])
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
        $article = Article::find($articleId);
        if (!$article) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        }

        $supplies = $this->stockService->getArticleSupplies($articleId);

        return response()->json([
            'data' => [
                'article' => $article,
                'supplies' => $supplies
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
