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
        Schema::table('stores', function (Blueprint $table) {
            // Rename quantity to original_quantity (for audit)
            $table->renameColumn('quantity', 'original_quantity');
        });

        Schema::table('stores', function (Blueprint $table) {
            // Add remaining_quantity (mutable, tracks consumption)
            $table->decimal('remaining_quantity', 10, 2)->after('original_quantity');
            
            // Add transferred_at for FIFO ordering
            $table->timestamp('transferred_at')->nullable()->after('remaining_quantity');
            
            // Add optional batch tracking fields
            $table->string('batch_number')->nullable()->after('transferred_at');
            $table->date('expiry_date')->nullable()->after('batch_number');
            $table->decimal('cost_per_unit', 10, 2)->nullable()->after('expiry_date');
            
            // Add indexes for FIFO queries
            $table->index(['material_id', 'store_id', 'remaining_quantity']);
            $table->index(['material_id', 'store_id', 'transferred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropIndex(['material_id', 'store_id', 'remaining_quantity']);
            $table->dropIndex(['material_id', 'store_id', 'transferred_at']);
            
            $table->dropColumn([
                'remaining_quantity',
                'transferred_at',
                'batch_number',
                'expiry_date',
                'cost_per_unit'
            ]);
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->renameColumn('original_quantity', 'quantity');
        });
    }
};
