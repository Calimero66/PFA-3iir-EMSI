<?php

use App\Http\Controllers\UserController;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\IsManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderLineController;
use App\Http\Controllers\ReportController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::middleware(IsAdmin::class)->group(function () {

        // Route::post('/GetUserById', [UserController::class, 'GetUserById']);
        Route::apiResource('users', UserController::class);
    });
    Route::middleware(IsManager::class)->group(function () {

        Route::post('/createAgent', [UserController::class, 'CreateAgent']);
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
    Route::apiResource('suppliers', SupplierController::class);

    // Report routes
    Route::get('reports', [ReportController::class, 'index']);
    Route::get('reports/type/{type}', [ReportController::class, 'getByType']);
    Route::get('reports/article/{articleId}', [ReportController::class, 'getByArticle']);
    Route::get('reports/{id}/ticket', [ReportController::class, 'generateTicket']);
    Route::get('reports/{id}', [ReportController::class, 'show']);

    // Sales Analytics routes
    Route::get('reports/sales/list', [ReportController::class, 'getSalesReports']);
    Route::get('reports/sales/summary', [ReportController::class, 'getSalesSummary']);
    Route::get('reports/sales/analytics', [ReportController::class, 'getSalesAnalytics']);
    Route::get('reports/sales/daily', [ReportController::class, 'getDailySalesData']);
    Route::get('reports/sales/top-products', [ReportController::class, 'getTopSellingProducts']);
    Route::get('reports/sales/item/{articleId}', [ReportController::class, 'getItemSalesReport']);

    // Order routes
    Route::get('orders/lines', [OrderController::class, 'getOrderLines']);
    Route::get('orders/{orderId}/lines', [OrderController::class, 'getOrderLinesByOrder']);
    Route::get('orders/{orderId}/test-delete', [OrderController::class, 'testDelete']);
    Route::delete('orders/multiple', [OrderController::class, 'destroyMultiple']);
    Route::post('orders/sell', [OrderController::class, 'sellArticle']);
    Route::apiResource('orders', OrderController::class);

    // Order Lines routes
    Route::post('order-lines/check-deletion-impact', [OrderLineController::class, 'checkOrderDeletionImpact']);
    Route::delete('order-lines/multiple', [OrderLineController::class, 'destroyMultiple']);
    Route::delete('order-lines/order/{orderId}', [OrderLineController::class, 'destroyByOrder']);
    Route::apiResource('order-lines', OrderLineController::class);
});
