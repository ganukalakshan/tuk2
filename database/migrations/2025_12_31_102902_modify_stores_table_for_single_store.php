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
            // Drop old columns that referenced sub-store tables
            $table->dropColumn(['store_table_name', 'store_record_id']);
            
            // Add store_id to identify which store (1=Kitchen, 2=Bakery, 3=Pastry, 4=Beverage)
            $table->unsignedTinyInteger('store_id')->after('store_name');
            $table->index('store_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('store_id');
            $table->string('store_table_name')->nullable();
            $table->unsignedBigInteger('store_record_id')->nullable();
        });
    }
};
