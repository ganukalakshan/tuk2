<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'bill_id',
        'method',
        'amount',
        'tip_amount',
        'reference',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'tip_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    protected static function booted(): void
    {
        static::created(function ($payment) {
            $payment->bill->updatePaymentStatus();
        });

        static::deleted(function ($payment) {
            $payment->bill->updatePaymentStatus();
        });
    }
}
