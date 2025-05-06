<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\StockSupplyController;
use App\Http\Controllers\SupplierController;

// Test
Route::get("/", function (Request $request) {
    return response()->json([
        "message" => "Welcome to the API"
    ]);
})->name("api.welcome");
// Test


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Article routes
    Route::get('articles/low-stock', [ArticleController::class, 'lowStock']);
    Route::apiResource('articles', ArticleController::class);

    // Category routes
    Route::get('categories/with-counts', [CategoryController::class, 'getCategoriesWithCounts']);
    Route::get('categories/{category}/articles', [CategoryController::class, 'getArticles']);
    Route::apiResource('categories', CategoryController::class);

    // Stock Supply routes
    Route::apiResource('stock-supplies', StockSupplyController::class);
    Route::get('stock/category/{categoryId}', [StockSupplyController::class, 'getStockByCategory']);
    Route::get('stock/article/{articleId}/supplies', [StockSupplyController::class, 'getArticleSupplies']);
    Route::get('stock/article/{articleId}/movements', [StockSupplyController::class, 'getArticleMovements']);

    // Supplier routes
    Route::get('suppliers/with-counts', [SupplierController::class, 'getSuppliersWithCounts']);
    Route::get('suppliers/{supplier}/articles', [SupplierController::class, 'getArticles']);
    Route::get('suppliers/{supplier}/stock-supplies', [SupplierController::class, 'getStockSupplies']);
    Route::apiResource('suppliers', SupplierController::class);
// });
