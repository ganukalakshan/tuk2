<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    // Store ID Constants
    const STORE_KITCHEN = 1;
    const STORE_BAKERY = 2;
    const STORE_PASTRY = 3;
    const STORE_BEVERAGE = 4;

    protected $fillable = [
        'material_name',
        'original_quantity',
        'remaining_quantity',
        'unit',
        'unit_id',
        'store_name',
        'store_id',
        'material_id',
        'grn_id',
        'transferred_at',
        'batch_number',
        'expiry_date',
        'cost_per_unit',
    ];

    protected $casts = [
        'original_quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'store_id' => 'integer',
        'transferred_at' => 'datetime',
        'expiry_date' => 'date',
    ];

    /**
     * Get the material associated with this store record
     */
    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * Get the GRN associated with this store record
     */
    public function grn()
    {
        return $this->belongsTo(Grn::class);
    }

    /**
     * Get the department this store belongs to
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'store_id', 'store_id');
    }

    /**
     * Get store ID by store name
     */
    public static function getStoreId($storeName)
    {
        return match($storeName) {
            'hot_kitchen' => self::STORE_KITCHEN,
            'bakery' => self::STORE_BAKERY,
            'pastry' => self::STORE_PASTRY,
            'beverage' => self::STORE_BEVERAGE,
            default => null,
        };
    }

    /**
     * Get store name by store ID
     */
    public static function getStoreName($storeId)
    {
        return match($storeId) {
            self::STORE_KITCHEN => 'hot_kitchen',
            self::STORE_BAKERY => 'bakery',
            self::STORE_PASTRY => 'pastry',
            self::STORE_BEVERAGE => 'beverage',
            default => null,
        };
    }

    /**
     * Get all store types
     */
    public static function getAllStoreTypes()
    {
        return [
            self::STORE_KITCHEN => 'Hot Kitchen Store',
            self::STORE_BAKERY => 'Bakery Store',
            self::STORE_PASTRY => 'Pastry Store',
            self::STORE_BEVERAGE => 'Beverage Store',
        ];
    }

    /**
     * Get consumptions for this batch
     */
    public function consumptions()
    {
        return $this->hasMany(StoreConsumption::class, 'store_batch_id');
    }

    /**
     * Check if batch is fully consumed
     */
    public function isFullyConsumed()
    {
        return $this->remaining_quantity <= 0;
    }

    /**
     * Check if batch is available for consumption
     */
    public function isAvailable()
    {
        return $this->remaining_quantity > 0;
    }

    /**
     * Get total consumed quantity for this batch
     */
    public function getTotalConsumedAttribute()
    {
        return $this->original_quantity - $this->remaining_quantity;
    }
}
