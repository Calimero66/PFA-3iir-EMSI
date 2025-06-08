<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Article;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\StockSupply;

echo "=== Stock Supplies with Article Names AND Prices Demo ===\n\n";

// Get existing data or create if needed
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

// Create articles with different prices
$articles = [];
$articleData = [
    ['name' => 'Premium Milk', 'barcode' => '123456789001', 'price' => 2.50],
    ['name' => 'Organic Beef', 'barcode' => '123456789002', 'price' => 15.00],
    ['name' => 'Artisan Bread', 'barcode' => '123456789003', 'price' => 4.25],
    ['name' => 'Free Range Eggs', 'barcode' => '123456789004', 'price' => 6.75],
];

foreach ($articleData as $data) {
    $article = Article::firstOrCreate(
        ['barcode' => $data['barcode']],
        [
            'name' => $data['name'],
            'price' => $data['price'],
            'quantity' => 0,
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
        ]
    );
    $articles[] = $article;
}

echo "✓ Created/found demo articles with different prices\n";

// Create stock supplies
foreach ($articles as $index => $article) {
    $quantity = rand(25, 100);
    
    StockSupply::firstOrCreate(
        [
            'article_id' => $article->id,
            'supply_date' => now()->subDays($index)->toDateString()
        ],
        [
            'quantity' => $quantity,
            'notes' => "Supply for {$article->name} at \${$article->price} each"
        ]
    );
}

echo "✓ Created stock supplies for all articles\n\n";

// Demonstrate API responses with prices
echo "=== API Responses with Article Names AND Prices ===\n\n";

// Simulate the index endpoint response
$supplies = StockSupply::with(['article.category', 'article.supplier'])
    ->orderBy('created_at', 'desc')
    ->take(3)
    ->get();

echo "--- GET /api/stock-supplies (List with Names & Prices) ---\n";
foreach ($supplies as $supply) {
    if ($supply->article) {
        $response = [
            'id' => $supply->id,
            'article_id' => $supply->article_id,
            'article_name' => $supply->article->name,
            'article_barcode' => $supply->article->barcode,
            'article_price' => $supply->article->price,
            'category_name' => $supply->article->category ? $supply->article->category->name : 'Uncategorized',
            'supplier_name' => $supply->article->supplier ? $supply->article->supplier->name : 'No Supplier',
            'quantity' => $supply->quantity,
            'supply_date' => $supply->supply_date,
            'notes' => $supply->notes,
        ];
        
        echo "• Supply #{$response['id']}: {$response['quantity']} units of '{$response['article_name']}'\n";
        echo "  Price: \${$response['article_price']} each | Total Value: \$" . number_format($response['quantity'] * $response['article_price'], 2) . "\n";
        echo "  Barcode: {$response['article_barcode']} | Category: {$response['category_name']}\n";
        echo "  Supplier: {$response['supplier_name']}\n";
        echo "  Notes: {$response['notes']}\n\n";
    }
}

// Show single supply response
$singleSupply = $supplies->first();
if ($singleSupply && $singleSupply->article) {
    echo "--- GET /api/stock-supplies/{$singleSupply->id} (Single Supply with Price) ---\n";
    $singleResponse = [
        'id' => $singleSupply->id,
        'article_id' => $singleSupply->article_id,
        'article_name' => $singleSupply->article->name,
        'article_barcode' => $singleSupply->article->barcode,
        'article_price' => $singleSupply->article->price,
        'category_name' => $singleSupply->article->category ? $singleSupply->article->category->name : 'Uncategorized',
        'supplier_name' => $singleSupply->article->supplier ? $singleSupply->article->supplier->name : 'No Supplier',
        'quantity' => $singleSupply->quantity,
        'supply_date' => $singleSupply->supply_date,
        'notes' => $singleSupply->notes,
    ];
    
    echo json_encode($singleResponse, JSON_PRETTY_PRINT) . "\n\n";
}

// Show article-specific supplies with prices
$firstArticle = $articles[0];
$articleSupplies = StockSupply::where('article_id', $firstArticle->id)->get();

echo "--- GET /api/stock/article/{$firstArticle->id}/supplies (Article Supplies with Price) ---\n";
echo "Article: {$firstArticle->name} (Price: \${$firstArticle->price})\n";
echo "Supplies:\n";

foreach ($articleSupplies as $supply) {
    $supplyResponse = [
        'id' => $supply->id,
        'article_id' => $supply->article_id,
        'article_name' => $firstArticle->name,
        'article_barcode' => $firstArticle->barcode,
        'article_price' => $firstArticle->price,
        'quantity' => $supply->quantity,
        'supply_date' => $supply->supply_date,
        'notes' => $supply->notes,
    ];
    
    echo "• Supply #{$supplyResponse['id']}: {$supplyResponse['quantity']} units at \${$supplyResponse['article_price']} each\n";
    echo "  Total Value: \$" . number_format($supplyResponse['quantity'] * $supplyResponse['article_price'], 2) . "\n";
    echo "  Date: {$supplyResponse['supply_date']}\n\n";
}

echo "=== Price Information Benefits ===\n";
echo "✓ Immediate access to article prices without additional API calls\n";
echo "✓ Can calculate total supply value (quantity × price) instantly\n";
echo "✓ Better inventory valuation and reporting\n";
echo "✓ Enhanced financial tracking and analysis\n";
echo "✓ Consistent pricing information across all endpoints\n\n";

echo "=== All Endpoints Now Include ===\n";
echo "• article_name - Product name for display\n";
echo "• article_barcode - Product identification\n";
echo "• article_price - Current unit price\n";
echo "• category_name - Product category\n";
echo "• supplier_name - Supplier information\n";
echo "• quantity - Supply quantity\n";
echo "• Plus all original stock supply data\n\n";

echo "=== Example Frontend Usage ===\n";
echo "// Calculate total supply value\n";
echo "const totalValue = supply.quantity * supply.article_price;\n";
echo "console.log(`\${supply.quantity} units of \${supply.article_name} = \$\${totalValue}`);\n\n";

echo "// Display in table with all info\n";
echo "<tr>\n";
echo "  <td>{\$supply.article_name}</td>\n";
echo "  <td>{\$supply.article_barcode}</td>\n";
echo "  <td>\${\$supply.article_price}</td>\n";
echo "  <td>{\$supply.quantity}</td>\n";
echo "  <td>\${\$supply.quantity * \$supply.article_price}</td>\n";
echo "  <td>{\$supply.category_name}</td>\n";
echo "</tr>\n\n";

echo "=== Demo Complete ===\n";
echo "Your stock supplies API now includes both article names AND prices!\n";
