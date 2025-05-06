<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockSupply extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'supplier_id',
        'quantity',
        'supply_date',
        'notes'
    ];

    protected $casts = [
        'supply_date' => 'datetime',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
