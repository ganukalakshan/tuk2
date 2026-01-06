<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableOrder extends Model
{
    protected $fillable = [
        'table_number',
        'order_id',
        'customer_id',
        'items',
        'subtotal',
        'service_charge',
        'service_charge_amount',
        'total_amount',
        'kitchen_note',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'service_charge_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public static function generateOrderId(): string
    {
        $prefix = 'TBL';
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
