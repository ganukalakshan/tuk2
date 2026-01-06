<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if column exists before renaming
        if (Schema::hasColumn('measurement_units', 'unit_type')) {
            Schema::table('measurement_units', function (Blueprint $table) {
                $table->renameColumn('unit_type', 'unit_symbol');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('measurement_units', function (Blueprint $table) {
            $table->renameColumn('unit_symbol', 'unit_type');
        });
    }
};
