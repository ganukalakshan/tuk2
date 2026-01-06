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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('material_name');
            $table->decimal('quantity', 10, 2);
            $table->string('unit')->nullable();
            $table->string('store_name'); // hot_kitchen, beverage, pastry, bakery
            $table->string('store_table_name'); // The actual table name (hot_kitchen_store, beverage_store, etc.)
            $table->unsignedBigInteger('store_record_id')->nullable(); // ID in the respective sub-store table
            $table->foreignId('material_id')->nullable()->constrained('materials')->onDelete('set null');
            $table->foreignId('grn_id')->nullable()->constrained('grns')->onDelete('set null');
            $table->timestamps();
            
            // Indexes for efficient queries
            $table->index('store_name');
            $table->index('store_table_name');
            $table->index('material_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
