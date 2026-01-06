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
        Schema::table('measurement_units', function (Blueprint $table) {
            $table->decimal('conversion_to_base', 12, 4)->default(1.0000)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('measurement_units', function (Blueprint $table) {
            $table->decimal('conversion_to_base', 10, 4)->default(1.0000)->change();
        });
    }
};
