<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    // Department IDs (match store_id in stores table)
    const KITCHEN = 1;
    const BAKERY = 2;
    const PASTRY = 3;
    const BEVERAGE = 4;

    protected $primaryKey = 'store_id';
    
    protected $fillable = [
        'store_id',
        'name',
        'key',
        'description',
        'is_active',
    ];

    protected $casts = [
        'store_id' => 'integer',
        'is_active' => 'boolean',
    ];

    // Disable auto-increment since we use fixed IDs
    public $incrementing = false;
    protected $keyType = 'integer';

    /**
     * Get all stores in this department
     */
    public function stores()
    {
        return $this->hasMany(Store::class, 'store_id', 'store_id');
    }

    /**
     * Get all consumptions for this department
     */
    public function consumptions()
    {
        return $this->hasMany(StoreConsumption::class, 'store_id', 'store_id');
    }

    /**
     * Get all departments as array
     */
    public static function getAllDepartments()
    {
        return [
            self::KITCHEN => 'Hot Kitchen Store',
            self::BAKERY => 'Bakery Store',
            self::PASTRY => 'Pastry Store',
            self::BEVERAGE => 'Beverage Store',
        ];
    }

    /**
     * Get department name by ID
     */
    public static function getDepartmentName($id)
    {
        return match($id) {
            self::KITCHEN => 'Hot Kitchen Store',
            self::BAKERY => 'Bakery Store',
            self::PASTRY => 'Pastry Store',
            self::BEVERAGE => 'Beverage Store',
            default => null,
        };
    }

    /**
     * Get department key by ID
     */
    public static function getDepartmentKey($id)
    {
        return match($id) {
            self::KITCHEN => 'hot_kitchen',
            self::BAKERY => 'bakery',
            self::PASTRY => 'pastry',
            self::BEVERAGE => 'beverage',
            default => null,
        };
    }
}
