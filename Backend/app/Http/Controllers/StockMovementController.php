<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $stockMovements = StockMovement::with([
                'article:id,name,barcode,price',
                'article.category:id,name',
                'article.supplier:id,name',
                'report:id,type,report_date,stock_movement_id'
            ])
            ->orderBy('date', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'message' => 'Stock movements retrieved successfully',
                'data' => $stockMovements->map(function ($movement) {
                    return [
                        'id' => $movement->id,
                        'type' => $movement->type,
                        'quantity' => $movement->quantity,
                        'date' => $movement->date,
                        'reason' => $movement->reason,
                        'created_at' => $movement->created_at,
                        'updated_at' => $movement->updated_at,
                        'article' => [
                            'id' => $movement->article->id,
                            'name' => $movement->article->name,
                            'barcode' => $movement->article->barcode,
                            'price' => $movement->article->price,
                            'category' => $movement->article->category ? [
                                'id' => $movement->article->category->id,
                                'name' => $movement->article->category->name,
                            ] : null,
                            'supplier' => $movement->article->supplier ? [
                                'id' => $movement->article->supplier->id,
                                'name' => $movement->article->supplier->name,
                            ] : null,
                        ],
                        'report' => $movement->report ? [
                            'id' => $movement->report->id,
                            'type' => $movement->report->type,
                            'report_date' => $movement->report->report_date,
                        ] : null,
                    ];
                }),
                'total' => $stockMovements->count()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve stock movements',
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(StockMovement $stockMovement)
    {
        try {
            $stockMovement->load([
                'article:id,name,barcode,price',
                'article.category:id,name',
                'article.supplier:id,name',
                'report:id,type,report_date,stock_movement_id'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Stock movement retrieved successfully',
                'data' => [
                    'id' => $stockMovement->id,
                    'type' => $stockMovement->type,
                    'quantity' => $stockMovement->quantity,
                    'date' => $stockMovement->date,
                    'reason' => $stockMovement->reason,
                    'created_at' => $stockMovement->created_at,
                    'updated_at' => $stockMovement->updated_at,
                    'article' => [
                        'id' => $stockMovement->article->id,
                        'name' => $stockMovement->article->name,
                        'barcode' => $stockMovement->article->barcode,
                        'price' => $stockMovement->article->price,
                        'category' => $stockMovement->article->category ? [
                            'id' => $stockMovement->article->category->id,
                            'name' => $stockMovement->article->category->name,
                        ] : null,
                        'supplier' => $stockMovement->article->supplier ? [
                            'id' => $stockMovement->article->supplier->id,
                            'name' => $stockMovement->article->supplier->name,
                        ] : null,
                    ],
                    'report' => $stockMovement->report ? [
                        'id' => $stockMovement->report->id,
                        'type' => $stockMovement->report->type,
                        'report_date' => $stockMovement->report->report_date,
                    ] : null,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve stock movement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(StockMovement $stockMovement)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StockMovement $stockMovement)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StockMovement $stockMovement)
    {
        //
    }
}
