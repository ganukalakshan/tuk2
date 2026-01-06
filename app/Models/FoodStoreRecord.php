<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoodStoreRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'user_id',
        'quantity',
        'expiry_date',
        'cost',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
