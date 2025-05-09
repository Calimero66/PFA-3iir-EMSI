<?php

namespace App\Services;

use App\Models\Article;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Services\ReportService;

class StockService
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }
    /**
     * Add stock supply for an article
     * Always creates a new stock supply entry
     *
     * @param array $data
     * @return StockSupply
     */
    public function addSupply(array $data): StockSupply
    {
        return DB::transaction(function () use ($data) {
            $supplyDate = $data['supply_date'] ?? now();

            // Get the article to determine the supplier name for the movement record
            $article = Article::findOrFail($data['article_id']);
            $supplierName = $article->supplier ? $article->supplier->name : 'Unknown';

            // Check if we should update an existing stock supply
            $updateExisting = isset($data['update_existing']) && $data['update_existing'] === true;
            // $updateExisting = isset($data['update_existing']) === true;

            if ($updateExisting) {
                // Get the barcode of the current article
                $barcode = $article->barcode;

                // Find all articles with the same barcode
                $articlesWithSameBarcode = Article::where('barcode', $barcode)->get();

                // Find the existing stock supply for any article with the same barcode
                $existingSupply = null;
                foreach ($articlesWithSameBarcode as $articleWithSameBarcode) {
                    $supply = StockSupply::where('article_id', $articleWithSameBarcode->id)->first();
                    if ($supply) {
                        $existingSupply = $supply;
                        break;
                    }
                }

                if ($existingSupply) {
                    // Update the existing stock supply
                    $existingSupply->quantity += $data['quantity'];

                    // Update notes if provided
                    if (isset($data['notes'])) {
                        $existingSupply->notes = $data['notes'];
                    }

                    $existingSupply->save();
                    $stockSupply = $existingSupply;
                } else {
                    // Create a new stock supply record if no existing one found
                    $supplyData = [
                        'article_id' => $data['article_id'],
                        'quantity' => $data['quantity'],
                        'supply_date' => $supplyDate
                    ];

                    // Add notes if provided
                    if (isset($data['notes'])) {
                        $supplyData['notes'] = $data['notes'];
                    }

                    $stockSupply = StockSupply::create($supplyData);
                }
            } else {
                // Create a new stock supply record
                $supplyData = [
                    'article_id' => $data['article_id'],
                    'quantity' => $data['quantity'],
                    'supply_date' => $supplyDate
                ];

                // Add notes if provided
                if (isset($data['notes'])) {
                    $supplyData['notes'] = $data['notes'];
                }

                $stockSupply = StockSupply::create($supplyData);
            }

            // Update the article quantity only if we're not updating an existing stock supply
            if (!$updateExisting) {
                $article = Article::findOrFail($data['article_id']);
                $article->increment('quantity', $data['quantity']);
            }

            // Create a stock movement record
            $stockMovement = StockMovement::create([
                'article_id' => $data['article_id'],
                'type' => 'in',
                'quantity' => $data['quantity'],
                'date' => $supplyDate,
                'reason' => "Supply from {$supplierName}",
            ]);

            // Create a report for this stock movement
            $reportData = [
                'supplier_id' => $article->supplier_id ?? null,
                'details' => $data['notes'] ?? "Supply for article {$article->name} (Barcode: {$article->barcode})",
            ];

            // Explicitly pass the user ID if provided
            if (isset($data['user_id'])) {
                $reportData['user_id'] = $data['user_id'];
                Log::info('StockService: Using provided user_id: ' . $data['user_id']);
            } else {
                Log::info('StockService: No user_id provided in data');
            }

            $this->reportService->createStockMovementReport($stockMovement, $reportData);

            return $stockSupply;
        });
    }

    /**
     * Get total stock by category
     *
     * @param int $categoryId
     * @return array
     */
    public function getStockByCategory(int $categoryId): array
    {
        $articles = Article::where('category_id', $categoryId)->get();

        $totalQuantity = $articles->sum('quantity');

        return [
            'category_id' => $categoryId,
            'category_name' => $articles->first()?->category?->name ?? 'Unknown',
            'total_quantity' => $totalQuantity,
            'articles' => $articles,
        ];
    }

    /**
     * Get stock supplies for an article
     *
     * @param int $articleId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getArticleSupplies(int $articleId)
    {
        return StockSupply::where('article_id', $articleId)
            ->orderBy('supply_date', 'desc')
            ->get();
    }

    /**
     * Get stock movement history for an article
     *
     * @param int $articleId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getArticleMovements(int $articleId)
    {
        return StockMovement::where('article_id', $articleId)
            ->orderBy('date', 'desc')
            ->get();
    }
}
