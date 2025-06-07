<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Services\ReportService;
use App\Services\SalesAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    protected $reportService;
    protected $salesAnalyticsService;

    public function __construct(ReportService $reportService, SalesAnalyticsService $salesAnalyticsService)
    {
        $this->reportService = $reportService;
        $this->salesAnalyticsService = $salesAnalyticsService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->query('type');
        $articleId = $request->query('article_id');

        if ($type) {
            $reports = $this->reportService->getReportsByType($type);
        } elseif ($articleId) {
            $reports = $this->reportService->getReportsByArticle($articleId);
        } else {
            $reports = $this->reportService->getAllReports();
        }

        return response()->json([
            'data' => $reports
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $report = $this->reportService->getReport($id);

            return response()->json([
                'data' => $report
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Report not found'
            ], 404);
        }
    }

    /**
     * Generate a ticket for a report.
     */
    public function generateTicket($id)
    {
        try {
            $report = $this->reportService->getReport($id);
            $ticket = $this->reportService->generateReportTicket($report);

            return response()->json([
                'data' => $ticket
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Report not found'
            ], 404);
        }
    }

    /**
     * Get reports by type.
     */
    public function getByType($type)
    {
        $validator = Validator::make(['type' => $type], [
            'type' => 'required|in:supply,sale'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid report type',
                'errors' => $validator->errors()
            ], 422);
        }

        $reports = $this->reportService->getReportsByType($type);

        return response()->json([
            'data' => $reports
        ]);
    }

    /**
     * Get reports for a specific article.
     */
    public function getByArticle($articleId)
    {
        $reports = $this->reportService->getReportsByArticle($articleId);

        return response()->json([
            'data' => $reports
        ]);
    }

    /**
     * Get sales reports with date range filtering
     */
    public function getSalesReports(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $reports = $this->reportService->getSalesReportsByDateRange($startDate, $endDate);

        return response()->json([
            'data' => $reports
        ]);
    }

    /**
     * Get sales summary with analytics
     */
    public function getSalesSummary(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $summary = $this->reportService->getSalesSummary($startDate, $endDate);

        return response()->json([
            'data' => $summary
        ]);
    }

    /**
     * Get comprehensive sales analytics
     */
    public function getSalesAnalytics(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $analytics = $this->salesAnalyticsService->getSalesAnalytics($startDate, $endDate);

        return response()->json([
            'data' => $analytics
        ]);
    }

    /**
     * Get daily sales data for charts
     */
    public function getDailySalesData(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $dailySales = $this->salesAnalyticsService->getDailySalesData($startDate, $endDate);

        return response()->json([
            'data' => $dailySales
        ]);
    }

    /**
     * Get top selling products
     */
    public function getTopSellingProducts(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $limit = $request->query('limit', 10);

        // Get order lines for the date range
        $orderLines = \App\Models\OrderLine::with(['order', 'article.category'])
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                if ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('created_at', '<=', $endDate);
                }
            })->get();

        $topProducts = $this->salesAnalyticsService->getTopSellingProducts($orderLines, $limit);

        return response()->json([
            'data' => $topProducts
        ]);
    }

    /**
     * Get detailed sales report for a specific item
     */
    public function getItemSalesReport($articleId, Request $request)
    {
        $validator = Validator::make(array_merge($request->all(), ['article_id' => $articleId]), [
            'article_id' => 'required|exists:articles,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');

            $itemReport = $this->salesAnalyticsService->getItemSalesReport($articleId, $startDate, $endDate);

            return response()->json([
                'data' => $itemReport
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating item sales report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
