<?php

namespace App\Services;

use App\Models\Report;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Supplier;
use App\Models\OrderLine;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            // Try to get user ID from data first (explicit passing takes precedence)
            $userId = isset($data['user_id']) ? (int) $data['user_id'] : null;

            // If not provided in data, try to get from authenticated user
            if (!$userId) {
                $userId = Auth::id();
                Log::info('ReportService: Using authenticated user ID: ' . ($userId ?? 'null'));
            } else {
                Log::info('ReportService: Using provided user ID: ' . $userId);
            }

            // If still no user ID, try to get the first user as a fallback
            if (!$userId) {
                $user = User::first();
                $userId = $user ? (int) $user->id : null;
                Log::info('ReportService: Using fallback user ID: ' . ($userId ?? 'null'));
            }

            $reportData = [
                'type' => $stockMovement->type === 'in' ? 'supply' : 'sale',
                'report_date' => $data['report_date'] ?? now(),
                'user_id' => $userId,
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
                'unit_price' => $report->orderLine->unit_price,
                'line_total' => $report->orderLine->line_total,
            ] : null,
        ];

        return $ticket;
    }

    /**
     * Get sales reports with date range filtering
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getSalesReportsByDateRange(?string $startDate = null, ?string $endDate = null)
    {
        $query = Report::with(['user', 'stockMovement.article.category', 'supplier', 'orderLine.order'])
            ->where('type', 'sale')
            ->orderBy('report_date', 'desc');

        if ($startDate) {
            $query->where('report_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('report_date', '<=', $endDate);
        }

        return $query->get();
    }

    /**
     * Get detailed sales summary for a date range
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getSalesSummary(?string $startDate = null, ?string $endDate = null): array
    {
        $salesReports = $this->getSalesReportsByDateRange($startDate, $endDate);

        $totalRevenue = 0;
        $totalQuantitySold = 0;
        $totalOrders = 0;
        $itemsSold = [];
        $categorySales = [];
        $orderIds = [];

        foreach ($salesReports as $report) {
            if ($report->orderLine) {
                $orderLine = $report->orderLine;
                $article = $report->stockMovement->article;

                // Track unique orders
                if (!in_array($orderLine->order_id, $orderIds)) {
                    $orderIds[] = $orderLine->order_id;
                    $totalOrders++;
                }

                // Revenue and quantity
                $totalRevenue += $orderLine->line_total;
                $totalQuantitySold += $orderLine->quantity;

                // Items sold tracking
                $articleId = $article->id;
                if (!isset($itemsSold[$articleId])) {
                    $itemsSold[$articleId] = [
                        'article_id' => $articleId,
                        'article_name' => $article->name,
                        'article_barcode' => $article->barcode,
                        'category' => $article->category?->name ?? 'Uncategorized',
                        'total_quantity' => 0,
                        'total_revenue' => 0,
                        'unit_price' => $orderLine->unit_price,
                    ];
                }

                $itemsSold[$articleId]['total_quantity'] += $orderLine->quantity;
                $itemsSold[$articleId]['total_revenue'] += $orderLine->line_total;

                // Category sales tracking
                $categoryName = $article->category?->name ?? 'Uncategorized';
                if (!isset($categorySales[$categoryName])) {
                    $categorySales[$categoryName] = [
                        'category_name' => $categoryName,
                        'total_quantity' => 0,
                        'total_revenue' => 0,
                        'items_count' => 0,
                    ];
                }

                $categorySales[$categoryName]['total_quantity'] += $orderLine->quantity;
                $categorySales[$categoryName]['total_revenue'] += $orderLine->line_total;
                $categorySales[$categoryName]['items_count']++;
            }
        }

        // Sort items by revenue (top sellers)
        uasort($itemsSold, function($a, $b) {
            return $b['total_revenue'] <=> $a['total_revenue'];
        });

        // Sort categories by revenue
        uasort($categorySales, function($a, $b) {
            return $b['total_revenue'] <=> $a['total_revenue'];
        });

        return [
            'summary' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_quantity_sold' => $totalQuantitySold,
                'total_orders' => $totalOrders,
                'average_order_value' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ],
            'items_sold' => array_values($itemsSold),
            'category_sales' => array_values($categorySales),
            'top_selling_items' => array_slice(array_values($itemsSold), 0, 10),
        ];
    }
}
