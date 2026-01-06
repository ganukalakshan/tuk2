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
        Schema::table('sales', function (Blueprint $table) {
            // Drop payment_details if it exists
            if (Schema::hasColumn('sales', 'payment_details')) {
                $table->dropColumn('payment_details');
            }
            
            // Add individual payment method amount columns
            $table->decimal('card_amount', 10, 2)->default(0)->after('cash_amount');
            $table->decimal('pickme_amount', 10, 2)->default(0)->after('card_amount');
            $table->decimal('uber_amount', 10, 2)->default(0)->after('pickme_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'card_amount')) {
                $table->dropColumn(['card_amount', 'pickme_amount', 'uber_amount']);
            }
        });
    }
};
