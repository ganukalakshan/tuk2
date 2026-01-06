<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Restaurant extends Model
{
    protected $table = 'restaurant';

    protected $fillable = [
        'name',
        'phone',
        'phone_secondary',
        'address',
        'email',
        'tax_id',
        'vat_number',
        'currency',
    ];
}
