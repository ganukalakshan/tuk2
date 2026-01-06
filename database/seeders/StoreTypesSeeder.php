<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StoreTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Store IDs are defined as constants in the Store model
        // 1 = Hot Kitchen Store (hot_kitchen)
        // 2 = Bakery Store (bakery)
        // 3 = Pastry Store (pastry)
        // 4 = Beverage Store (beverage)
        
        $this->command->info('Store types are defined as constants in App\Models\Store:');
        $this->command->info('1 = Hot Kitchen Store');
        $this->command->info('2 = Bakery Store');
        $this->command->info('3 = Pastry Store');
        $this->command->info('4 = Beverage Store');
    }
}
