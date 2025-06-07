<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Article;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\StockSupply;
use App\Models\StockMovement;
use App\Models\Report;
use App\Services\SalesAnalyticsService;
use App\Services\ReportService;

echo "=== Sales Reporting System Demo ===\n\n";

// Create or get test data
$user = User::firstOrCreate(
    ['email' => 'demo@example.com'],
    [
        'name' => 'Demo User',
        'role' => 'Admin',
        'password' => bcrypt('password')
    ]
);

$category = Category::firstOrCreate(
    ['name' => 'Demo Category'],
    ['description' => 'Demo category for testing']
);

$supplier = Supplier::firstOrCreate(
    ['email' => 'demo-supplier@example.com'],
    [
        'name' => 'Demo Supplier',
        'address' => '123 Demo Street',
        'phone' => '555-0123'
    ]
);

// Create demo articles
$articles = [];
$articleData = [
    ['name' => 'Milk', 'barcode' => '123456789001', 'price' => 2.50],
    ['name' => 'Beef', 'barcode' => '123456789002', 'price' => 15.00],
    ['name' => 'Bread', 'barcode' => '123456789003', 'price' => 3.00],
];

foreach ($articleData as $data) {
    $article = Article::firstOrCreate(
        ['barcode' => $data['barcode']],
        [
            'name' => $data['name'],
            'price' => $data['price'],
            'quantity' => 100,
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
        ]
    );
    $articles[] = $article;
    
    // Ensure stock supply exists
    StockSupply::firstOrCreate(
        ['article_id' => $article->id],
        [
            'quantity' => 100,
            'supply_date' => now(),
            'notes' => 'Initial stock for demo'
        ]
    );
}

echo "✓ Created demo data (user, category, supplier, articles)\n";

// Create sample sales transactions
echo "\n=== Creating Sample Sales Transactions ===\n";

$reportService = new ReportService();

for ($i = 0; $i < 5; $i++) {
    $order = Order::create([
        'user_id' => $user->id,
        'total_amount' => 0,
        'created_at' => now()->subDays($i),
    ]);

    $totalAmount = 0;
    $orderItems = [];

    // Add 2-3 random items to each order
    $itemsToAdd = array_rand($articles, rand(2, 3));
    if (!is_array($itemsToAdd)) {
        $itemsToAdd = [$itemsToAdd];
    }

    foreach ($itemsToAdd as $index) {
        $article = $articles[$index];
        $quantity = rand(1, 20);
        $unitPrice = $article->price;
        $lineTotal = $quantity * $unitPrice;

        $orderLine = OrderLine::create([
            'order_id' => $order->id,
            'article_id' => $article->id,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
        ]);

        // Create stock movement
        $stockMovement = StockMovement::create([
            'article_id' => $article->id,
            'type' => 'out',
            'quantity' => $quantity,
            'date' => now()->subDays($i),
            'reason' => "Sale of article {$article->name}",
        ]);

        // Create report
        $reportService->createStockMovementReport($stockMovement, [
            'user_id' => $user->id,
            'order_line_id' => $orderLine->id,
            'details' => "Sale of {$quantity} units of {$article->name}",
        ]);

        $orderItems[] = "{$quantity}x {$article->name} @ \${$unitPrice} = \${$lineTotal}";
        $totalAmount += $lineTotal;
    }

    $order->update(['total_amount' => $totalAmount]);
    
    echo "Order #" . ($i + 1) . " (Total: \${$totalAmount}): " . implode(', ', $orderItems) . "\n";
}

echo "\n✓ Created 5 sample sales transactions\n";

// Demonstrate sales analytics
echo "\n=== Sales Analytics Demo ===\n";

$salesAnalyticsService = new SalesAnalyticsService();

// Get comprehensive analytics
$analytics = $salesAnalyticsService->getSalesAnalytics();

echo "\n--- Overview Metrics ---\n";
echo "Total Revenue: \$" . $analytics['overview']['total_revenue'] . "\n";
echo "Total Quantity Sold: " . $analytics['overview']['total_quantity_sold'] . " units\n";
echo "Total Orders: " . $analytics['overview']['total_orders'] . "\n";
echo "Average Order Value: \$" . $analytics['overview']['average_order_value'] . "\n";
echo "Unique Products Sold: " . $analytics['overview']['unique_products_sold'] . "\n";

echo "\n--- Top Selling Products ---\n";
foreach (array_slice($analytics['top_products'], 0, 3) as $product) {
    echo "• {$product['name']}: {$product['total_quantity']} units, \${$product['total_revenue']} revenue\n";
}

echo "\n--- Category Performance ---\n";
foreach ($analytics['category_performance'] as $category) {
    echo "• {$category['category_name']}: {$category['total_quantity']} units, \${$category['total_revenue']} revenue\n";
}

// Get sales summary using ReportService
echo "\n--- Sales Summary (via Reports) ---\n";
$summary = $reportService->getSalesSummary();

echo "Summary Total Revenue: \$" . $summary['summary']['total_revenue'] . "\n";
echo "Summary Total Orders: " . $summary['summary']['total_orders'] . "\n";
echo "Items Sold Count: " . count($summary['items_sold']) . "\n";

echo "\n--- Individual Items Sold ---\n";
foreach ($summary['items_sold'] as $item) {
    echo "• {$item['article_name']} ({$item['article_barcode']}): {$item['total_quantity']} units, \${$item['total_revenue']} revenue\n";
}

// Demonstrate item-level reporting
echo "\n--- Item-Level Sales Report (Milk) ---\n";
$milkArticle = $articles[0]; // Milk
$itemReport = $salesAnalyticsService->getItemSalesReport($milkArticle->id);

echo "Article: {$itemReport['article']['name']} ({$itemReport['article']['barcode']})\n";
echo "Total Sold: {$itemReport['sales_summary']['total_quantity_sold']} units\n";
echo "Total Revenue: \${$itemReport['sales_summary']['total_revenue']}\n";
echo "Average Price: \${$itemReport['sales_summary']['average_price']}\n";
echo "Sales History:\n";

foreach (array_slice($itemReport['sales_history'], 0, 3) as $sale) {
    echo "  - Order #{$sale['order_id']}: {$sale['quantity']} units @ \${$sale['unit_price']} = \${$sale['line_total']}\n";
}

echo "\n=== Demo Complete ===\n";
echo "\nYou can now test the API endpoints:\n";
echo "• GET /api/reports/sales/summary\n";
echo "• GET /api/reports/sales/analytics\n";
echo "• GET /api/reports/sales/top-products\n";
echo "• GET /api/reports/sales/item/{articleId}\n";
echo "• GET /api/reports/sales/daily\n";
echo "\nExample: curl -H 'Authorization: Bearer {token}' http://localhost:8000/api/reports/sales/summary\n";
