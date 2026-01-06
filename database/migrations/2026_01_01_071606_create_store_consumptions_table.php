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
        Schema::create('store_consumptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_batch_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->unsignedTinyInteger('store_id');
            $table->string('store_name');
            $table->decimal('quantity_consumed', 10, 2);
            $table->string('unit');
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->string('reference_type')->nullable(); // sale, recipe, wastage, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('consumed_at');
            $table->timestamps();
            
            // Indexes for reporting and queries
            $table->index(['material_id', 'store_id', 'consumed_at']);
            $table->index(['store_batch_id']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_consumptions');
    }
};
