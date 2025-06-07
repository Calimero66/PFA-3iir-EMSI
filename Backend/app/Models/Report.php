<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'type',
        'report_date',
        'user_id',
        'stock_movement_id',
        'supplier_id',
        'order_line_id',
        'details'
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockMovement()
    {
        return $this->belongsTo(StockMovement::class);
    }

    public function orderLine()
    {
        return $this->belongsTo(OrderLine::class);
    }

    // Helper relationship to get the order through the order line
    public function order()
    {
        return $this->hasOneThrough(Order::class, OrderLine::class, 'id', 'id', 'order_line_id', 'order_id');
    }
}
