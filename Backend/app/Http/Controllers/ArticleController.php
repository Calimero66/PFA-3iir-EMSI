<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
    
        $articles = $query->with([
            'category:id,name', 
            'supplier:id,name',
            'user:id,name'  // Add user relationship with name
        ])->get();
    
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
            'barcode' => 'required|string|size:12',
            'name' => 'required|string|max:255',
            // 'type' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            // Check if article with this barcode already exists
            $existingArticle = Article::where('barcode', $validated['barcode'])->first();

            if ($existingArticle) {
                // If the article exists but with a different category_id, return an error
                if (isset($validated['category_id']) && $existingArticle->category_id != $validated['category_id']) {
                    return response()->json([
                        'message' => 'An article with this barcode already exists in a different category',
                        'existing_article' => $existingArticle
                    ], 422);
                }

                // If the article has the same barcode and same category, allow creating a new article
                // Continue with the creation process
            }

            // Get the authenticated user or use a default user
            $user = auth()->user();

            if ($user) {
                $userId = $user->id;
                Log::info('ArticleController: Using authenticated user ID: ' . $userId);
            } else {
                // Try to get the first user as a fallback
                $user = User::first();
                $userId = $user ? $user->id : null;
                Log::info('ArticleController: Using fallback user ID: ' . ($userId ?? 'null'));
            }

            // Add user_id to the validated data
            $validated['user_id'] = $userId;

            // Create a new article
            $article = Article::create($validated);

            // Prepare supply data
            $supplyData = [
                'article_id' => $article->id,
                'quantity' => $validated['quantity'],
                'supply_date' => now(),
                'update_existing' => true, // Flag to update existing stock supply by barcode
                'user_id' => (int) $userId // Pass the user ID as an integer
            ];

            // Add notes if provided
            if ($request->has('notes')) {
                $supplyData['notes'] = $request->notes;
            }

            // Create stock supply using the stock service
            $stockSupply = $this->stockService->addSupply($supplyData);

            // Refresh article to get updated quantity
            $article->refresh();

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
            'barcode' => "sometimes|required|string|size:12",
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:0',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'supplier_id' => 'sometimes|nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        // If barcode is being changed, check if it already exists with a different category
        if (isset($validated['barcode']) && $validated['barcode'] !== $article->barcode) {
            $existingArticle = Article::where('barcode', $validated['barcode'])->first();

            if ($existingArticle) {
                $newCategoryId = $validated['category_id'] ?? $article->category_id;

                if ($existingArticle->category_id != $newCategoryId) {
                    return response()->json([
                        'message' => 'An article with this barcode already exists in a different category',
                        'existing_article' => $existingArticle
                    ], 422);
                }
            }
        }

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

