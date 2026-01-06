<?php

namespace Database\Seeders;

use App\Models\CompanyInformation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        CompanyInformation::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Coffee Shop',
                'phone' => '',
                'phone_secondary' => '',
                'address' => '',
                'email' => '',
                'tax_id' => '',
                'vat_number' => '',
                'currency' => 'USD',
            ]
        );
    }
}
