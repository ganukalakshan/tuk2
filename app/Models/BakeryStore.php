<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BakeryStore extends Model
{
    protected $table = 'bakery_store';
    
    protected $fillable = [
        'material_name',
        'quantity',
        'unit',
        'grn_id',
        'material_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function grn()
    {
        return $this->belongsTo(Grn::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
