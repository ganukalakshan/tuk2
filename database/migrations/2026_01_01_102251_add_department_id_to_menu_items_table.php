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
        Schema::table('menu_items', function (Blueprint $table) {
            // Check if column exists and drop it if necessary (may have wrong type)
            if (Schema::hasColumn('menu_items', 'department_id')) {
                $table->dropColumn('department_id');
            }
        });
        
        Schema::table('menu_items', function (Blueprint $table) {
            $table->tinyInteger('department_id')->unsigned()->nullable()->after('category_id');
            $table->foreign('department_id')->references('store_id')->on('departments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });
    }
};
