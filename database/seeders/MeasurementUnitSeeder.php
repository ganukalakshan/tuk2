<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\MeasurementUnit;
use Illuminate\Support\Facades\DB;

class MeasurementUnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing units
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        MeasurementUnit::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $units = [
            // WEIGHT UNITS (Base: Kilogram)
            [
                'unit_name' => 'Kilogram',
                'unit_symbol' => 'kg',
                'is_base' => true,
                'conversion_to_base' => 1.0000,
            ],
            [
                'unit_name' => 'Gram',
                'unit_symbol' => 'g',
                'is_base' => false,
                'conversion_to_base' => 0.0010,
            ],
            [
                'unit_name' => 'Milligram',
                'unit_symbol' => 'mg',
                'is_base' => false,
                'conversion_to_base' => 0.0000010,
            ],
            [
                'unit_name' => 'Ton',
                'unit_symbol' => 't',
                'is_base' => false,
                'conversion_to_base' => 1000.0000,
            ],
            [
                'unit_name' => 'Pound',
                'unit_symbol' => 'lb',
                'is_base' => false,
                'conversion_to_base' => 453.6000,
            ],
            [
                'unit_name' => 'Ounce',
                'unit_symbol' => 'oz',
                'is_base' => false,
                'conversion_to_base' => 28.3000,
            ],

            // VOLUME UNITS (Base: Liter)
            [
                'unit_name' => 'Liter',
                'unit_symbol' => 'L',
                'is_base' => true,
                'conversion_to_base' => 1.0000,
            ],
            [
                'unit_name' => 'Milliliter',
                'unit_symbol' => 'mL',
                'is_base' => false,
                'conversion_to_base' => 0.0010,
            ],
            [
                'unit_name' => 'Gallon',
                'unit_symbol' => 'gal',
                'is_base' => false,
                'conversion_to_base' => 3.7854,
            ],
            [
                'unit_name' => 'Quart',
                'unit_symbol' => 'qt',
                'is_base' => false,
                'conversion_to_base' => 0.9464,
            ],
            [
                'unit_name' => 'Pint',
                'unit_symbol' => 'pt',
                'is_base' => false,
                'conversion_to_base' => 0.4732,
            ],
            [
                'unit_name' => 'Cup',
                'unit_symbol' => 'cup',
                'is_base' => false,
                'conversion_to_base' => 0.2366,
            ],
            [
                'unit_name' => 'Tablespoon',
                'unit_symbol' => 'tbsp',
                'is_base' => false,
                'conversion_to_base' => 0.0148,
            ],
            [
                'unit_name' => 'Teaspoon',
                'unit_symbol' => 'tsp',
                'is_base' => false,
                'conversion_to_base' => 0.0049,
            ],

            // COUNT UNITS (Base: Piece)
            [
                'unit_name' => 'Piece',
                'unit_symbol' => 'pcs',
                'is_base' => true,
                'conversion_to_base' => 1.0000,
            ],
            [
                'unit_name' => 'Dozen',
                'unit_symbol' => 'doz',
                'is_base' => false,
                'conversion_to_base' => 12.0000,
            ],
            [
                'unit_name' => 'Box',
                'unit_symbol' => 'box',
                'is_base' => false,
                'conversion_to_base' => 1.0000,
            ],
            [
                'unit_name' => 'Pack',
                'unit_symbol' => 'pack',
                'is_base' => false,
                'conversion_to_base' => 1.0000,
            ],
            [
                'unit_name' => 'Carton',
                'unit_symbol' => 'ctn',
                'is_base' => false,
                'conversion_to_base' => 1.0000,
            ],
            [
                'unit_name' => 'Bag',
                'unit_symbol' => 'bag',
                'is_base' => false,
                'conversion_to_base' => 1.0000,
            ],
        ];

        foreach ($units as $unit) {
            MeasurementUnit::create($unit);
        }

        $this->command->info('Measurement units seeded successfully!');
        $this->command->info('Total units created: ' . count($units));
    }
}
