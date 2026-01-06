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
        Schema::create('sales_material_consumption', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->string('order_id')->nullable();
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->string('menu_item_name');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->string('material_name');
            $table->decimal('quantity_consumed', 10, 3);
            $table->string('unit', 50);
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->unsignedTinyInteger('store_id');
            $table->string('store_name');
            $table->integer('batches_used')->default(1);
            $table->timestamps();

            // Indexes for faster queries
            $table->index(['sale_id', 'created_at']);
            $table->index(['material_id', 'created_at']);
            $table->index(['order_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_material_consumption');
    }
};
