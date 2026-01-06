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
        // Update sales status enum to include 'order'
        DB::statement("ALTER TABLE sales MODIFY COLUMN status ENUM('pending', 'order', 'kot', 'bot', 'completed', 'cancelled') DEFAULT 'pending'");
        
        // Make payment_method nullable
        DB::statement("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cash', 'card', 'pickme', 'uber') NULL");
        
        // Create table_orders tracking table
        Schema::create('table_orders', function (Blueprint $table) {
            $table->id();
            $table->integer('table_number');
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->enum('status', ['open', 'pending', 'completed', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            
            $table->index('table_number');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_orders');
        
        DB::statement("ALTER TABLE sales MODIFY COLUMN status ENUM('pending', 'kot', 'bot', 'completed', 'cancelled') DEFAULT 'pending'");
        DB::statement("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cash', 'card', 'pickme', 'uber') DEFAULT 'cash'");
    }
};
