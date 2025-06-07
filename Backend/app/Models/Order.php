<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 
        'total_amount',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orderLines()
    {
        return $this->hasMany(OrderLine::class);
    }
    
    public function articles()
    {
        return $this->hasManyThrough(Article::class, OrderLine::class, 'order_id', 'id', 'id', 'article_id');
    }

    // Get all reports for this order through order lines
    public function reports()
    {
        return $this->hasManyThrough(Report::class, OrderLine::class, 'order_id', 'order_line_id', 'id', 'id');
    }
}