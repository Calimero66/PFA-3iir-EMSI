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
        Schema::create('stock_supplies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles', 'id')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers', 'id')->onDelete('cascade');
            $table->integer('quantity');
            $table->dateTime('supply_date');
            // $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_supplies');
    }
};
