<?php

namespace App\Http\Controllers;

use App\Models\OrderLine;
use App\Models\Order;
use App\Models\StockSupply;
use App\Models\StockMovement;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OrderLineController extends Controller
{
    /**
     * Display a listing of all order lines with related data.
     */
    public function index()
    {
        try {
            $orderLines = OrderLine::with([
                'order.user',
                'article.category',
                'article.supplier'
            ])->get();

            return response()->json([
                'message' => 'Order lines retrieved successfully',
                'data' => $orderLines
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order lines for a specific order.
     */
    public function getOrderLines($orderId)
    {
        try {
            $orderLines = OrderLine::with([
                'article.category',
                'article.supplier',
                'order.user'
            ])->where('order_id', $orderId)->get();

            if ($orderLines->isEmpty()) {
                return response()->json([
                    'message' => 'No order lines found for this order',
                    'data' => []
                ], 404);
            }

            return response()->json([
                'message' => 'Order lines retrieved successfully',
                'data' => $orderLines
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales summary grouped by article.
     */
    public function getSalesSummary()
    {
        try {
            $salesSummary = OrderLine::with(['article.category', 'article.supplier'])
                ->select(
                    'article_id',
                    DB::raw('SUM(quantity) as total_quantity_sold'),
                    DB::raw('SUM(line_total) as total_sales_amount'),
                    DB::raw('COUNT(*) as number_of_transactions'),
                    DB::raw('AVG(unit_price) as average_unit_price')
                )
                ->groupBy('article_id')
                ->get();

            return response()->json([
                'message' => 'Sales summary retrieved successfully',
                'data' => $salesSummary
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve sales summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order lines by date range.
     */
    public function getOrderLinesByDateRange(Request $request)
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $query = OrderLine::with([
                'order.user',
                'article.category',
                'article.supplier'
            ]);

            if ($startDate) {
                $query->whereHas('order', function ($q) use ($startDate) {
                    $q->whereDate('created_at', '>=', $startDate);
                });
            }

            if ($endDate) {
                $query->whereHas('order', function ($q) use ($endDate) {
                    $q->whereDate('created_at', '<=', $endDate);
                });
            }

            $orderLines = $query->get();

            return response()->json([
                'message' => 'Order lines retrieved successfully',
                'data' => $orderLines,
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OrderLine $orderLine)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OrderLine $orderLine)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OrderLine $orderLine)
    {
        try {
            return DB::transaction(function () use ($orderLine) {
                // Load the order line with its article and order
                $orderLineWithRelations = OrderLine::with(['article', 'order'])->find($orderLine->id);

                if (!$orderLineWithRelations) {
                    return response()->json([
                        'message' => 'Order line not found'
                    ], 404);
                }

                $article = $orderLineWithRelations->article;
                $order = $orderLineWithRelations->order;
                $quantityToRestore = $orderLineWithRelations->quantity;
                $lineTotal = $orderLineWithRelations->line_total;

                Log::info("Starting deletion of Order Line #{$orderLine->id} for article {$article->name}");

                // Delete related reports for this order line
                $deletedReports = [];
                $reports = Report::where('order_line_id', $orderLine->id)->get();
                foreach ($reports as $report) {
                    $deletedReports[] = [
                        'report_id' => $report->id,
                        'type' => $report->type,
                        'details' => $report->details
                    ];
                    $report->delete();
                    Log::info("Deleted report #{$report->id} for order line #{$orderLine->id}");
                }

                try {
                    // Find the stock supply for this article
                    $stockSupply = StockSupply::where('article_id', $article->id)->first();

                    if ($stockSupply) {
                        $oldQuantity = $stockSupply->quantity;

                        // Add back the quantity that was sold
                        $stockSupply->quantity += $quantityToRestore;
                        $stockSupply->save();

                        // Create a stock movement record for the restoration
                        StockMovement::create([
                            'article_id' => $article->id,
                            'type' => 'in',
                            'quantity' => $quantityToRestore,
                            'date' => now(),
                            'reason' => "Order line #{$orderLine->id} deleted - stock restored for {$article->name}",
                        ]);

                        Log::info("Successfully restored {$quantityToRestore} units of {$article->name} to stock (from {$oldQuantity} to {$stockSupply->quantity})");

                        $stockRestored = true;
                        $stockInfo = [
                            'article_name' => $article->name,
                            'article_id' => $article->id,
                            'quantity_restored' => $quantityToRestore,
                            'old_stock' => $oldQuantity,
                            'new_stock' => $stockSupply->quantity
                        ];
                    } else {
                        Log::warning("Could not restore stock for {$article->name} (ID: {$article->id}) - No stock supply record found");
                        $stockRestored = false;
                        $stockInfo = [
                            'article_name' => $article->name,
                            'article_id' => $article->id,
                            'quantity_to_restore' => $quantityToRestore,
                            'reason' => 'No stock supply record found'
                        ];
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to restore stock for {$article->name} (ID: {$article->id}): " . $e->getMessage());
                    $stockRestored = false;
                    $stockInfo = [
                        'article_name' => $article->name,
                        'article_id' => $article->id,
                        'quantity_to_restore' => $quantityToRestore,
                        'reason' => $e->getMessage()
                    ];
                }

                // Update the order total amount
                $order->total_amount -= $lineTotal;
                $order->save();

                // Delete the order line
                $orderLineWithRelations->delete();

                Log::info("Order Line #{$orderLine->id} deleted successfully");

                // Check if the order has any remaining order lines
                $remainingOrderLines = $order->orderLines()->count();
                $orderDeleted = false;

                if ($remainingOrderLines == 0) {
                    // No more order lines, delete the entire order
                    $order->delete();
                    $orderDeleted = true;
                    Log::info("Order #{$order->id} automatically deleted - no remaining order lines");
                }

                $response = [
                    'message' => $orderDeleted ? 'Order line deleted and order automatically removed (no items remaining)' : 'Order line deleted successfully',
                    'deleted_order_line_id' => $orderLine->id,
                    'order_id' => $order->id,
                    'order_deleted' => $orderDeleted,
                    'stock_restored' => $stockRestored,
                    'deleted_reports' => $deletedReports,
                    'deleted_reports_count' => count($deletedReports)
                ];

                if (!$orderDeleted) {
                    $response['updated_order_total'] = $order->total_amount;
                    $response['remaining_order_lines'] = $remainingOrderLines;
                }

                if ($stockRestored) {
                    $response['restored_stock'] = $stockInfo;
                } else {
                    $response['message'] = $orderDeleted ?
                        'Order line deleted, order automatically removed, but stock quantity could not be restored' :
                        'Order line deleted, but stock quantity could not be restored';
                    $response['failed_restoration'] = $stockInfo;
                }

                return response()->json($response, 200);
            });
        } catch (\Exception $e) {
            Log::error('Error deleting order line: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete order line',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple order lines and restore stock quantities
     */
    public function destroyMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_line_ids' => 'required|array|min:1',
            'order_line_ids.*' => 'required|integer|exists:order_lines,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $deletedOrderLines = [];
                $restoredItems = [];
                $failedRestorations = [];
                $updatedOrders = [];

                foreach ($request->order_line_ids as $orderLineId) {
                    $orderLine = OrderLine::with(['article', 'order'])->find($orderLineId);

                    if (!$orderLine) {
                        continue; // Skip if order line not found
                    }

                    $article = $orderLine->article;
                    $order = $orderLine->order;
                    $quantityToRestore = $orderLine->quantity;
                    $lineTotal = $orderLine->line_total;

                    try {
                        // Find the stock supply for this article
                        $stockSupply = StockSupply::where('article_id', $article->id)->first();

                        if ($stockSupply) {
                            $oldQuantity = $stockSupply->quantity;

                            // Add back the quantity that was sold
                            $stockSupply->quantity += $quantityToRestore;
                            $stockSupply->save();

                            // Create a stock movement record for the restoration
                            StockMovement::create([
                                'article_id' => $article->id,
                                'type' => 'in',
                                'quantity' => $quantityToRestore,
                                'date' => now(),
                                'reason' => "Order line #{$orderLine->id} deleted - stock restored for {$article->name}",
                            ]);

                            $restoredItems[] = [
                                'order_line_id' => $orderLine->id,
                                'article_name' => $article->name,
                                'article_id' => $article->id,
                                'quantity_restored' => $quantityToRestore,
                                'old_stock' => $oldQuantity,
                                'new_stock' => $stockSupply->quantity
                            ];
                        } else {
                            $failedRestorations[] = [
                                'order_line_id' => $orderLine->id,
                                'article_name' => $article->name,
                                'article_id' => $article->id,
                                'quantity_to_restore' => $quantityToRestore,
                                'reason' => 'No stock supply record found'
                            ];
                        }
                    } catch (\Exception $e) {
                        $failedRestorations[] = [
                            'order_line_id' => $orderLine->id,
                            'article_name' => $article->name,
                            'article_id' => $article->id,
                            'quantity_to_restore' => $quantityToRestore,
                            'reason' => $e->getMessage()
                        ];
                    }

                    // Update the order total amount
                    $order->total_amount -= $lineTotal;
                    $order->save();

                    // Track updated orders
                    if (!isset($updatedOrders[$order->id])) {
                        $updatedOrders[$order->id] = [
                            'order_id' => $order->id,
                            'new_total' => $order->total_amount,
                            'deleted_lines_count' => 0
                        ];
                    }
                    $updatedOrders[$order->id]['deleted_lines_count']++;

                    // Delete the order line
                    $orderLine->delete();
                    $deletedOrderLines[] = $orderLineId;
                }

                // Check for orders that should be automatically deleted (no remaining order lines)
                $deletedOrders = [];
                foreach ($updatedOrders as $orderInfo) {
                    $orderToCheck = Order::find($orderInfo['order_id']);
                    if ($orderToCheck && $orderToCheck->orderLines()->count() == 0) {
                        $orderToCheck->delete();
                        $deletedOrders[] = $orderInfo['order_id'];
                        Log::info("Order #{$orderInfo['order_id']} automatically deleted - no remaining order lines");
                    }
                }

                $response = [
                    'message' => 'Order lines deleted successfully',
                    'deleted_order_lines' => $deletedOrderLines,
                    'updated_orders' => array_values($updatedOrders),
                    'restored_items' => $restoredItems
                ];

                if (!empty($deletedOrders)) {
                    $response['message'] = 'Order lines deleted successfully and empty orders automatically removed';
                    $response['automatically_deleted_orders'] = $deletedOrders;
                }

                if (!empty($failedRestorations)) {
                    $response['message'] = !empty($deletedOrders) ?
                        'Order lines deleted, empty orders removed, but some stock quantities could not be restored' :
                        'Order lines deleted, but some stock quantities could not be restored';
                    $response['failed_restorations'] = $failedRestorations;
                }

                return response()->json($response, 200);
            });
        } catch (\Exception $e) {
            Log::error('Error deleting multiple order lines: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all order lines for a specific order and restore stock
     */
    public function destroyByOrder($orderId)
    {
        try {
            $order = Order::with(['orderLines.article'])->find($orderId);

            if (!$order) {
                return response()->json([
                    'message' => 'Order not found'
                ], 404);
            }

            if ($order->orderLines->isEmpty()) {
                return response()->json([
                    'message' => 'No order lines found for this order'
                ], 404);
            }

            return DB::transaction(function () use ($order) {
                $restoredItems = [];
                $failedRestorations = [];

                foreach ($order->orderLines as $orderLine) {
                    $article = $orderLine->article;
                    $quantityToRestore = $orderLine->quantity;

                    try {
                        // Find the stock supply for this article
                        $stockSupply = StockSupply::where('article_id', $article->id)->first();

                        if ($stockSupply) {
                            $oldQuantity = $stockSupply->quantity;

                            // Add back the quantity that was sold
                            $stockSupply->quantity += $quantityToRestore;
                            $stockSupply->save();

                            // Create a stock movement record for the restoration
                            StockMovement::create([
                                'article_id' => $article->id,
                                'type' => 'in',
                                'quantity' => $quantityToRestore,
                                'date' => now(),
                                'reason' => "All order lines deleted for Order #{$order->id} - stock restored for {$article->name}",
                            ]);

                            $restoredItems[] = [
                                'order_line_id' => $orderLine->id,
                                'article_name' => $article->name,
                                'article_id' => $article->id,
                                'quantity_restored' => $quantityToRestore,
                                'old_stock' => $oldQuantity,
                                'new_stock' => $stockSupply->quantity
                            ];
                        } else {
                            $failedRestorations[] = [
                                'order_line_id' => $orderLine->id,
                                'article_name' => $article->name,
                                'article_id' => $article->id,
                                'quantity_to_restore' => $quantityToRestore,
                                'reason' => 'No stock supply record found'
                            ];
                        }
                    } catch (\Exception $e) {
                        $failedRestorations[] = [
                            'order_line_id' => $orderLine->id,
                            'article_name' => $article->name,
                            'article_id' => $article->id,
                            'quantity_to_restore' => $quantityToRestore,
                            'reason' => $e->getMessage()
                        ];
                    }
                }

                // Delete all order lines
                $deletedLinesCount = count($restoredItems) + count($failedRestorations);
                $order->orderLines()->delete();

                // Since all order lines are deleted, automatically delete the order
                $order->delete();
                Log::info("Order #{$order->id} automatically deleted - all order lines removed");

                $response = [
                    'message' => 'All order lines deleted and order automatically removed',
                    'order_id' => $order->id,
                    'order_deleted' => true,
                    'deleted_lines_count' => $deletedLinesCount,
                    'restored_items' => $restoredItems
                ];

                if (!empty($failedRestorations)) {
                    $response['message'] = 'All order lines deleted, order automatically removed, but some stock quantities could not be restored';
                    $response['failed_restorations'] = $failedRestorations;
                }

                return response()->json($response, 200);
            });
        } catch (\Exception $e) {
            Log::error('Error deleting order lines for order ' . $orderId . ': ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete order lines',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if deleting specific order lines would result in order deletion
     */
    public function checkOrderDeletionImpact(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_line_ids' => 'required|array|min:1',
            'order_line_ids.*' => 'required|integer|exists:order_lines,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $orderLineIds = $request->order_line_ids;
            $affectedOrders = [];
            $ordersToBeDeleted = [];

            // Get all order lines to be deleted
            $orderLines = OrderLine::with(['order'])->whereIn('id', $orderLineIds)->get();

            // Group by order
            $orderGroups = $orderLines->groupBy('order_id');

            foreach ($orderGroups as $orderId => $lines) {
                $order = $lines->first()->order;
                $totalOrderLines = $order->orderLines()->count();
                $linesToDelete = $lines->count();
                $remainingLines = $totalOrderLines - $linesToDelete;

                $orderInfo = [
                    'order_id' => $orderId,
                    'current_total_lines' => $totalOrderLines,
                    'lines_to_delete' => $linesToDelete,
                    'remaining_lines' => $remainingLines,
                    'will_be_deleted' => $remainingLines == 0,
                    'current_order_total' => $order->total_amount,
                    'lines_total_to_remove' => $lines->sum('line_total')
                ];

                $affectedOrders[] = $orderInfo;

                if ($remainingLines == 0) {
                    $ordersToBeDeleted[] = $orderId;
                }
            }

            return response()->json([
                'message' => 'Order deletion impact analysis completed',
                'affected_orders' => $affectedOrders,
                'orders_that_will_be_deleted' => $ordersToBeDeleted,
                'total_orders_to_be_deleted' => count($ordersToBeDeleted)
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error checking order deletion impact: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to check order deletion impact',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
