<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Article;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\StockSupply;

echo "=== Stock Supplies with Article Names Demo ===\n\n";

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
    ['name' => 'Premium Milk', 'barcode' => '123456789001', 'price' => 2.50],
    ['name' => 'Organic Beef', 'barcode' => '123456789002', 'price' => 15.00],
    ['name' => 'Whole Wheat Bread', 'barcode' => '123456789003', 'price' => 3.00],
    ['name' => 'Fresh Eggs', 'barcode' => '123456789004', 'price' => 4.50],
];

foreach ($articleData as $data) {
    $article = Article::firstOrCreate(
        ['barcode' => $data['barcode']],
        [
            'name' => $data['name'],
            'price' => $data['price'],
            'quantity' => 0, // Start with 0, we'll add through stock supplies
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
        ]
    );
    $articles[] = $article;
}

echo "✓ Created demo data (user, category, supplier, articles)\n";

// Create stock supplies for each article
echo "\n=== Creating Stock Supplies ===\n";

foreach ($articles as $index => $article) {
    $quantity = rand(50, 200);
    
    $stockSupply = StockSupply::create([
        'article_id' => $article->id,
        'quantity' => $quantity,
        'supply_date' => now()->subDays($index),
        'notes' => "Initial supply for {$article->name}"
    ]);
    
    // Update article quantity
    $article->increment('quantity', $quantity);
    
    echo "• Added {$quantity} units of {$article->name} (ID: {$stockSupply->id})\n";
}

echo "\n✓ Created stock supplies for all articles\n";

// Demonstrate the enhanced API responses
echo "\n=== Enhanced API Response Examples ===\n";

// Get all stock supplies with article names
$allSupplies = StockSupply::with(['article.category', 'article.supplier'])
    ->orderBy('created_at', 'desc')
    ->get();

echo "\n--- All Stock Supplies (with article names) ---\n";
foreach ($allSupplies as $supply) {
    if ($supply->article) {
        echo "• Supply #{$supply->id}: {$supply->quantity} units of '{$supply->article->name}' ";
        echo "(Barcode: {$supply->article->barcode}) ";
        echo "from " . ($supply->article->supplier ? $supply->article->supplier->name : 'Unknown Supplier') . "\n";
        echo "  Category: " . ($supply->article->category ? $supply->article->category->name : 'Uncategorized') . " | ";
        echo "Price: \${$supply->article->price} | ";
        echo "Supply Date: {$supply->supply_date->format('Y-m-d')}\n";
        if ($supply->notes) {
            echo "  Notes: {$supply->notes}\n";
        }
        echo "\n";
    }
}

// Show what the API response looks like
echo "\n--- Sample API Response Format ---\n";
$sampleSupply = $allSupplies->first();
if ($sampleSupply && $sampleSupply->article) {
    $apiResponse = [
        'id' => $sampleSupply->id,
        'article_id' => $sampleSupply->article_id,
        'article_name' => $sampleSupply->article->name,
        'article_barcode' => $sampleSupply->article->barcode,
        'article_price' => $sampleSupply->article->price,
        'category_name' => $sampleSupply->article->category ? $sampleSupply->article->category->name : 'Uncategorized',
        'supplier_name' => $sampleSupply->article->supplier ? $sampleSupply->article->supplier->name : 'No Supplier',
        'quantity' => $sampleSupply->quantity,
        'supply_date' => $sampleSupply->supply_date,
        'notes' => $sampleSupply->notes,
        'created_at' => $sampleSupply->created_at,
        'updated_at' => $sampleSupply->updated_at,
    ];
    
    echo "Sample API Response for Stock Supply #{$sampleSupply->id}:\n";
    echo json_encode($apiResponse, JSON_PRETTY_PRINT) . "\n";
}

// Show article-specific supplies
echo "\n--- Article-Specific Supplies ---\n";
$firstArticle = $articles[0];
$articleSupplies = StockSupply::where('article_id', $firstArticle->id)->get();

echo "Supplies for '{$firstArticle->name}' (ID: {$firstArticle->id}):\n";
foreach ($articleSupplies as $supply) {
    echo "• Supply #{$supply->id}: {$supply->quantity} units on {$supply->supply_date->format('Y-m-d')}\n";
}

echo "\n=== API Endpoints Available ===\n";
echo "The following endpoints now include article names and related information:\n\n";

echo "1. GET /api/stock-supplies\n";
echo "   - Lists all stock supplies with article names, categories, and suppliers\n";
echo "   - Response includes: article_name, article_barcode, category_name, supplier_name\n\n";

echo "2. GET /api/stock-supplies/{id}\n";
echo "   - Shows single stock supply with full article details\n";
echo "   - Includes article price, category, and supplier information\n\n";

echo "3. POST /api/stock-supplies\n";
echo "   - Creates new stock supply and returns formatted response with article name\n";
echo "   - Response includes all article details for immediate display\n\n";

echo "4. GET /api/stock/article/{articleId}/supplies\n";
echo "   - Shows all supplies for a specific article\n";
echo "   - Includes article summary and total supply statistics\n";
echo "   - Each supply entry includes article name for consistency\n\n";

echo "=== Benefits ===\n";
echo "✓ Article names are immediately available without additional API calls\n";
echo "✓ Category and supplier names included for better context\n";
echo "✓ Consistent response format across all endpoints\n";
echo "✓ Backward compatibility maintained (original 'article' object still included)\n";
echo "✓ Better user experience in frontend applications\n\n";

echo "=== Demo Complete ===\n";
echo "\nYou can now test the enhanced API endpoints:\n";
echo "• GET /api/stock-supplies (list all with article names)\n";
echo "• GET /api/stock-supplies/{id} (single supply with article details)\n";
echo "• GET /api/stock/article/{articleId}/supplies (article-specific supplies)\n";
echo "\nExample: curl -H 'Authorization: Bearer {token}' http://localhost:8000/api/stock-supplies\n";
