<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 12);
            $table->string('name');
            // $table->string('type')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('quantity')->default(0);
            $table->foreignId('category_id')->nullable()->constrained('categories', 'id')->onDelete('set null');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers', 'id')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
