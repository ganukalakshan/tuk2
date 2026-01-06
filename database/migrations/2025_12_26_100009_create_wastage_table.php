<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wastage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials');
            $table->decimal('quantity', 10, 3);
            $table->foreignId('unit_id')->constrained('measurement_units');
            $table->text('reason')->nullable();
            $table->enum('location', ['store', 'kitchen', 'bar']);
            $table->foreignId('recorded_by')->nullable()->constrained('users');
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wastage');
    }
};
