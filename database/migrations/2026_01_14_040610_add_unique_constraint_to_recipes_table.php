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
        Schema::table('recipes', function (Blueprint $table) {
            // Add unique constraint on menu_item_id and version to prevent duplicate recipes
            $table->unique(['menu_item_id', 'version'], 'recipes_menu_item_version_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            // Drop the unique constraint
            $table->dropUnique('recipes_menu_item_version_unique');
        });
    }
};
