<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update stores table cost_per_unit from grn_items where grn_id is present
        DB::statement("
            UPDATE stores s
            INNER JOIN grn_items gi ON s.grn_id = gi.grn_id AND s.material_id = gi.material_id
            SET s.cost_per_unit = gi.unit_price
            WHERE s.cost_per_unit IS NULL AND s.grn_id IS NOT NULL
        ");
        
        // For stores without grn_id, try to get the average cost from grn_items by material_id
        DB::statement("
            UPDATE stores s
            INNER JOIN (
                SELECT 
                    gi.material_id,
                    AVG(gi.unit_price) as avg_price
                FROM grn_items gi
                WHERE gi.unit_price IS NOT NULL
                GROUP BY gi.material_id
            ) as avg_costs ON s.material_id = avg_costs.material_id
            SET s.cost_per_unit = avg_costs.avg_price
            WHERE s.cost_per_unit IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally, you can set cost_per_unit back to null if needed
        // DB::statement("UPDATE stores SET cost_per_unit = NULL");
    }
};
