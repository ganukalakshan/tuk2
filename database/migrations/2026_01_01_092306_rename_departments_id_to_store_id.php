<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if foreign key exists before trying to drop it
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'stores' 
            AND COLUMN_NAME = 'store_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ");

        // Drop foreign key from stores table if it exists
        if (!empty($foreignKeys)) {
            Schema::table('stores', function (Blueprint $table) {
                $table->dropForeign(['store_id']);
            });
        }

        // Check if the departments table has 'id' column (hasn't been renamed yet)
        $columns = DB::select("SHOW COLUMNS FROM departments WHERE Field = 'id'");
        if (!empty($columns)) {
            // Rename id to store_id in departments table
            Schema::table('departments', function (Blueprint $table) {
                $table->renameColumn('id', 'store_id');
            });
        }

        // Re-add foreign key if it was dropped and the relationship should exist
        if (!empty($foreignKeys)) {
            Schema::table('stores', function (Blueprint $table) {
                $table->foreign('store_id')->references('store_id')->on('departments')->onDelete('restrict');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if foreign key exists before trying to drop it
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'stores' 
            AND COLUMN_NAME = 'store_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ");

        // Drop foreign key from stores table if it exists
        if (!empty($foreignKeys)) {
            Schema::table('stores', function (Blueprint $table) {
                $table->dropForeign(['store_id']);
            });
        }

        // Check if the departments table has 'store_id' column (was renamed)
        $columns = DB::select("SHOW COLUMNS FROM departments WHERE Field = 'store_id'");
        if (!empty($columns)) {
            // Rename store_id back to id
            Schema::table('departments', function (Blueprint $table) {
                $table->renameColumn('store_id', 'id');
            });
        }

        // Re-add foreign key if it was dropped
        if (!empty($foreignKeys)) {
            Schema::table('stores', function (Blueprint $table) {
                $table->foreign('store_id')->references('id')->on('departments')->onDelete('restrict');
            });
        }
    }
};
