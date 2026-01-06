<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waiter_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waiter_id')->constrained('users');
            $table->foreignId('order_id')->constrained('orders');
            $table->enum('commission_type', ['sales', 'service', 'tips']);
            $table->decimal('rate', 5, 2)->default(0);
            $table->decimal('amount', 10, 2);
            $table->date('date');
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waiter_commissions');
    }
};
