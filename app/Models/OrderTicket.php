<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderTicket extends Model
{
    protected $fillable = [
        'ticket_no',
        'order_id',
        'ticket_type',
        'station',
        'status',
        'printed_at',
        'prepared_by',
        'served_by',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function preparedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }

    public function servedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'served_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TicketItem::class, 'ticket_id');
    }

    public static function generateTicketNo(string $type): string
    {
        $prefix = strtoupper($type);
        $date = now()->format('Ymd');
        $lastTicket = self::where('ticket_type', $type)
            ->whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastTicket ? (int)substr($lastTicket->ticket_no, -6) + 1 : 1;
        
        return "{$prefix}-{$date}-" . str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }
}
