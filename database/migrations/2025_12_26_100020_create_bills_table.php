<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->string('bill_no', 50)->unique();
            $table->foreignId('order_id')->constrained('orders');
            
            // Bill Details
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('service_charge', 10, 2)->default(0);
            $table->decimal('rounding', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2);
            
            // Service charge only for dine-in
            $table->boolean('service_charge_applied')->default(false);
            
            // Payment
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance', 10, 2)->default(0);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
            
            // Delivery App Commission
            $table->decimal('app_commission', 10, 2)->default(0);
            $table->decimal('app_commission_rate', 5, 2)->default(0);
            
            $table->foreignId('billed_by')->nullable()->constrained('users');
            $table->timestamp('billed_at')->useCurrent();
            $table->timestamps();
            
            // Indexes
            $table->index('billed_at');
            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
