<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->foreignId('category_id')->constrained('menu_categories');
            
            // Sale Type
            $table->enum('sale_type', ['kot', 'bot', 'both']);
            $table->enum('prep_type', ['made_to_order', 'ready_made'])->default('made_to_order');
            
            // Pricing
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2)->default(0);
            
            // Control
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
