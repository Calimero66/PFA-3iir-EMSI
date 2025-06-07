<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Article;
use App\Models\Report;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesAnalyticsService
{
    /**
     * Get comprehensive sales analytics for a date range
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getSalesAnalytics(?string $startDate = null, ?string $endDate = null): array
    {
        $query = OrderLine::with(['order', 'article.category'])
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                if ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('created_at', '<=', $endDate);
                }
            });

        $orderLines = $query->get();

        return [
            'overview' => $this->calculateOverviewMetrics($orderLines),
            'daily_sales' => $this->getDailySalesData($startDate, $endDate),
            'top_products' => $this->getTopSellingProducts($orderLines),
            'category_performance' => $this->getCategoryPerformance($orderLines),
            'sales_trends' => $this->getSalesTrends($startDate, $endDate),
        ];
    }

    /**
     * Calculate overview metrics
     *
     * @param \Illuminate\Database\Eloquent\Collection $orderLines
     * @return array
     */
    private function calculateOverviewMetrics($orderLines): array
    {
        $totalRevenue = $orderLines->sum('line_total');
        $totalQuantity = $orderLines->sum('quantity');
        $uniqueOrders = $orderLines->pluck('order_id')->unique()->count();
        $uniqueProducts = $orderLines->pluck('article_id')->unique()->count();

        return [
            'total_revenue' => round($totalRevenue, 2),
            'total_quantity_sold' => $totalQuantity,
            'total_orders' => $uniqueOrders,
            'unique_products_sold' => $uniqueProducts,
            'average_order_value' => $uniqueOrders > 0 ? round($totalRevenue / $uniqueOrders, 2) : 0,
            'average_items_per_order' => $uniqueOrders > 0 ? round($totalQuantity / $uniqueOrders, 2) : 0,
        ];
    }

    /**
     * Get daily sales data for charts
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getDailySalesData(?string $startDate = null, ?string $endDate = null): array
    {
        $start = $startDate ? Carbon::parse($startDate) : Carbon::now()->subDays(30);
        $end = $endDate ? Carbon::parse($endDate) : Carbon::now();

        $dailySales = OrderLine::select(
                DB::raw('DATE(orders.created_at) as sale_date'),
                DB::raw('SUM(order_lines.line_total) as daily_revenue'),
                DB::raw('SUM(order_lines.quantity) as daily_quantity'),
                DB::raw('COUNT(DISTINCT order_lines.order_id) as daily_orders')
            )
            ->join('orders', 'order_lines.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy(DB::raw('DATE(orders.created_at)'))
            ->orderBy('sale_date')
            ->get();

        return $dailySales->map(function ($item) {
            return [
                'date' => $item->sale_date,
                'revenue' => round($item->daily_revenue, 2),
                'quantity' => $item->daily_quantity,
                'orders' => $item->daily_orders,
            ];
        })->toArray();
    }

    /**
     * Get top selling products
     *
     * @param \Illuminate\Database\Eloquent\Collection $orderLines
     * @param int $limit
     * @return array
     */
    public function getTopSellingProducts($orderLines, int $limit = 10): array
    {
        $productSales = [];

        foreach ($orderLines as $orderLine) {
            $articleId = $orderLine->article_id;
            $article = $orderLine->article;

            if (!isset($productSales[$articleId])) {
                $productSales[$articleId] = [
                    'article_id' => $articleId,
                    'name' => $article->name,
                    'barcode' => $article->barcode,
                    'category' => $article->category?->name ?? 'Uncategorized',
                    'total_quantity' => 0,
                    'total_revenue' => 0,
                    'times_sold' => 0,
                    'average_price' => 0,
                ];
            }

            $productSales[$articleId]['total_quantity'] += $orderLine->quantity;
            $productSales[$articleId]['total_revenue'] += $orderLine->line_total;
            $productSales[$articleId]['times_sold']++;
        }

        // Calculate average price and sort by revenue
        foreach ($productSales as &$product) {
            $product['total_revenue'] = round($product['total_revenue'], 2);
            $product['average_price'] = $product['total_quantity'] > 0 
                ? round($product['total_revenue'] / $product['total_quantity'], 2) 
                : 0;
        }

        uasort($productSales, function($a, $b) {
            return $b['total_revenue'] <=> $a['total_revenue'];
        });

        return array_slice(array_values($productSales), 0, $limit);
    }

    /**
     * Get category performance data
     *
     * @param \Illuminate\Database\Eloquent\Collection $orderLines
     * @return array
     */
    public function getCategoryPerformance($orderLines): array
    {
        $categoryData = [];

        foreach ($orderLines as $orderLine) {
            $categoryName = $orderLine->article->category?->name ?? 'Uncategorized';

            if (!isset($categoryData[$categoryName])) {
                $categoryData[$categoryName] = [
                    'category_name' => $categoryName,
                    'total_quantity' => 0,
                    'total_revenue' => 0,
                    'unique_products' => [],
                    'orders_count' => [],
                ];
            }

            $categoryData[$categoryName]['total_quantity'] += $orderLine->quantity;
            $categoryData[$categoryName]['total_revenue'] += $orderLine->line_total;
            $categoryData[$categoryName]['unique_products'][$orderLine->article_id] = true;
            $categoryData[$categoryName]['orders_count'][$orderLine->order_id] = true;
        }

        // Process final data
        foreach ($categoryData as &$category) {
            $category['total_revenue'] = round($category['total_revenue'], 2);
            $category['unique_products_count'] = count($category['unique_products']);
            $category['orders_count'] = count($category['orders_count']);
            unset($category['unique_products'], $category['orders_count']);
        }

        // Sort by revenue
        uasort($categoryData, function($a, $b) {
            return $b['total_revenue'] <=> $a['total_revenue'];
        });

        return array_values($categoryData);
    }

    /**
     * Get sales trends (weekly/monthly comparison)
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getSalesTrends(?string $startDate = null, ?string $endDate = null): array
    {
        $end = $endDate ? Carbon::parse($endDate) : Carbon::now();
        $start = $startDate ? Carbon::parse($startDate) : $end->copy()->subDays(30);

        // Get current period data
        $currentPeriod = $this->getPeriodSalesData($start, $end);
        
        // Get previous period for comparison (same duration)
        $periodDuration = $end->diffInDays($start);
        $previousStart = $start->copy()->subDays($periodDuration + 1);
        $previousEnd = $start->copy()->subDay();
        $previousPeriod = $this->getPeriodSalesData($previousStart, $previousEnd);

        return [
            'current_period' => $currentPeriod,
            'previous_period' => $previousPeriod,
            'growth_metrics' => $this->calculateGrowthMetrics($currentPeriod, $previousPeriod),
        ];
    }

    /**
     * Get sales data for a specific period
     *
     * @param Carbon $start
     * @param Carbon $end
     * @return array
     */
    private function getPeriodSalesData(Carbon $start, Carbon $end): array
    {
        $data = OrderLine::select(
                DB::raw('SUM(line_total) as total_revenue'),
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT order_id) as total_orders')
            )
            ->join('orders', 'order_lines.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->first();

        return [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'total_revenue' => round($data->total_revenue ?? 0, 2),
            'total_quantity' => $data->total_quantity ?? 0,
            'total_orders' => $data->total_orders ?? 0,
        ];
    }

    /**
     * Calculate growth metrics between periods
     *
     * @param array $current
     * @param array $previous
     * @return array
     */
    private function calculateGrowthMetrics(array $current, array $previous): array
    {
        $revenueGrowth = $previous['total_revenue'] > 0 
            ? (($current['total_revenue'] - $previous['total_revenue']) / $previous['total_revenue']) * 100 
            : 0;

        $quantityGrowth = $previous['total_quantity'] > 0 
            ? (($current['total_quantity'] - $previous['total_quantity']) / $previous['total_quantity']) * 100 
            : 0;

        $ordersGrowth = $previous['total_orders'] > 0 
            ? (($current['total_orders'] - $previous['total_orders']) / $previous['total_orders']) * 100 
            : 0;

        return [
            'revenue_growth_percentage' => round($revenueGrowth, 2),
            'quantity_growth_percentage' => round($quantityGrowth, 2),
            'orders_growth_percentage' => round($ordersGrowth, 2),
        ];
    }

    /**
     * Get item-level sales report with detailed breakdown
     *
     * @param int $articleId
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getItemSalesReport(int $articleId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = OrderLine::with(['order', 'article.category'])
            ->where('article_id', $articleId)
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                if ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('created_at', '<=', $endDate);
                }
            });

        $orderLines = $query->orderBy('created_at', 'desc')->get();
        $article = Article::with('category')->find($articleId);

        if (!$article) {
            throw new \Exception('Article not found');
        }

        $totalQuantity = $orderLines->sum('quantity');
        $totalRevenue = $orderLines->sum('line_total');
        $totalOrders = $orderLines->pluck('order_id')->unique()->count();

        return [
            'article' => [
                'id' => $article->id,
                'name' => $article->name,
                'barcode' => $article->barcode,
                'current_price' => $article->price,
                'category' => $article->category?->name ?? 'Uncategorized',
                'current_stock' => $article->quantity,
            ],
            'sales_summary' => [
                'total_quantity_sold' => $totalQuantity,
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $totalOrders,
                'average_price' => $totalQuantity > 0 ? round($totalRevenue / $totalQuantity, 2) : 0,
                'average_quantity_per_order' => $totalOrders > 0 ? round($totalQuantity / $totalOrders, 2) : 0,
            ],
            'sales_history' => $orderLines->map(function ($orderLine) {
                return [
                    'order_id' => $orderLine->order_id,
                    'sale_date' => $orderLine->order->created_at->toDateTimeString(),
                    'quantity' => $orderLine->quantity,
                    'unit_price' => $orderLine->unit_price,
                    'line_total' => $orderLine->line_total,
                ];
            })->toArray(),
        ];
    }
}
