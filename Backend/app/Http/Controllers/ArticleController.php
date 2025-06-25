<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\User;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Report;
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
                // If the article exists but with a different name, return an error
                if ($existingArticle->name !== $validated['name']) {
                    return response()->json([
                        'message' => 'An article with this barcode already exists with a different name',
                        'existing_article' => [
                            'id' => $existingArticle->id,
                            'barcode' => $existingArticle->barcode,
                            'name' => $existingArticle->name,
                            'category_id' => $existingArticle->category_id
                        ],
                        'attempted_name' => $validated['name'],
                        'error_details' => 'Articles with the same barcode must have the same name'
                    ], 422);
                }

                // If the article exists but with a different category_id, return an error
                if (isset($validated['category_id']) && $existingArticle->category_id != $validated['category_id']) {
                    return response()->json([
                        'message' => 'An article with this barcode already exists in a different category',
                        'existing_article' => $existingArticle
                    ], 422);
                }

                // If the article has the same barcode, same name, and same category, allow creating a new article
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

        // If barcode is being changed, check if it already exists
        if (isset($validated['barcode']) && $validated['barcode'] !== $article->barcode) {
            $existingArticle = Article::where('barcode', $validated['barcode'])->first();

            if ($existingArticle) {
                $newName = $validated['name'] ?? $article->name;
                $newCategoryId = $validated['category_id'] ?? $article->category_id;

                // Check if the name would be different
                if ($existingArticle->name !== $newName) {
                    return response()->json([
                        'message' => 'An article with this barcode already exists with a different name',
                        'existing_article' => [
                            'id' => $existingArticle->id,
                            'barcode' => $existingArticle->barcode,
                            'name' => $existingArticle->name,
                            'category_id' => $existingArticle->category_id
                        ],
                        'attempted_name' => $newName,
                        'error_details' => 'Articles with the same barcode must have the same name'
                    ], 422);
                }

                // Check if the category would be different
                if ($existingArticle->category_id != $newCategoryId) {
                    return response()->json([
                        'message' => 'An article with this barcode already exists in a different category',
                        'existing_article' => $existingArticle
                    ], 422);
                }
            }
        }

        // If name is being changed, check if any other articles with the same barcode would have different names
        if (isset($validated['name']) && $validated['name'] !== $article->name) {
            $articlesWithSameBarcode = Article::where('barcode', $article->barcode)
                ->where('id', '!=', $article->id)
                ->first();

            if ($articlesWithSameBarcode && $articlesWithSameBarcode->name !== $validated['name']) {
                return response()->json([
                    'message' => 'Cannot change name because other articles with the same barcode have a different name',
                    'current_barcode' => $article->barcode,
                    'existing_article_with_same_barcode' => [
                        'id' => $articlesWithSameBarcode->id,
                        'name' => $articlesWithSameBarcode->name
                    ],
                    'attempted_name' => $validated['name'],
                    'error_details' => 'All articles with the same barcode must have the same name'
                ], 422);
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
    public function destroy($id)
    {
        try {
            // Find the article manually to avoid route model binding issues
            $article = Article::find($id);

            if (!$article) {
                return response()->json([
                    'message' => 'Article not found'
                ], 404);
            }

            return DB::transaction(function () use ($article) {
                $deletedReports = [];
                $updatedStockSupplies = [];

                // Store article info before deletion
                $articleId = $article->id;
                $articleName = $article->name;
                $articleBarcode = $article->barcode;
                $articleQuantity = $article->quantity;

                Log::info("Starting deletion of Article #{$articleId} - {$articleName} (Barcode: {$articleBarcode}, Quantity: {$articleQuantity})");

                // Find all other articles with the same barcode (excluding the current article)
                $articlesWithSameBarcode = Article::where('barcode', $articleBarcode)
                    ->where('id', '!=', $articleId)
                    ->get();

                Log::info("Found " . count($articlesWithSameBarcode) . " other articles with barcode {$articleBarcode}");

                // For each article with the same barcode, reduce stock supply quantities
                foreach ($articlesWithSameBarcode as $otherArticle) {
                    Log::info("Processing article #{$otherArticle->id} - {$otherArticle->name} with same barcode");

                    // Get stock supplies for this article, ordered by supply_date (oldest first)
                    $stockSupplies = StockSupply::where('article_id', $otherArticle->id)
                        ->orderBy('supply_date', 'asc')
                        ->get();

                    $remainingQuantityToReduce = $articleQuantity;

                    foreach ($stockSupplies as $stockSupply) {
                        if ($remainingQuantityToReduce <= 0) {
                            break;
                        }

                        $originalQuantity = $stockSupply->quantity;
                        $reductionAmount = min($remainingQuantityToReduce, $originalQuantity);
                        $newQuantity = $originalQuantity - $reductionAmount;

                        // Update the stock supply quantity
                        $stockSupply->quantity = $newQuantity;
                        $stockSupply->save();

                        $updatedStockSupplies[] = [
                            'stock_supply_id' => $stockSupply->id,
                            'article_id' => $otherArticle->id,
                            'article_name' => $otherArticle->name,
                            'original_quantity' => $originalQuantity,
                            'reduction_amount' => $reductionAmount,
                            'new_quantity' => $newQuantity
                        ];

                        $remainingQuantityToReduce -= $reductionAmount;

                        Log::info("Updated stock supply #{$stockSupply->id}: {$originalQuantity} -> {$newQuantity} (reduced by {$reductionAmount})");

                        // If stock supply quantity becomes 0, optionally delete it
                        if ($newQuantity <= 0) {
                            Log::info("Stock supply #{$stockSupply->id} quantity is now 0 or negative, keeping record but marking as depleted");
                        }
                    }

                    // Update the article's total quantity
                    $otherArticle->quantity = max(0, $otherArticle->quantity - ($articleQuantity - $remainingQuantityToReduce));
                    $otherArticle->save();

                    Log::info("Updated article #{$otherArticle->id} quantity to {$otherArticle->quantity}");
                }

                // Find all stock movements related to this article
                $stockMovements = StockMovement::where('article_id', $article->id)->get();

                // Delete all reports related to these stock movements
                foreach ($stockMovements as $stockMovement) {
                    $reports = Report::where('stock_movement_id', $stockMovement->id)->get();
                    foreach ($reports as $report) {
                        $deletedReports[] = [
                            'report_id' => $report->id,
                            'stock_movement_id' => $stockMovement->id,
                            'type' => $report->type,
                            'details' => $report->details
                        ];
                        $report->delete();
                        Log::info("Deleted report #{$report->id} for stock movement #{$stockMovement->id}");
                    }
                }

                // Delete the article (this will cascade delete stock movements and stock supplies due to foreign key constraints)
                $article->delete();

                Log::info("Article #{$articleId} - {$articleName} deleted successfully");

                $response = [
                    'message' => 'Article deleted successfully and quantities reduced from matching barcode stock supplies',
                    'deleted_article_id' => $articleId,
                    'deleted_article_name' => $articleName,
                    'deleted_article_barcode' => $articleBarcode,
                    'deleted_article_quantity' => $articleQuantity,
                    'articles_with_same_barcode_count' => count($articlesWithSameBarcode),
                    'updated_stock_supplies' => $updatedStockSupplies,
                    'updated_stock_supplies_count' => count($updatedStockSupplies),
                    'total_quantity_reduced_from_supplies' => collect($updatedStockSupplies)->sum('reduction_amount'),
                    'deleted_reports' => $deletedReports,
                    'deleted_reports_count' => count($deletedReports)
                ];

                return response()->json($response, 200);
            });
        } catch (\Exception $e) {
            Log::error('Error deleting article: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete article',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

