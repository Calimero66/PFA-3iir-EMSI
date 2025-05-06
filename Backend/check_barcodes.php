<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get all articles
$articles = \App\Models\Article::all();

echo "Total articles: " . $articles->count() . "\n";

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
