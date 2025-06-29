<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Article;
use App\Models\OrderLine;
use App\Models\StockSupply;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Report;
use App\Services\StockService;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    protected $stockService;
    protected $reportService;

    public function __construct(StockService $stockService, ReportService $reportService)
    {
        $this->stockService = $stockService;
        $this->reportService = $reportService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $orders = Order::with(['orderLines.article', 'user'])
                ->withCount('orderLines')
                ->get()
                ->map(function ($order) {
                    // Calculate total items count (sum of all quantities)
                    $totalItems = $order->orderLines->sum('quantity');

                    return [
                        'id' => $order->id,
                        'user' => $order->user ? $order->user->name : 'Unknown',
                        'total_amount' => $order->total_amount,
                        'total_items' => $totalItems,
                        'number_of_different_articles' => $order->order_lines_count,
                        'created_at' => $order->created_at,
                        'order_lines' => $order->orderLines->map(function ($line) {
                            return [
                                'id' => $line->id,
                                'article_name' => $line->article->name,
                                'quantity' => $line->quantity,
                                'unit_price' => $line->unit_price,
                                'line_total' => $line->line_total,
                            ];
                        })
                    ];
                });

            return response()->json([
                'message' => 'Orders retrieved successfully',
                'data' => $orders
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving orders: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.article_id' => 'required|exists:articles,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check stock availability for all items before proceeding
            $itemsData = [];
            $totalAmount = 0;
            
            foreach ($request->items as $item) {
                $article = Article::findOrFail($item['article_id']);
                $stockSupply = StockSupply::where('article_id', $article->id)->first();
                
                if (!$stockSupply || $stockSupply->quantity < $item['quantity']) {
                    return response()->json([
                        'message' => 'Out of stock for article: ' . $article->name,
                        'article_id' => $article->id,
                        'available_quantity' => $stockSupply ? $stockSupply->quantity : 0,
                        'requested_quantity' => $item['quantity']
                    ], 400);
                }
                
                $lineTotal = $article->price * $item['quantity'];
                $totalAmount += $lineTotal;
                
                $itemsData[] = [
                    'article' => $article,
                    'quantity' => $item['quantity'],
                    'stockSupply' => $stockSupply,
                    'unit_price' => $article->price,
                    'line_total' => $lineTotal
                ];
            }
            
            // Process the order within a transaction
            return DB::transaction(function () use ($request, $itemsData, $totalAmount) {
                // Get the authenticated user
                $user = auth()->user();

                if ($user) {
                    $userId = $user->id;
                    Log::info('OrderController: Using authenticated user ID: ' . $userId);
                } else {
                    // Use a default user as fallback
                    $user = User::first();
                    $userId = $user ? $user->id : null;
                    Log::info('OrderController: Using fallback user ID: ' . ($userId ?? 'null'));
                }

                // Create the parent order - remove supplier_id
                $order = Order::create([
                    'user_id' => $userId,
                    'total_amount' => $totalAmount,
                ]);
                
                $orderLines = [];
                $stockMovements = [];
                
                // Process each ordered item
                foreach ($itemsData as $itemData) {
                    $article = $itemData['article'];
                    $quantity = $itemData['quantity'];
                    $stockSupply = $itemData['stockSupply'];
                    
                    // Create order line
                    $orderLine = OrderLine::create([
                        'order_id' => $order->id,
                        'article_id' => $article->id,
                        'quantity' => $quantity,
                        'unit_price' => $itemData['unit_price'],
                        'line_total' => $itemData['line_total'],
                    ]);
                    
                    // Update stock quantity
                    $stockSupply->quantity -= $quantity;
                    $stockSupply->save();
                    
                    // Create stock movement record
                    $stockMovement = StockMovement::create([
                        'article_id' => $article->id,
                        'type' => 'out',
                        'quantity' => $quantity,
                        'date' => now(),
                        'reason' => $request->notes ?? "Sale of article {$article->name}",
                    ]);
                    
                    // Create report for this movement
                    $reportData = [
                        'user_id' => $userId,
                        'order_line_id' => $orderLine->id, // Link the report to the specific order line
                        'details' => $request->notes ?? "Sale of article {$article->name} (Barcode: {$article->barcode})",
                    ];

                    $this->reportService->createStockMovementReport($stockMovement, $reportData);
                    
                    $orderLines[] = $orderLine;
                    $stockMovements[] = $stockMovement;
                }
                
                // Load the complete order with all related data
                $completeOrder = Order::with(['orderLines.article'])->find($order->id);
                
                return response()->json([
                    'message' => 'Sale completed successfully',
                    'data' => [
                        'order' => $completeOrder,
                        'total_amount' => $totalAmount,
                        'stock_movements' => $stockMovements
                    ]
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error('Error processing order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to process sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        //
    }

    /**
     * Debug endpoint to check stock movements and reports for an order
     */
    // public function debugStockMovements($orderId)
    // {
    //     $order = Order::with(['orderLines.article'])->find($orderId);

    //     if (!$order) {
    //         return response()->json(['message' => 'Order not found'], 404);
    //     }

    //     $debug_info = [];

    //     // Get reports linked to order lines
    //     $orderLineReports = Report::whereIn('order_line_id', $order->orderLines->pluck('id'))->get();

    //     // Get reports linked to stock movements for this order's articles
    //     $articleIds = $order->orderLines->pluck('article_id')->toArray();
    //     $stockMovementReports = Report::whereHas('stockMovement', function($query) use ($articleIds, $order) {
    //         $query->whereIn('article_id', $articleIds)
    //               ->where('created_at', '>=', $order->created_at->subMinutes(5))
    //               ->where('created_at', '<=', $order->created_at->addMinutes(5));
    //     })->with('stockMovement')->get();

    //     foreach ($order->orderLines as $orderLine) {
    //         $allMovements = StockMovement::where('article_id', $orderLine->article_id)
    //             ->orderBy('created_at', 'desc')
    //             ->get();

    //         $debug_info[] = [
    //             'order_line_id' => $orderLine->id,
    //             'article_id' => $orderLine->article_id,
    //             'article_name' => $orderLine->article->name,
    //             'order_quantity' => $orderLine->quantity,
    //             'order_created_at' => $order->created_at,
    //             'all_stock_movements' => $allMovements->map(function($movement) use ($order) {
    //                 return [
    //                     'id' => $movement->id,
    //                     'type' => $movement->type,
    //                     'quantity' => $movement->quantity,
    //                     'created_at' => $movement->created_at,
    //                     'reason' => $movement->reason,
    //                     'time_diff_from_order' => $movement->created_at->diffInSeconds($order->created_at) . ' seconds'
    //                 ];
    //             })
    //         ];
    //     }

    //     return response()->json([
    //         'order_id' => $orderId,
    //         'order_created_at' => $order->created_at,
    //         'debug_info' => $debug_info,
    //         'reports_linked_to_order_lines' => $orderLineReports->map(function($report) {
    //             return [
    //                 'id' => $report->id,
    //                 'type' => $report->type,
    //                 'order_line_id' => $report->order_line_id,
    //                 'stock_movement_id' => $report->stock_movement_id,
    //                 'details' => $report->details,
    //                 'created_at' => $report->created_at
    //             ];
    //         }),
    //         'reports_linked_to_stock_movements' => $stockMovementReports->map(function($report) {
    //             return [
    //                 'id' => $report->id,
    //                 'type' => $report->type,
    //                 'stock_movement_id' => $report->stock_movement_id,
    //                 'stock_movement_article_id' => $report->stockMovement->article_id ?? null,
    //                 'details' => $report->details,
    //                 'created_at' => $report->created_at
    //             ];
    //         }),
    //         'total_reports_found' => $orderLineReports->count() + $stockMovementReports->count()
    //     ]);
    // }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        try {
            return DB::transaction(function () use ($order) {
                // Load the order with its order lines and articles
                $orderWithLines = Order::with(['orderLines.article'])->find($order->id);

                if (!$orderWithLines) {
                    return response()->json([
                        'message' => 'Order not found'
                    ], 404);
                }

                $restoredItems = [];
                $failedRestorations = [];
                $deletedReports = [];

                Log::info("Starting deletion of Order #{$order->id}");

                // Delete ALL related reports for this order
                // 1. Delete reports linked to order lines
                foreach ($orderWithLines->orderLines as $orderLine) {
                    $reports = Report::where('order_line_id', $orderLine->id)->get();
                    foreach ($reports as $report) {
                        $deletedReports[] = [
                            'report_id' => $report->id,
                            'order_line_id' => $orderLine->id,
                            'type' => $report->type,
                            'details' => $report->details,
                            'deletion_reason' => 'Linked to order line'
                        ];
                        $report->delete();
                        Log::info("Deleted report #{$report->id} for order line #{$orderLine->id}");
                    }
                }

                // 2. Delete reports linked to stock movements for this order's articles
                $articleIds = $orderWithLines->orderLines->pluck('article_id')->toArray();
                $stockMovementReports = Report::whereHas('stockMovement', function($query) use ($articleIds, $orderWithLines) {
                    $query->whereIn('article_id', $articleIds)
                        ->where('type', 'out')
                        ->where('created_at', '>=', $orderWithLines->created_at->subMinutes(5))
                        ->where('created_at', '<=', $orderWithLines->created_at->addMinutes(5));
                })->get();

                foreach ($stockMovementReports as $report) {
                    // Avoid deleting the same report twice
                    if (!in_array($report->id, array_column($deletedReports, 'report_id'))) {
                        $deletedReports[] = [
                            'report_id' => $report->id,
                            'stock_movement_id' => $report->stock_movement_id,
                            'type' => $report->type,
                            'details' => $report->details,
                            'deletion_reason' => 'Linked to stock movement'
                        ];
                        $report->delete();
                        Log::info("Deleted report #{$report->id} linked to stock movement #{$report->stock_movement_id}");
                    }
                }

                // Find and delete stock movements related to this order
                Log::info("Looking for stock movements to delete for order #{$orderWithLines->id}");

                foreach ($orderWithLines->orderLines as $orderLine) {
                    Log::info("Searching stock movements for article #{$orderLine->article_id}, quantity: {$orderLine->quantity}");

                    // First, let's see all stock movements for this article
                    $allMovements = StockMovement::where('article_id', $orderLine->article_id)
                        ->where('type', 'out')
                        ->orderBy('created_at', 'desc')
                        ->get();

                    Log::info("Found " . count($allMovements) . " 'out' movements for article #{$orderLine->article_id}");

                    // Try to find movements with exact quantity match first
                    $exactMatches = $allMovements->where('quantity', $orderLine->quantity);

                    if ($exactMatches->isNotEmpty()) {
                        // Find the one closest to order creation time
                        $bestMatch = $exactMatches->sortBy(function($movement) use ($orderWithLines) {
                            return abs($movement->created_at->diffInSeconds($orderWithLines->created_at));
                        })->first();

                        // First, delete any reports linked to this stock movement
                        $reportsToDelete = Report::where('stock_movement_id', $bestMatch->id)->get();
                        foreach ($reportsToDelete as $report) {
                            Log::info("Deleting report #{$report->id} linked to stock movement #{$bestMatch->id}");
                            $report->delete();
                        }

                        $deletedStockMovements[] = [
                            'stock_movement_id' => $bestMatch->id,
                            'article_id' => $bestMatch->article_id,
                            'type' => $bestMatch->type,
                            'quantity' => $bestMatch->quantity,
                            'date' => $bestMatch->date,
                            'reason' => $bestMatch->reason,
                            'created_at' => $bestMatch->created_at,
                            'order_created_at' => $orderWithLines->created_at,
                            'time_diff_seconds' => $bestMatch->created_at->diffInSeconds($orderWithLines->created_at),
                            'deleted_reports_count' => count($reportsToDelete)
                        ];

                        // Now delete the stock movement
                        $bestMatch->delete();
                        Log::info("Deleted stock movement #{$bestMatch->id} for article #{$bestMatch->article_id} (quantity: {$bestMatch->quantity}) and {$reportsToDelete->count()} related reports");
                    } else {
                        Log::warning("No matching stock movement found for article #{$orderLine->article_id} with quantity {$orderLine->quantity}");

                        // Log all movements for debugging
                        foreach ($allMovements as $movement) {
                            Log::info("Available movement: ID #{$movement->id}, quantity: {$movement->quantity}, created: {$movement->created_at}");
                        }
                    }
                }

                // Restore stock quantities for each order line
                foreach ($orderWithLines->orderLines as $orderLine) {
                    $article = $orderLine->article;

                    try {
                        // Find the stock supply for this article
                        $stockSupply = StockSupply::where('article_id', $article->id)->first();

                        if ($stockSupply) {
                            $oldQuantity = $stockSupply->quantity;

                            // Add back the quantity that was sold
                            $stockSupply->quantity += $orderLine->quantity;
                            $stockSupply->save();

                            // Note: Original stock movement will be deleted, no new movement created

                            $restoredItems[] = [
                                'article_name' => $article->name,
                                'article_id' => $article->id,
                                'quantity_restored' => $orderLine->quantity,
                                'old_stock' => $oldQuantity,
                                'new_stock' => $stockSupply->quantity
                            ];

                            Log::info("Successfully restored {$orderLine->quantity} units of {$article->name} to stock (from {$oldQuantity} to {$stockSupply->quantity})");
                        } else {
                            $failedRestorations[] = [
                                'article_name' => $article->name,
                                'article_id' => $article->id,
                                'quantity_to_restore' => $orderLine->quantity,
                                'reason' => 'No stock supply record found'
                            ];

                            Log::warning("Could not restore stock for {$article->name} (ID: {$article->id}) - No stock supply record found");
                        }
                    } catch (\Exception $e) {
                        $failedRestorations[] = [
                            'article_name' => $article->name,
                            'article_id' => $article->id,
                            'quantity_to_restore' => $orderLine->quantity,
                            'reason' => $e->getMessage()
                        ];

                        Log::error("Failed to restore stock for {$article->name} (ID: {$article->id}): " . $e->getMessage());
                    }
                }

                // Delete the order (this will cascade delete order lines due to foreign key constraints)
                $orderWithLines->delete();

                Log::info("Order #{$order->id} deleted successfully");

                $response = [
                    'message' => 'Order deleted successfully',
                    'deleted_order_id' => $order->id,
                    'restored_items' => $restoredItems,
                    'deleted_reports' => $deletedReports,
                    'deleted_reports_count' => count($deletedReports)
                ];

                if (!empty($failedRestorations)) {
                    $response['message'] = 'Order deleted, but some stock quantities could not be restored';
                    $response['failed_restorations'] = $failedRestorations;
                    Log::warning("Order #{$order->id} deleted but some stock restorations failed", $failedRestorations);
                }

                return response()->json($response, 200);
            });
        } catch (\Exception $e) {
            Log::error('Error deleting order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple orders and restore stock quantities
     */
    public function destroyMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'required|integer|exists:orders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $deletedOrders = [];
                $restoredItems = [];
                $deletedReports = [];
                $deletedStockMovements = [];

                foreach ($request->order_ids as $orderId) {
                    $order = Order::with(['orderLines.article'])->find($orderId);

                    if (!$order) {
                        continue; // Skip if order not found
                    }

                    // Delete ALL related reports for this order
                    // 1. Delete reports linked to order lines
                    foreach ($order->orderLines as $orderLine) {
                        $reports = Report::where('order_line_id', $orderLine->id)->get();
                        foreach ($reports as $report) {
                            $deletedReports[] = [
                                'report_id' => $report->id,
                                'order_line_id' => $orderLine->id,
                                'order_id' => $orderId,
                                'type' => $report->type,
                                'details' => $report->details,
                                'deletion_reason' => 'Linked to order line'
                            ];
                            $report->delete();
                            Log::info("Deleted report #{$report->id} for order line #{$orderLine->id} in order #{$orderId}");
                        }
                    }

                    // 2. Delete reports linked to stock movements for this order's articles
                    $articleIds = $order->orderLines->pluck('article_id')->toArray();
                    $stockMovementReports = Report::whereHas('stockMovement', function($query) use ($articleIds, $order) {
                        $query->whereIn('article_id', $articleIds)
                              ->where('type', 'out')
                              ->where('created_at', '>=', $order->created_at->subMinutes(5))
                              ->where('created_at', '<=', $order->created_at->addMinutes(5));
                    })->get();

                    foreach ($stockMovementReports as $report) {
                        // Avoid deleting the same report twice
                        if (!in_array($report->id, array_column($deletedReports, 'report_id'))) {
                            $deletedReports[] = [
                                'report_id' => $report->id,
                                'stock_movement_id' => $report->stock_movement_id,
                                'order_id' => $orderId,
                                'type' => $report->type,
                                'details' => $report->details,
                                'deletion_reason' => 'Linked to stock movement'
                            ];
                            $report->delete();
                            Log::info("Deleted report #{$report->id} linked to stock movement #{$report->stock_movement_id} in order #{$orderId}");
                        }
                    }

                    // Find and delete stock movements related to this order
                    Log::info("Looking for stock movements to delete for order #{$orderId}");

                    foreach ($order->orderLines as $orderLine) {
                        // Find all 'out' movements for this article
                        $allMovements = StockMovement::where('article_id', $orderLine->article_id)
                            ->where('type', 'out')
                            ->orderBy('created_at', 'desc')
                            ->get();

                        // Try to find movements with exact quantity match
                        $exactMatches = $allMovements->where('quantity', $orderLine->quantity);

                        if ($exactMatches->isNotEmpty()) {
                            // Find the one closest to order creation time
                            $bestMatch = $exactMatches->sortBy(function($movement) use ($order) {
                                return abs($movement->created_at->diffInSeconds($order->created_at));
                            })->first();

                            // First, delete any reports linked to this stock movement
                            $reportsToDelete = Report::where('stock_movement_id', $bestMatch->id)->get();
                            foreach ($reportsToDelete as $report) {
                                Log::info("Deleting report #{$report->id} linked to stock movement #{$bestMatch->id} in order #{$orderId}");
                                $report->delete();
                            }

                            $deletedStockMovements[] = [
                                'stock_movement_id' => $bestMatch->id,
                                'article_id' => $bestMatch->article_id,
                                'order_id' => $orderId,
                                'type' => $bestMatch->type,
                                'quantity' => $bestMatch->quantity,
                                'date' => $bestMatch->date,
                                'reason' => $bestMatch->reason,
                                'deleted_reports_count' => count($reportsToDelete)
                            ];

                            // Now delete the stock movement
                            $bestMatch->delete();
                            Log::info("Deleted stock movement #{$bestMatch->id} for article #{$bestMatch->article_id} in order #{$orderId} and {$reportsToDelete->count()} related reports");
                        } else {
                            Log::warning("No matching stock movement found for article #{$orderLine->article_id} with quantity {$orderLine->quantity} in order #{$orderId}");
                        }
                    }

                    // Restore stock quantities for each order line
                    foreach ($order->orderLines as $orderLine) {
                        $article = $orderLine->article;

                        // Find the stock supply for this article
                        $stockSupply = StockSupply::where('article_id', $article->id)->first();

                        if ($stockSupply) {
                            // Add back the quantity that was sold
                            $stockSupply->quantity += $orderLine->quantity;
                            $stockSupply->save();

                            // Note: Original stock movement will be deleted, no new movement created

                            $restoredItems[] = [
                                'article_name' => $article->name,
                                'quantity_restored' => $orderLine->quantity
                            ];
                        }
                    }

                    // Delete the order
                    $order->delete();
                    $deletedOrders[] = $orderId;
                }

                return response()->json([
                    'message' => 'Orders deleted successfully and stock quantities restored',
                    'deleted_orders' => $deletedOrders,
                    'restored_items' => $restoredItems,
                    'deleted_reports' => $deletedReports,
                    'deleted_reports_count' => count($deletedReports),
                    'deleted_stock_movements' => $deletedStockMovements,
                    'deleted_stock_movements_count' => count($deletedStockMovements)
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error('Error deleting multiple orders: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test the delete functionality - for debugging purposes
     */
    public function testDelete($orderId)
    {
        try {
            // Get order details before deletion
            $order = Order::with(['orderLines.article'])->find($orderId);

            if (!$order) {
                return response()->json([
                    'message' => 'Order not found'
                ], 404);
            }

            $beforeDeletion = [
                'order_id' => $order->id,
                'total_amount' => $order->total_amount,
                'order_lines_count' => $order->orderLines->count(),
                'order_lines' => $order->orderLines->map(function ($line) {
                    $stockSupply = StockSupply::where('article_id', $line->article_id)->first();
                    return [
                        'article_id' => $line->article_id,
                        'article_name' => $line->article->name,
                        'quantity_sold' => $line->quantity,
                        'current_stock' => $stockSupply ? $stockSupply->quantity : 'No stock record'
                    ];
                })
            ];

            // Now delete the order
            $deleteResponse = $this->destroy($order);
            $deleteData = json_decode($deleteResponse->getContent(), true);

            return response()->json([
                'message' => 'Delete test completed',
                'before_deletion' => $beforeDeletion,
                'delete_result' => $deleteData,
                'status_code' => $deleteResponse->getStatusCode()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error in delete test: ' . $e->getMessage());
            return response()->json([
                'message' => 'Delete test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all order lines with item counts
     */
    public function getOrderLines()
    {
        try {
            $orderLines = OrderLine::with(['order.user', 'article'])
                ->get()
                ->groupBy('order_id')
                ->map(function ($lines, $orderId) {
                    $order = $lines->first()->order;
                    $totalItems = $lines->sum('quantity');

                    return [
                        'order_id' => $orderId,
                        'user' => $order->user ? $order->user->name : 'Unknown',
                        'total_amount' => $order->total_amount,
                        'total_items' => $totalItems, // e.g., 3 milk + 2 beef = 5 items
                        'number_of_different_articles' => $lines->count(),
                        'created_at' => $order->created_at,
                        'items_breakdown' => $lines->map(function ($line) {
                            return [
                                'article_name' => $line->article->name,
                                'quantity' => $line->quantity,
                                'unit_price' => $line->unit_price,
                                'line_total' => $line->line_total,
                            ];
                        })->values()
                    ];
                });

            return response()->json([
                'message' => 'Order lines retrieved successfully',
                'data' => $orderLines->values()
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving order lines: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order lines for a specific order with item count
     */
    public function getOrderLinesByOrder($orderId)
    {
        try {
            $order = Order::with(['orderLines.article', 'user'])->find($orderId);

            if (!$order) {
                return response()->json([
                    'message' => 'Order not found'
                ], 404);
            }

            $totalItems = $order->orderLines->sum('quantity');

            $orderData = [
                'order_id' => $order->id,
                'user' => $order->user ? $order->user->name : 'Unknown',
                'total_amount' => $order->total_amount,
                'total_items' => $totalItems, // e.g., 3 milk + 2 beef = 5 items
                'number_of_different_articles' => $order->orderLines->count(),
                'created_at' => $order->created_at,
                'items_breakdown' => $order->orderLines->map(function ($line) {
                    return [
                        'article_name' => $line->article->name,
                        'quantity' => $line->quantity,
                        'unit_price' => $line->unit_price,
                        'line_total' => $line->line_total,
                    ];
                })
            ];

            return response()->json([
                'message' => 'Order lines retrieved successfully',
                'data' => $orderData
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving order lines for order ' . $orderId . ': ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sell an article and update stock quantities.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    // public function sellArticle(Request $request)
    // {
    //     // Validate the request
    //     $validator = Validator::make($request->all(), [
    //         'article_id' => 'required|exists:articles,id',
    //         'quantity' => 'required|integer|min:1',
    //         'notes' => 'nullable|string',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json([
    //             'message' => 'Validation failed',
    //             'errors' => $validator->errors()
    //         ], 422);
    //     }

    //     try {
    //         // Get the article
    //         $article = Article::findOrFail($request->article_id);

    //         // Check if there's enough stock in stock_supplies
    //         $stockSupply = StockSupply::where('article_id', $article->id)->first();

    //         if (!$stockSupply || $stockSupply->quantity < $request->quantity) {
    //             return response()->json([
    //                 'message' => 'Out of stock',
    //                 'available_quantity' => $stockSupply ? $stockSupply->quantity : 0
    //             ], 400);
    //         }

    //         // Process the sale within a transaction
    //         return DB::transaction(function () use ($request, $article, $stockSupply) {
    //             // Get the authenticated user or use a default user
    //             $user = auth()->user();

    //             if ($user) {
    //                 $userId = $user->id;
    //                 Log::info('OrderController: Using authenticated user ID: ' . $userId);
    //             } else {
    //                 // Try to get the first user as a fallback
    //                 $user = User::first();
    //                 $userId = $user ? $user->id : null;
    //                 Log::info('OrderController: Using fallback user ID: ' . ($userId ?? 'null'));
    //             }

    //             // Create the order
    //             $order = Order::create([
    //                 'user_id' => $userId,
    //                 'article_id' => $article->id,
    //                 'supplier_id' => $article->supplier_id,
    //                 'quantity' => $request->quantity,
    //             ]);

    //             // Update ONLY the stock_supplies quantity
    //             // Do NOT update the article quantity
    //             $stockSupply->quantity -= $request->quantity;
    //             $stockSupply->save();

    //             // Create a stock movement record
    //             $stockMovement = StockMovement::create([
    //                 'article_id' => $article->id,
    //                 'type' => 'out',
    //                 'quantity' => $request->quantity,
    //                 'date' => now(),
    //                 'reason' => $request->notes ?? "Sale of article {$article->name}",
    //             ]);

    //             // Create a report for this stock movement
    //             $reportData = [
    //                 'user_id' => $userId,
    //                 'details' => $request->notes ?? "Sale of article {$article->name} (Barcode: {$article->barcode})",
    //             ];

    //             $this->reportService->createStockMovementReport($stockMovement, $reportData);

    //             return response()->json([
    //                 'message' => 'Sale completed successfully',
    //                 'data' => [
    //                     'order' => $order,
    //                     'article' => $article,
    //                     'remaining_stock' => $stockSupply->quantity
    //                 ]
    //             ], 200);
    //         });
    //     } catch (\Exception $e) {
    //         Log::error('Error in sellArticle: ' . $e->getMessage());
    //         return response()->json([
    //             'message' => 'Failed to process sale',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }
}

