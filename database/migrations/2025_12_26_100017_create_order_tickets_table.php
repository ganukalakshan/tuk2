<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no', 50)->unique();
            $table->foreignId('order_id')->constrained('orders');
            $table->enum('ticket_type', ['kot', 'bot']);
            $table->enum('station', ['kitchen', 'bar', 'bakery']);
            $table->enum('status', ['pending', 'preparing', 'ready', 'served'])->default('pending');
            $table->timestamp('printed_at')->nullable();
            $table->foreignId('prepared_by')->nullable()->constrained('users');
            $table->foreignId('served_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tickets');
    }
};
