<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('code', 20)->unique();
            $table->decimal('rate', 5, 2);
            $table->enum('type', ['vat', 'tdl', 'nbt', 'service_charge']);
            $table->boolean('is_active')->default(true);
            $table->enum('applies_to', ['all', 'food', 'beverage', 'other'])->default('all');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
