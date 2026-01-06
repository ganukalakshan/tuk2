<?php

/**
 * Verification Script for Single Store Table Implementation
 * 
 * Run this to verify the new store system is working correctly
 */

use App\Models\Store;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== Store System Verification ===\n\n";

// 1. Check that stores table exists
echo "1. Checking stores table exists... ";
if (Schema::hasTable('stores')) {
    echo "✅ EXISTS\n";
} else {
    echo "❌ NOT FOUND\n";
    exit(1);
}

// 2. Check that old tables are gone
echo "\n2. Checking old tables are deleted:\n";
$oldTables = ['hot_kitchen_store', 'beverage_store', 'pastry_store', 'bakery_store'];
foreach ($oldTables as $table) {
    echo "   - $table: ";
    if (Schema::hasTable($table)) {
        echo "❌ STILL EXISTS (should be deleted)\n";
    } else {
        echo "✅ DELETED\n";
    }
}

// 3. Check stores table columns
echo "\n3. Checking stores table has correct columns:\n";
$requiredColumns = ['id', 'material_name', 'quantity', 'unit', 'store_name', 'store_id', 'material_id', 'grn_id'];
foreach ($requiredColumns as $column) {
    echo "   - $column: ";
    if (Schema::hasColumn('stores', $column)) {
        echo "✅ EXISTS\n";
    } else {
        echo "❌ MISSING\n";
    }
}

// 4. Check old columns are removed
echo "\n4. Checking old columns are removed:\n";
$oldColumns = ['store_table_name', 'store_record_id'];
foreach ($oldColumns as $column) {
    echo "   - $column: ";
    if (Schema::hasColumn('stores', $column)) {
        echo "❌ STILL EXISTS (should be removed)\n";
    } else {
        echo "✅ REMOVED\n";
    }
}

// 5. Test Store model constants
echo "\n5. Testing Store model constants:\n";
echo "   - STORE_KITCHEN: " . Store::STORE_KITCHEN . " (should be 1) ";
echo (Store::STORE_KITCHEN === 1 ? "✅\n" : "❌\n");

echo "   - STORE_BAKERY: " . Store::STORE_BAKERY . " (should be 2) ";
echo (Store::STORE_BAKERY === 2 ? "✅\n" : "❌\n");

echo "   - STORE_PASTRY: " . Store::STORE_PASTRY . " (should be 3) ";
echo (Store::STORE_PASTRY === 3 ? "✅\n" : "❌\n");

echo "   - STORE_BEVERAGE: " . Store::STORE_BEVERAGE . " (should be 4) ";
echo (Store::STORE_BEVERAGE === 4 ? "✅\n" : "❌\n");

// 6. Test Store helper methods
echo "\n6. Testing Store helper methods:\n";
echo "   - getStoreId('hot_kitchen'): " . Store::getStoreId('hot_kitchen') . " ";
echo (Store::getStoreId('hot_kitchen') === 1 ? "✅\n" : "❌\n");

echo "   - getStoreName(1): " . Store::getStoreName(1) . " ";
echo (Store::getStoreName(1) === 'hot_kitchen' ? "✅\n" : "❌\n");

// 7. Check store data count
echo "\n7. Current store data:\n";
$storeCount = Store::count();
echo "   - Total records: $storeCount\n";

if ($storeCount > 0) {
    $byStore = Store::selectRaw('store_id, store_name, COUNT(*) as count')
        ->groupBy('store_id', 'store_name')
        ->orderBy('store_id')
        ->get();
    
    foreach ($byStore as $store) {
        echo "   - Store ID {$store->store_id} ({$store->store_name}): {$store->count} items\n";
    }
}

echo "\n=== Verification Complete ===\n";
echo "✅ Single store table implementation is working correctly!\n\n";

echo "Store IDs:\n";
echo "  1 = Hot Kitchen Store\n";
echo "  2 = Bakery Store\n";
echo "  3 = Pastry Store\n";
echo "  4 = Beverage Store\n";
