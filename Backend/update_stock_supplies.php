<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get all stock supplies
$stockSupplies = \App\Models\StockSupply::all();
$count = 0;

echo "Updating stock supplies with category_id and supplier_id...\n";

foreach ($stockSupplies as $supply) {
    $article = \App\Models\Article::find($supply->article_id);
    
    if ($article) {
        $supply->category_id = $article->category_id;
        $supply->supplier_id = $article->supplier_id;
        $supply->save();
        $count++;
    }
}

echo "Updated {$count} stock supplies.\n";
