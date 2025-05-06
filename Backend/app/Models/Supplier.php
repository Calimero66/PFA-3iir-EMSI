<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['name', 'address', 'phone', 'email'];
    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function stockSupplies()
    {
        return $this->hasMany(StockSupply::class);
    }
}
