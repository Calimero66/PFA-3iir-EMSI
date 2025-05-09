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
        $supplies = StockSupply::with('article')
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
            $data['update_existing'] = true; // Always update existing stock supplies

            // Get the authenticated user or use a default user
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

            return response()->json([
                'message' => 'Stock supply added or updated successfully',
                'data' => $supply->load('article')
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
    public function show(StockSupply $stockSupply)
    {
        return response()->json([
            'data' => $stockSupply->load('article')
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
