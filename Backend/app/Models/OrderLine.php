<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderLine extends Model
{
    
    protected $fillable = ['order_id', 'quantity'];
    
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function report()
    {
        return $this->hasOne(Report::class);
    }
}
