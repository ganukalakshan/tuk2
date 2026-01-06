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
        // Get all sales with order IDs, ordered by ID
        $tukSales = DB::table('sales')
            ->where('order_id', 'like', 'TUK/%')
            ->orderBy('id', 'asc')
            ->get();

        // Find the highest CS order number that already exists
        $lastCsOrder = DB::table('sales')
            ->where('order_id', 'like', 'CS/%')
            ->orderBy('order_id', 'desc')
            ->first();
            
        $nextNumber = 1;
        if ($lastCsOrder) {
            $lastNumber = (int) explode('/', $lastCsOrder->order_id)[1];
            $nextNumber = $lastNumber + 1;
        }

        // Update each order to a new CS order ID
        foreach ($tukSales as $sale) {
            $newOrderId = 'CS/' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            
            DB::table('sales')
                ->where('id', $sale->id)
                ->update(['order_id' => $newOrderId]);
                
            $nextNumber++;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert CS order IDs back to TUK
        DB::table('sales')
            ->where('order_id', 'like', 'CS/%')
            ->update([
                'order_id' => DB::raw("REPLACE(order_id, 'CS/', 'TUK/')")
            ]);
    }
};
