<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyInformation extends Model
{
    protected $table = 'company_information';

    protected $fillable = [
        'name',
        'phone',
        'phone_secondary',
        'address',
        'email',
        'tax_id',
        'vat_number',
        'currency',
    ];}