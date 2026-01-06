<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeasurementUnit extends Model
{
    protected $fillable = [
        'unit_name',
        'unit_symbol',
        'is_base',
        'conversion_to_base',
    ];

    protected $casts = [
        'is_base' => 'boolean',
        'conversion_to_base' => 'decimal:4',
    ];

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class, 'storage_unit_id');
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class, 'unit_id');
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class, 'unit_id');
    }
}
