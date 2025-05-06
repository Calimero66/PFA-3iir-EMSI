<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = ['article_id', 'type', 'quantity', 'date', 'reason'];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function report()
    {
        return $this->hasOne(Report::class);
    }
}
