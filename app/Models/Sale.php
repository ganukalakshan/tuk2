<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'order_id',
        'customer_id',
        'user_id',
        'table_id',
        'table_number',
        'status',
        'subtotal',
        'service_charge',
        'service_charge_amount',
        'total_amount',
        'cash_amount',
        'card_amount',
        'pickme_amount',
        'uber_amount',
        'additional_payment',
        'balance',
        'payment_method',
        'kitchen_note',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'cash_amount' => 'decimal:2',
        'card_amount' => 'decimal:2',
        'pickme_amount' => 'decimal:2',
        'uber_amount' => 'decimal:2',
        'additional_payment' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function salesItems(): HasMany
    {
        return $this->hasMany(SalesItem::class);
    }

    public static function generateOrderId(): string
    {
        $prefix = 'CS';
        $lastOrder = self::where('order_id', 'like', $prefix . '/%')
            ->orderBy('id', 'desc')
            ->first();
            
        if ($lastOrder) {
            $lastNumber = (int) explode('/', $lastOrder->order_id)[1];
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }
        
        return $prefix . '/' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
