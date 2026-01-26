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
            $table->enum('prep_type', ['made_to_order', 'ready_made', 'purchasing_item'])
                  ->default('made_to_order')
                  ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->enum('prep_type', ['made_to_order', 'ready_made'])
                  ->default('made_to_order')
                  ->change();
        });
    }
};
