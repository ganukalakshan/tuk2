<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_app_orders', function (Blueprint $table) {
            $table->id();
            $table->string('app_order_id', 100)->unique();
            $table->enum('app_name', ['uber_eats', 'pickme_food', 'other']);
            
            // Order Details from App
            $table->string('customer_name', 100)->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->text('delivery_address')->nullable();
            $table->text('special_instructions')->nullable();
            
            // Financial
            $table->decimal('order_total', 10, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 10, 2);
            $table->decimal('restaurant_earning', 10, 2);
            
            // Timing
            $table->dateTime('app_order_time');
            $table->dateTime('expected_pickup_time')->nullable();
            $table->dateTime('actual_pickup_time')->nullable();
            
            // Status
            $table->enum('status', ['received', 'preparing', 'ready', 'picked_up', 'cancelled'])->default('received');
            
            // Link to restaurant order
            $table->foreignId('restaurant_order_id')->nullable()->constrained('orders');
            
            $table->timestamps();
            
            // Indexes
            $table->index('app_order_time');
            $table->index('status');
            $table->index(['app_name', 'app_order_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_app_orders');
    }
};
