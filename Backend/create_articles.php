<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Clear the articles table
\App\Models\Article::query()->delete();
echo "Cleared articles table\n";

// Create a few articles
$article1 = \App\Models\Article::create([
    'barcode' => '123456789012',
    'name' => 'Test Article 1',
    'type' => 'Test Type',
    'price' => 99.99,
    'quantity' => 100
]);

echo "Created article 1: ID = " . $article1->id . ", Barcode = " . $article1->barcode . "\n";

// Try to create another article with the same barcode
try {
    $article2 = \App\Models\Article::create([
        'barcode' => '123456789012', // Same barcode
        'name' => 'Test Article 2',
        'type' => 'Test Type',
        'price' => 199.99,
        'quantity' => 200
    ]);
    echo "Created article 2: ID = " . $article2->id . ", Barcode = " . $article2->barcode . "\n";
} catch (\Exception $e) {
    echo "Error creating article 2: " . $e->getMessage() . "\n";
}

// Create an article with a different barcode
$article3 = \App\Models\Article::create([
    'barcode' => '123456789013', // Different barcode
    'name' => 'Test Article 3',
    'type' => 'Test Type',
    'price' => 299.99,
    'quantity' => 300
]);

echo "Created article 3: ID = " . $article3->id . ", Barcode = " . $article3->barcode . "\n";

// Get all articles
$articles = \App\Models\Article::all();

echo "\nTotal articles: " . $articles->count() . "\n";

// Group articles by barcode
$groupedByBarcode = $articles->groupBy('barcode');

echo "Unique barcodes: " . $groupedByBarcode->count() . "\n";

// Check for duplicate barcodes
$duplicates = $groupedByBarcode->filter(function ($group) {
    return $group->count() > 1;
});

echo "Barcodes with duplicates: " . $duplicates->count() . "\n";

// Print details of duplicate barcodes
foreach ($duplicates as $barcode => $group) {
    echo "Barcode: " . $barcode . " has " . $group->count() . " articles:\n";
    foreach ($group as $article) {
        echo "  ID: " . $article->id . ", Name: " . $article->name . ", Created: " . $article->created_at . "\n";
    }
}

// Print all articles
echo "\nAll articles:\n";
foreach ($articles as $article) {
    echo "ID: " . $article->id . ", Barcode: " . $article->barcode . ", Name: " . $article->name . "\n";
}
