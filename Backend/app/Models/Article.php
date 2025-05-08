<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    // protected $fillable = ['barcode', 'name', 'type', 'price', 'quantity', 'category_id', 'supplier_id'];
    protected $fillable = ['barcode', 'name', 'price', 'quantity', 'category_id', 'supplier_id'];


    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }


    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function stockSupplies()
    {
        return $this->hasMany(StockSupply::class);
    }
}