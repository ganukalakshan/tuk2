<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreConsumption extends Model
{
    protected $fillable = [
        'store_batch_id',
        'material_id',
        'store_id',
        'store_name',
        'quantity_consumed',
        'unit',
        'cost_per_unit',
        'total_cost',
        'reference_type',
        'reference_id',
        'notes',
        'consumed_at',
    ];

    protected $casts = [
        'quantity_consumed' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'store_id' => 'integer',
        'consumed_at' => 'datetime',
    ];

    /**
     * Get the store batch this consumption is from
     */
    public function storeBatch()
    {
        return $this->belongsTo(Store::class, 'store_batch_id');
    }

    /**
     * Get the material
     */
    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
