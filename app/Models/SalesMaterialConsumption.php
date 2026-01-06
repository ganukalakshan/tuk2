<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesMaterialConsumption extends Model
{
    protected $table = 'sales_material_consumption';

    protected $fillable = [
        'sale_id',
        'order_id',
        'menu_item_id',
        'menu_item_name',
        'material_id',
        'material_name',
        'quantity_consumed',
        'unit',
        'cost_per_unit',
        'total_cost',
        'store_id',
        'store_name',
        'batches_used',
    ];

    protected $casts = [
        'quantity_consumed' => 'decimal:3',
        'cost_per_unit' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'store_id' => 'integer',
        'batches_used' => 'integer',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
