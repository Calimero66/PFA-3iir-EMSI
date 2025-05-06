<?php

namespace App\Services;

use App\Models\Article;
use App\Models\StockMovement;
use App\Models\StockSupply;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Exception;

class StockService
{
    /**
     * Add stock supply from a supplier
     *
     * @param array $data
     * @return StockSupply
     */
    public function addSupply(array $data): StockSupply
    {
        return DB::transaction(function () use ($data) {
            // Create the stock supply record
            $stockSupply = StockSupply::create([
                'article_id' => $data['article_id'],
                'supplier_id' => $data['supplier_id'],
                'quantity' => $data['quantity'],
                'supply_date' => $data['supply_date'] ?? now()
            ]);

            // Update the article quantity
            $article = Article::findOrFail($data['article_id']);
            $article->increment('quantity', $data['quantity']);

            // Create a stock movement record
            StockMovement::create([
                'article_id' => $data['article_id'],
                'type' => 'in',
                'quantity' => $data['quantity'],
                'date' => $data['supply_date'] ?? now(),
                'reason' => 'Supply from ' . Supplier::findOrFail($data['supplier_id'])->name,
            ]);

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
            ->with('supplier')
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
