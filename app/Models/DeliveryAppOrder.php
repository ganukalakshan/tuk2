<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryAppOrder extends Model
{
    protected $fillable = [
        'app_order_id',
        'app_name',
        'customer_name',
        'customer_phone',
        'delivery_address',
        'special_instructions',
        'order_total',
        'commission_rate',
        'commission_amount',
        'restaurant_earning',
        'app_order_time',
        'expected_pickup_time',
        'actual_pickup_time',
        'status',
        'restaurant_order_id',
    ];

    protected $casts = [
        'order_total' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'restaurant_earning' => 'decimal:2',
        'app_order_time' => 'datetime',
        'expected_pickup_time' => 'datetime',
        'actual_pickup_time' => 'datetime',
    ];

    public function restaurantOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'restaurant_order_id');
    }

    public function calculateCommission(): void
    {
        $this->commission_amount = $this->order_total * ($this->commission_rate / 100);
        $this->restaurant_earning = $this->order_total - $this->commission_amount;
    }

    public static function getCommissionRate(string $appName): float
    {
        return match ($appName) {
            'uber_eats' => 30.00,
            'pickme_food' => 25.00,
            default => 20.00,
        };
    }
}
