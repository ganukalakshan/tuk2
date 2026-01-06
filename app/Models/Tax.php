<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    protected $fillable = [
        'name',
        'code',
        'rate',
        'type',
        'is_active',
        'applies_to',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public static function getActiveTaxes(?string $category = null): \Illuminate\Database\Eloquent\Collection
    {
        return self::where('is_active', true)
            ->where(function ($query) use ($category) {
                $query->where('applies_to', 'all');
                if ($category) {
                    $query->orWhere('applies_to', $category);
                }
            })
            ->get();
    }

    public function calculateTax(float $amount): float
    {
        return $amount * ($this->rate / 100);
    }
}
