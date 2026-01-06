<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('measurement_units', function (Blueprint $table) {
            $table->id();
            $table->string('unit_name', 20)->unique();
            $table->string('unit_symbol', 10);
            $table->boolean('is_base')->default(false);
            $table->decimal('conversion_to_base', 10, 4)->default(1.0000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('measurement_units');
    }
};
