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
    public function update(Request $request, $id)
    {
        // Find the article manually to avoid route model binding issues
        $article = Article::find($id);

        if (!$article) {
            return response()->json([
                'message' => 'Article not found'
            ], 404);
        }

        $validated = $request->validate([
            'barcode' => "sometimes|required|string|size:12",
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:0',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'supplier_id' => 'sometimes|nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        // Only validate barcode/name consistency if barcode or name is being changed
        if (isset($validated['barcode']) && $validated['barcode'] !== $article->barcode) {
            // Barcode is being changed - check if new barcode exists with different name
            $existingArticle = Article::where('barcode', $validated['barcode'])
                ->where('id', '!=', $article->id)
                ->first();

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
        } elseif (isset($validated['name']) && $validated['name'] !== $article->name) {
            // Name is being changed - check if other articles with same barcode would have different names
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

        return DB::transaction(function () use ($article, $validated) {
            $originalQuantity = $article->quantity;
            $stockMovementsCreated = [];

            Log::info("Before update - Article ID: {$article->id}, Original Quantity: {$originalQuantity}, Validated data: " . json_encode($validated));

            // Update the article
            $article->update($validated);

            Log::info("After update - Article ID: {$article->id}, New Quantity: {$article->quantity}");

            // If quantity was changed, create stock movement only for this specific article
            if (isset($validated['quantity']) && $validated['quantity'] != $originalQuantity) {
                $quantityDifference = $validated['quantity'] - $originalQuantity;
                $movementType = $quantityDifference > 0 ? 'in' : 'out';
                $movementQuantity = abs($quantityDifference);

                Log::info("Article #{$article->id} quantity changed from {$originalQuantity} to {$validated['quantity']} (difference: {$quantityDifference})");

                // Create stock movement only for the current article
                $stockMovement = StockMovement::create([
                    'article_id' => $article->id,
                    'type' => $movementType,
                    'quantity' => $movementQuantity,
                    'date' => now(),
                    'reason' => "Quantity update for article #{$article->id} - {$article->name}"
                ]);

                $stockMovementsCreated[] = [
                    'stock_movement_id' => $stockMovement->id,
                    'article_id' => $article->id,
                    'article_name' => $article->name,
                    'type' => $movementType,
                    'quantity' => $movementQuantity,
                    'date' => $stockMovement->date,
                    'reason' => $stockMovement->reason
                ];

                Log::info("Created stock movement #{$stockMovement->id} for article #{$article->id} - {$article->name}");
            }

            // Refresh the article to get updated data
            $article->refresh();

            Log::info("Article after update - ID: {$article->id}, Quantity: {$article->quantity}, Barcode: {$article->barcode}");

            return response()->json([
                'message' => 'Article updated successfully',
                'article' => $article,
                'quantity_changed' => isset($validated['quantity']),
                'original_quantity' => $originalQuantity,
                'new_quantity' => $article->quantity,
                'quantity_difference' => isset($validated['quantity']) ? ($validated['quantity'] - $originalQuantity) : 0,
                'stock_movements_created' => $stockMovementsCreated,
                'stock_movements_count' => count($stockMovementsCreated),
                'barcode' => $article->barcode,
                'debug_info' => [
                    'article_id' => $article->id,
                    'validation_data' => $validated,
                    'update_successful' => true
                ]
            ]);
        });
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

                // Find all stock supplies with articles that have the same barcode (excluding the current article)
                $stockSuppliesWithSameBarcode = StockSupply::whereHas('article', function ($query) use ($articleBarcode, $articleId) {
                    $query->where('barcode', $articleBarcode)
                        ->where('id', '!=', $articleId);
                })
                ->with('article')
                ->orderBy('supply_date', 'asc')
                ->get();

                Log::info("Found " . count($stockSuppliesWithSameBarcode) . " stock supplies with articles having barcode {$articleBarcode}");

                // Reduce quantities from stock supplies with the same barcode
                $remainingQuantityToReduce = $articleQuantity;

                foreach ($stockSuppliesWithSameBarcode as $stockSupply) {
                    if ($remainingQuantityToReduce <= 0) {
                        break;
                    }

                    $originalQuantity = $stockSupply->quantity;
                    $reductionAmount = min($remainingQuantityToReduce, $originalQuantity);
                    $newQuantity = $originalQuantity - $reductionAmount;

                    // Update the stock supply quantity
                    $stockSupply->quantity = $newQuantity;
                    $stockSupply->save();

                    // Also update the related article's quantity
                    $relatedArticle = $stockSupply->article;
                    $relatedArticle->quantity = max(0, $relatedArticle->quantity - $reductionAmount);
                    $relatedArticle->save();

                    $updatedStockSupplies[] = [
                        'stock_supply_id' => $stockSupply->id,
                        'article_id' => $relatedArticle->id,
                        'article_name' => $relatedArticle->name,
                        'article_barcode' => $relatedArticle->barcode,
                        'original_quantity' => $originalQuantity,
                        'reduction_amount' => $reductionAmount,
                        'new_quantity' => $newQuantity,
                        'article_quantity_updated' => $relatedArticle->quantity
                    ];

                    $remainingQuantityToReduce -= $reductionAmount;

                    Log::info("Updated stock supply #{$stockSupply->id}: {$originalQuantity} -> {$newQuantity} (reduced by {$reductionAmount})");
                    Log::info("Updated related article #{$relatedArticle->id} quantity to {$relatedArticle->quantity}");

                    // If stock supply quantity becomes 0 or negative, mark it as depleted
                    if ($newQuantity <= 0) {
                        Log::info("Stock supply #{$stockSupply->id} quantity is now 0 or negative, keeping record but marking as depleted");
                    }
                }

                // Log if there's remaining quantity that couldn't be reduced
                if ($remainingQuantityToReduce > 0) {
                    Log::warning("Could not reduce {$remainingQuantityToReduce} units from stock supplies - insufficient stock supplies with matching barcode");
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
                    'message' => 'Article deleted successfully and quantities reduced from stock supplies with matching barcode',
                    'deleted_article_id' => $articleId,
                    'deleted_article_name' => $articleName,
                    'deleted_article_barcode' => $articleBarcode,
                    'deleted_article_quantity' => $articleQuantity,
                    'stock_supplies_with_same_barcode_count' => count($stockSuppliesWithSameBarcode),
                    'updated_stock_supplies' => $updatedStockSupplies,
                    'updated_stock_supplies_count' => count($updatedStockSupplies),
                    'total_quantity_reduced_from_supplies' => collect($updatedStockSupplies)->sum('reduction_amount'),
                    'remaining_quantity_not_reduced' => $remainingQuantityToReduce,
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

