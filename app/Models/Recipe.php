<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    protected $fillable = [
        'menu_item_id',
        'version',
        'standard_yield',
        'instructions',
        'is_current',
        'created_by',
    ];

    protected $casts = [
        'standard_yield' => 'decimal:3',
        'is_current' => 'boolean',
    ];

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function calculateCost(): float
    {
        return $this->items->sum(function ($item) {
            return $item->quantity * $item->material->avg_cost;
        });
    }
}
