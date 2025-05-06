<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['user_id', 'article_id', 'supplier_id', 'quantity', 'created_at'];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function orderLines()
    {
        return $this->hasMany(OrderLine::class);
    }
}
