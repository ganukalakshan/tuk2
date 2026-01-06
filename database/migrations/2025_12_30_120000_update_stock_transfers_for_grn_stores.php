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
        Schema::table('stock_transfers', function (Blueprint $table) {
            // Update from_location to include grn_store
            $table->dropColumn('from_location');
            $table->dropColumn('to_location');
        });

        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->enum('from_location', ['grn_store', 'hot_kitchen', 'beverage', 'pastry', 'bakery'])->after('transfer_no');
            $table->enum('to_location', ['grn_store', 'hot_kitchen', 'beverage', 'pastry', 'bakery'])->after('from_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropColumn('from_location');
            $table->dropColumn('to_location');
        });

        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->enum('from_location', ['store', 'kitchen', 'bar'])->after('transfer_no');
            $table->enum('to_location', ['store', 'kitchen', 'bar'])->after('from_location');
        });
    }
};
