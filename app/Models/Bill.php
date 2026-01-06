<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    protected $fillable = [
        'bill_no',
        'order_id',
        'subtotal',
        'discount',
        'tax',
        'service_charge',
        'rounding',
        'grand_total',
        'service_charge_applied',
        'paid_amount',
        'balance',
        'payment_status',
        'app_commission',
        'app_commission_rate',
        'billed_by',
        'billed_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'rounding' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'service_charge_applied' => 'boolean',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'app_commission' => 'decimal:2',
        'app_commission_rate' => 'decimal:2',
        'billed_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function billedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'billed_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function updatePaymentStatus(): void
    {
        $this->paid_amount = $this->payments->sum('amount');
        $this->balance = $this->grand_total - $this->paid_amount;

        if ($this->paid_amount >= $this->grand_total) {
            $this->payment_status = 'paid';
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'pending';
        }

        $this->save();
    }

    public static function generateBillNo(): string
    {
        $date = now()->format('Ymd');
        $lastBill = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastBill ? (int)substr($lastBill->bill_no, -6) + 1 : 1;
        
        return "BIL-{$date}-" . str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }
}
