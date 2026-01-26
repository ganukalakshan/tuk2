<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$stores = \App\Models\Store::where('material_id', '>', 0)->limit(3)->get();
foreach($stores as $store) {
    echo "\n=== Store Record ===\n";
    echo "Material: " . $store->material->name . "\n";
    echo "Unit Field (string): " . $store->unit . "\n";
    echo "Unit_ID: " . $store->unit_id . "\n";
    
    // Try to manually load the unit relationship
    $unitObj = $store->unit()->first();
    if ($unitObj) {
        echo "Unit Relationship Found: " . $unitObj->unit_name . "\n";
        echo "Conversion Factor: " . $unitObj->conversion_to_base . "\n";
    } else {
        echo "Unit Relationship: NOT FOUND\n";
    }
}
