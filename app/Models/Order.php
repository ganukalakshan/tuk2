<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'order_no',
        'order_type',
        'customer_type',
        'customer_name',
        'customer_phone',
        'table_id',
        'pax',
        'delivery_app',
        'app_order_id',
        'waiter_id',
        'cashier_id',
        'status',
        'order_date',
        'order_time',
        'completed_at',
        'subtotal',
        'discount',
        'tax',
        'service_charge',
        'total',
    ];

    protected $casts = [
        'order_date' => 'date',
        'order_time' => 'datetime:H:i:s',
        'completed_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(OrderTicket::class);
    }

    public function bill(): HasOne
    {
        return $this->hasOne(Bill::class);
    }

    public function deliveryAppOrder(): HasOne
    {
        return $this->hasOne(DeliveryAppOrder::class, 'restaurant_order_id');
    }

    public function waiterCommissions(): HasMany
    {
        return $this->hasMany(WaiterCommission::class);
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('subtotal');
        
        // Service charge only for dine-in (10%)
        if ($this->order_type === 'dine_in') {
            $this->service_charge = $this->subtotal * 0.10;
        }
        
        // Tax (15% VAT)
        $this->tax = $this->subtotal * 0.15;
        
        // Total
        $this->total = $this->subtotal + $this->service_charge + $this->tax - $this->discount;
    }

    public static function generateOrderNo(): string
    {
        $date = now()->format('Ymd');
        $lastOrder = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastOrder ? (int)substr($lastOrder->order_no, -6) + 1 : 1;
        
        return "ORD-{$date}-" . str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }
}
