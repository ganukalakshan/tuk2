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
        Schema::create('bakery_store', function (Blueprint $table) {
            $table->id();
            $table->string('material_name');
            $table->decimal('quantity', 10, 2);
            $table->string('unit')->nullable();
            $table->foreignId('grn_id')->nullable()->constrained('grns')->onDelete('set null');
            $table->foreignId('material_id')->nullable()->constrained('materials')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bakery_store');
    }
};
