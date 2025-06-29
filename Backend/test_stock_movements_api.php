<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StockMovement;
use App\Models\Article;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\User;

echo "=== Testing Stock Movements API ===\n\n";

// Check if we have any stock movements
$movementsCount = StockMovement::count();
echo "Total stock movements in database: {$movementsCount}\n\n";

if ($movementsCount === 0) {
    echo "No stock movements found. Let's create some test data...\n\n";
    
    // Create test data
    $user = User::firstOrCreate(
        ['email' => 'test@example.com'],
        [
            'name' => 'Test User',
            'role' => 'Admin',
            'password' => bcrypt('password')
        ]
    );
    
    $category = Category::firstOrCreate(
        ['name' => 'Test Category'],
        ['description' => 'Test category for stock movements']
    );
    
    $supplier = Supplier::firstOrCreate(
        ['name' => 'Test Supplier'],
        [
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'supplier@test.com'
        ]
    );
    
    // Create test articles
    $articles = [];
    for ($i = 1; $i <= 3; $i++) {
        $articles[] = Article::firstOrCreate(
            ['barcode' => "TEST00{$i}"],
            [
                'name' => "Test Article {$i}",
                'price' => 10.00 + $i,
                'quantity' => 50,
                'category_id' => $category->id,
                'supplier_id' => $supplier->id,
                'user_id' => $user->id
            ]
        );
    }
    
    // Create test stock movements
    foreach ($articles as $index => $article) {
        // Create an 'in' movement
        StockMovement::create([
            'article_id' => $article->id,
            'type' => 'in',
            'quantity' => 100,
            'date' => now()->subDays($index + 1),
            'reason' => "Initial stock for {$article->name}"
        ]);
        
        // Create an 'out' movement
        StockMovement::create([
            'article_id' => $article->id,
            'type' => 'out',
            'quantity' => 25,
            'date' => now()->subHours($index + 1),
            'reason' => "Sale of {$article->name}"
        ]);
    }
    
    echo "✓ Created test data with stock movements\n\n";
}

// Test the API functionality
echo "=== Testing Stock Movement Controller Methods ===\n\n";

// Test index method
echo "1. Testing index() method:\n";
$controller = new \App\Http\Controllers\StockMovementController();
$indexResponse = $controller->index();
$indexData = json_decode($indexResponse->getContent(), true);

echo "   Status: " . $indexResponse->getStatusCode() . "\n";
echo "   Success: " . ($indexData['success'] ? 'true' : 'false') . "\n";
echo "   Total movements: " . $indexData['total'] . "\n";

if (!empty($indexData['data'])) {
    $firstMovement = $indexData['data'][0];
    echo "   First movement:\n";
    echo "     - ID: {$firstMovement['id']}\n";
    echo "     - Type: {$firstMovement['type']}\n";
    echo "     - Quantity: {$firstMovement['quantity']}\n";
    echo "     - Article: {$firstMovement['article']['name']}\n";
    echo "     - Date: {$firstMovement['date']}\n";
}

echo "\n";

// Test show method
if (!empty($indexData['data'])) {
    echo "2. Testing show() method:\n";
    $firstMovementId = $indexData['data'][0]['id'];
    $stockMovement = StockMovement::find($firstMovementId);
    
    $showResponse = $controller->show($stockMovement);
    $showData = json_decode($showResponse->getContent(), true);
    
    echo "   Status: " . $showResponse->getStatusCode() . "\n";
    echo "   Success: " . ($showData['success'] ? 'true' : 'false') . "\n";
    echo "   Movement ID: {$showData['data']['id']}\n";
    echo "   Article: {$showData['data']['article']['name']}\n";
    echo "   Category: " . ($showData['data']['article']['category']['name'] ?? 'N/A') . "\n";
    echo "   Supplier: " . ($showData['data']['article']['supplier']['name'] ?? 'N/A') . "\n";
}

echo "\n=== Stock Movements API Test Complete ===\n";
