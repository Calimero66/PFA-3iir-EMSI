<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
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
}
