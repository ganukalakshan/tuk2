<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            [
                'store_id' => 1,
                'name' => 'Hot Kitchen Store',
                'key' => 'hot_kitchen',
                'description' => 'Main kitchen store for hot food preparation materials',
                'is_active' => true,
            ],
            [
                'store_id' => 2,
                'name' => 'Bakery Store',
                'key' => 'bakery',
                'description' => 'Bakery department store for baking materials',
                'is_active' => true,
            ],
            [
                'store_id' => 3,
                'name' => 'Pastry Store',
                'key' => 'pastry',
                'description' => 'Pastry department store for dessert and pastry materials',
                'is_active' => true,
            ],
            [
                'store_id' => 4,
                'name' => 'Beverage Store',
                'key' => 'beverage',
                'description' => 'Beverage department store for drinks and beverage materials',
                'is_active' => true,
            ],
        ];

        foreach ($departments as $department) {
            \App\Models\Department::updateOrCreate(
                ['store_id' => $department['store_id']],
                $department
            );
        }

        $this->command->info('Departments seeded successfully!');
        $this->command->info('1 = Hot Kitchen Store');
        $this->command->info('2 = Bakery Store');
        $this->command->info('3 = Pastry Store');
        $this->command->info('4 = Beverage Store');
    }
}
