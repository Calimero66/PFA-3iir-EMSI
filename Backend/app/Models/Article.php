<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'barcode',
        'name',
        'type',
        'price',
        'initial_quantity',
    ];

    public function stock()
    {
        return $this->hasOne(Stock::class);
    }
}