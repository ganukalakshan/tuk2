<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 50)->unique();
            
            // Order Type
            $table->enum('order_type', ['dine_in', 'takeaway', 'delivery_app']);
            
            // Customer Info
            $table->enum('customer_type', ['walk_in', 'regular'])->default('walk_in');
            $table->string('customer_name', 100)->nullable();
            $table->string('customer_phone', 20)->nullable();
            
            // Dine-in specific
            $table->foreignId('table_id')->nullable()->constrained('tables');
            $table->integer('pax')->default(1);
            
            // Delivery App specific
            $table->enum('delivery_app', ['uber_eats', 'pickme_food', 'other'])->nullable();
            $table->string('app_order_id', 100)->nullable();
            
            // Staff
            $table->foreignId('waiter_id')->nullable()->constrained('users');
            $table->foreignId('cashier_id')->nullable()->constrained('users');
            
            // Status
            $table->enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])->default('pending');
            
            // Timing
            $table->date('order_date');
            $table->time('order_time');
            $table->timestamp('completed_at')->nullable();
            
            // Pricing (calculated)
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('service_charge', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index('order_date');
            $table->index(['order_type', 'status']);
            $table->index(['delivery_app', 'order_date']);
            $table->index(['table_id', 'order_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
