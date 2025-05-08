<?php

namespace App\Services;

use App\Models\Report;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Supplier;
use App\Models\OrderLine;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Create a new report for a stock movement
     *
     * @param StockMovement $stockMovement
     * @param array $data Additional data for the report
     * @return Report
     */
    public function createStockMovementReport(StockMovement $stockMovement, array $data = []): Report
    {
        return DB::transaction(function () use ($stockMovement, $data) {
            $reportData = [
                'type' => $stockMovement->type === 'in' ? 'supply' : 'sale',
                'report_date' => $data['report_date'] ?? now(),
                'user_id' => $data['user_id'] ?? Auth::id(),
                'stock_movement_id' => $stockMovement->id,
                'supplier_id' => $data['supplier_id'] ?? null,
                'order_line_id' => $data['order_line_id'] ?? null,
                'details' => $data['details'] ?? $stockMovement->reason,
            ];

            return Report::create($reportData);
        });
    }

    /**
     * Get all reports
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllReports()
    {
        return Report::with(['user', 'stockMovement.article', 'supplier', 'orderLine'])
            ->orderBy('report_date', 'desc')
            ->get();
    }

    /**
     * Get reports by type
     *
     * @param string $type
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getReportsByType(string $type)
    {
        return Report::with(['user', 'stockMovement.article', 'supplier', 'orderLine'])
            ->where('type', $type)
            ->orderBy('report_date', 'desc')
            ->get();
    }

    /**
     * Get reports for a specific article
     *
     * @param int $articleId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getReportsByArticle(int $articleId)
    {
        return Report::with(['user', 'stockMovement.article', 'supplier', 'orderLine'])
            ->whereHas('stockMovement', function ($query) use ($articleId) {
                $query->where('article_id', $articleId);
            })
            ->orderBy('report_date', 'desc')
            ->get();
    }

    /**
     * Get a specific report
     *
     * @param int $reportId
     * @return Report
     */
    public function getReport(int $reportId): Report
    {
        return Report::with(['user', 'stockMovement.article', 'supplier', 'orderLine'])
            ->findOrFail($reportId);
    }

    /**
     * Generate a report ticket
     *
     * @param Report $report
     * @return array
     */
    public function generateReportTicket(Report $report): array
    {
        $stockMovement = $report->stockMovement;
        $article = $stockMovement->article;

        $ticket = [
            'report_id' => $report->id,
            'report_type' => $report->type,
            'report_date' => $report->report_date,
            'details' => $report->details,
            'user' => $report->user ? [
                'id' => $report->user->id,
                'name' => $report->user->name,
            ] : null,
            'article' => [
                'id' => $article->id,
                'barcode' => $article->barcode,
                'name' => $article->name,
                'price' => $article->price,
                'category' => $article->category?->name,
            ],
            'movement' => [
                'type' => $stockMovement->type,
                'quantity' => $stockMovement->quantity,
                'date' => $stockMovement->date,
                'reason' => $stockMovement->reason,
            ],
            'supplier' => $report->supplier ? [
                'id' => $report->supplier->id,
                'name' => $report->supplier->name,
                'address' => $report->supplier->address,
                'phone' => $report->supplier->phone,
                'email' => $report->supplier->email,
            ] : null,
            'order_line' => $report->orderLine ? [
                'id' => $report->orderLine->id,
                'quantity' => $report->orderLine->quantity,
                'price' => $report->orderLine->price,
            ] : null,
        ];

        return $ticket;
    }
}
