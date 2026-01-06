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
            // Add foreign key constraint linking store_id to departments.store_id
            $table->foreign('store_id')
                ->references('store_id')
                ->on('departments')
                ->onDelete('restrict'); // Prevent deleting department if stores exist
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropForeign(['store_id']);
        });
    }
};
