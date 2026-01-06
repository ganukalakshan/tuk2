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
        Schema::table('wastage', function (Blueprint $table) {
            // Make material_id nullable to allow menu items
            $table->foreignId('material_id')->nullable()->change();
            // Make unit_id nullable for food store items
            $table->foreignId('unit_id')->nullable()->change();
            // Add menu_item_id for food store wastage
            $table->foreignId('menu_item_id')->nullable()->after('material_id')->constrained('menu_items')->onDelete('cascade');
            // Add food_store_record_id for reference
            $table->unsignedBigInteger('food_store_record_id')->nullable()->after('menu_item_id');
            // Add cost column for tracking wastage cost
            $table->decimal('cost', 12, 2)->nullable()->after('quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wastage', function (Blueprint $table) {
            $table->dropForeign(['menu_item_id']);
            $table->dropColumn(['menu_item_id', 'food_store_record_id', 'cost']);
        });
    }
};
