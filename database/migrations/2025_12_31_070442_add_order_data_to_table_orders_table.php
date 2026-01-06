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
        Schema::table('table_orders', function (Blueprint $table) {
            $table->string('order_id')->nullable()->after('table_number');
            $table->foreignId('customer_id')->nullable()->after('order_id')->constrained('customers')->nullOnDelete();
            $table->json('items')->nullable()->after('customer_id'); // Store order items as JSON
            $table->decimal('subtotal', 10, 2)->default(0)->after('items');
            $table->decimal('service_charge', 10, 2)->default(0)->after('subtotal');
            $table->decimal('service_charge_amount', 10, 2)->default(0)->after('service_charge');
            $table->decimal('total_amount', 10, 2)->default(0)->after('service_charge_amount');
            $table->text('kitchen_note')->nullable()->after('total_amount');
            
            // Remove sale_id as orders won't have sales until confirmed
            $table->dropForeign(['sale_id']);
            $table->dropColumn('sale_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('table_orders', function (Blueprint $table) {
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->dropColumn([
                'order_id',
                'customer_id',
                'items',
                'subtotal',
                'service_charge',
                'service_charge_amount',
                'total_amount',
                'kitchen_note'
            ]);
        });
    }
};
