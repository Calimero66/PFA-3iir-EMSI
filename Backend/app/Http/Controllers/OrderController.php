<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Article;
use App\Models\OrderLine;
use App\Models\StockSupply;
use App\Models\StockMovement;
use App\Models\User;
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
        //
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
        //
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
