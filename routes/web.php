<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\MeasurementUnitController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\MenuCategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\CompanyInformationController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\GrnController;
use App\Http\Controllers\GrnStoreController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\StoreConsumptionController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ServiceChargeController;
use App\Http\Controllers\EmployerController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\RecipeItemController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\StockCheckController;
use App\Http\Controllers\WastageController;
use App\Http\Controllers\Reports\StockTransferReportController;
use App\Http\Controllers\Reports\PurchaseReportController;
use App\Http\Controllers\Reports\WastageReportController;
use App\Http\Controllers\Reports\InventoryReportController;
use Illuminate\Validation\ValidationException;

/*
|--------------------------------------------------------------------------
| API Routes (No CSRF Required)
|--------------------------------------------------------------------------
*/

Route::prefix('api')->withoutMiddleware([
    \App\Http\Middleware\HandleInertiaRequests::class,
    \Inertia\Middleware::class,
])->group(function () {
    // Get authenticated user
    Route::get('/me', function (Request $request) {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return response()->json(auth()->user());
    });

    // Login
    Route::post('/login', function (Request $request) {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        auth()->login($user, $request->remember ?? false);

        return response()->json([
            'user' => $user,
        ]);
    });

    // Logout
    Route::post('/logout', function (Request $request) {
        auth()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    });

    // Employer CRUD routes (manages users)
    Route::get('/employers', [EmployerController::class, 'index']);
    Route::post('/employers', [EmployerController::class, 'store']);
    Route::get('/employers/{employer}', [EmployerController::class, 'show']);
    Route::put('/employers/{employer}', [EmployerController::class, 'update']);
    Route::delete('/employers/{employer}', [EmployerController::class, 'destroy']);

    // Customer CRUD routes
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
    Route::post('/customers/search-phone', [CustomerController::class, 'searchByPhone']);

    // Sales routes
    Route::get('/sales', [SalesController::class, 'index']);
    Route::post('/sales', [SalesController::class, 'store']);
    Route::get('/sales/{sale}/bill', [SalesController::class, 'getBill']);
    Route::put('/sales/{sale}/status', [SalesController::class, 'updateStatus']);

    // Stock check route
    Route::post('/stock/check', [StockCheckController::class, 'checkStock']);

    // Table routes
    Route::get('/tables', [TableController::class, 'index']);
    Route::get('/tables/{table}/orders', [TableController::class, 'getOrders']);
    Route::post('/table-orders', [TableController::class, 'storeOrder']);
    Route::post('/table-orders/{tableNumber}/close', [TableController::class, 'closeTableOrder']);

    // Products routes (using menu_items)
    Route::get('/products', function() {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }
        
        $menuItems = \DB::table('menu_items')
            ->join('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->where('menu_items.is_active', true)
            ->select(
                'menu_items.id',
                'menu_items.name',
                'menu_items.price',
                'menu_categories.name as category',
                'menu_items.sale_type'
            )
            ->orderBy('menu_categories.name')
            ->orderBy('menu_items.name')
            ->get();
            
        return response()->json(['success' => true, 'data' => $menuItems]);
    });

    // Supplier CRUD routes
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

    // Users list for dropdowns
    Route::get('/users', function() {
        return response()->json(\App\Models\User::select('id', 'name')->get());
    });

    // Material CRUD routes
    Route::get('/materials', [MaterialController::class, 'index']);
    Route::post('/materials', [MaterialController::class, 'store']);
    Route::get('/materials/{material}', [MaterialController::class, 'show']);
    Route::put('/materials/{material}', [MaterialController::class, 'update']);
    Route::delete('/materials/{material}', [MaterialController::class, 'destroy']);

    // Measurement Units CRUD routes
    Route::get('/measurement-units', [MeasurementUnitController::class, 'index']);
    Route::post('/measurement-units', [MeasurementUnitController::class, 'store']);
    Route::get('/measurement-units/{measurementUnit}', [MeasurementUnitController::class, 'show']);
    Route::put('/measurement-units/{measurementUnit}', [MeasurementUnitController::class, 'update']);
    Route::delete('/measurement-units/{measurementUnit}', [MeasurementUnitController::class, 'destroy']);

    // Category CRUD routes
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/active', [CategoryController::class, 'active']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Menu Category routes
    Route::get('/menu-categories', [MenuCategoryController::class, 'index']);
    Route::post('/menu-categories', [MenuCategoryController::class, 'store']);
    Route::get('/menu-categories/{menuCategory}', [MenuCategoryController::class, 'show']);
    Route::put('/menu-categories/{menuCategory}', [MenuCategoryController::class, 'update']);
    Route::delete('/menu-categories/{menuCategory}', [MenuCategoryController::class, 'destroy']);

    // Department routes
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/departments/{department}', [DepartmentController::class, 'show']);

    // Menu Item CRUD routes
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/menu-items/ready-made', [MenuItemController::class, 'readyMadeProducts']);
    Route::post('/menu-items', [MenuItemController::class, 'store']);
    Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

    // Recipe routes
    Route::get('/menu-items/{menuItem}/recipes', [RecipeController::class, 'index']);
    Route::get('/menu-items/{menuItem}/recipes/current', [RecipeController::class, 'current']);
    Route::get('/menu-items/{menuItem}/required-materials', [RecipeController::class, 'requiredMaterials']);
    Route::post('/menu-items/{menuItem}/recipes', [RecipeController::class, 'store']);
    Route::put('/recipes/{recipe}', [RecipeController::class, 'update']);
    Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy']);
    Route::get('/recipes/{recipe}/cost', [RecipeController::class, 'cost']);

    // Recipe Item routes
    Route::post('/recipes/{recipe}/items', [RecipeItemController::class, 'store']);
    Route::put('/recipe-items/{recipeItem}', [RecipeItemController::class, 'update']);
    Route::delete('/recipe-items/{recipeItem}', [RecipeItemController::class, 'destroy']);
    Route::put('/recipes/{recipe}/items', [RecipeItemController::class, 'updateBulk']);

    // Company info API
    Route::get('/company', [CompanyInformationController::class, 'get']);
    Route::put('/company', [CompanyInformationController::class, 'update']);
    // Purchase Request routes
    Route::get('/purchases', [PurchaseController::class, 'index']);
    Route::post('/purchases', [PurchaseController::class, 'store']);
    Route::get('/purchases/dropdown-data', [PurchaseController::class, 'getDropdownData']);
    Route::get('/purchases/search-materials', [PurchaseController::class, 'searchMaterials']);
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show']);
    Route::post('/purchases/{purchase}/approve', [PurchaseController::class, 'approve']);
    Route::post('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);
    Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy']);

    // Purchase Order routes
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
    Route::post('/purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
    Route::post('/purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);

    // GRN routes (view-only)
    Route::get('/grns', [GrnController::class, 'index']);
    Route::get('/grns/{grn}', [GrnController::class, 'show']);

    // Service Charge routes
    Route::get('/service-charges', [ServiceChargeController::class, 'index']);
    Route::post('/service-charges', [ServiceChargeController::class, 'store']);
    Route::put('/service-charges/{serviceCharge}', [ServiceChargeController::class, 'update']);
    Route::delete('/service-charges/{serviceCharge}', [ServiceChargeController::class, 'destroy']);
    Route::post('/service-charges/{serviceCharge}/toggle-active', [ServiceChargeController::class, 'toggleActive']);

    // GRN Store routes
    Route::get('/grn-store/available-materials', [GrnStoreController::class, 'getAvailableGrnMaterials']);
    Route::get('/grn-store/{category}', [GrnStoreController::class, 'getStoreData']);
    Route::post('/grn-store', [GrnStoreController::class, 'addToStore']);
    Route::delete('/grn-store/{category}/{id}', [GrnStoreController::class, 'deleteFromStore']);

    // Stock Transfer routes
    Route::get('/stock-transfers', [StockTransferController::class, 'index']);
    Route::get('/stock-transfers/available-materials', [StockTransferController::class, 'getAvailableMaterials']);
    Route::post('/stock-transfers/transfer', [StockTransferController::class, 'transferMaterial']);
    Route::get('/stock-transfers/store/{store}/materials', [StockTransferController::class, 'getStoreMaterials']);

    // Central Store routes
    Route::get('/stores', [StoreController::class, 'index']);
    Route::get('/stores/summary', [StoreController::class, 'summary']);
    Route::get('/stores/types', [StoreController::class, 'getStoreTypes']);
    Route::get('/stores/{storeName}', [StoreController::class, 'show']);
    Route::get('/stores/{storeName}/summary', [StoreController::class, 'storeSummary']);
    Route::get('/stores/by-id/{storeId}', [StoreController::class, 'getByStoreId']);
    Route::put('/stores/{storeRecordId}/quantity', [StoreController::class, 'updateQuantity']);
    Route::delete('/stores/{storeRecordId}', [StoreController::class, 'destroy']);

    // Store Consumption routes (FIFO)
    Route::post('/store-consumption/consume', [StoreConsumptionController::class, 'consume']);
    Route::post('/store-consumption/preview', [StoreConsumptionController::class, 'preview']);
    Route::get('/store-consumption', [StoreConsumptionController::class, 'index']);
    Route::get('/store-consumption/available/{materialId}/{storeId}', [StoreConsumptionController::class, 'getAvailable']);
    Route::get('/store-consumption/batches/{materialId}/{storeId}', [StoreConsumptionController::class, 'getBatches']);
    Route::get('/store-consumption/history/{materialId}/{storeId}', [StoreConsumptionController::class, 'getHistory']);

            // Save ready-made product transaction
        Route::post('/store/save-ready-made', [StoreController::class, 'saveReadyMadeProduct']);
        // Get all food store records
        Route::get('/food-store-records', [StoreController::class, 'getFoodStoreRecords']);
        // Move food store record to wastage
        Route::post('/food-store-records/{id}/wastage', [StoreController::class, 'moveToWastage']);
    
    // Wastage routes
    Route::get('/wastage', [WastageController::class, 'index']);
    Route::post('/wastage', [WastageController::class, 'store']);
    Route::delete('/wastage/{id}', [WastageController::class, 'destroy']);

    // Check raw material availability for requirements
    Route::post('/store/check-raw-materials', [StoreController::class, 'checkRawMaterialAvailability']);

    // Stock Transfer Report routes
    Route::get('/reports/stock-transfer', [StockTransferReportController::class, 'index']);
    Route::get('/reports/stock-transfer/export', [StockTransferReportController::class, 'export']);
    Route::get('/reports/stock-transfer/{storeId}', [StockTransferReportController::class, 'show']);
    Route::get('/reports/stock-transfer/material/{materialId}', [StockTransferReportController::class, 'materialComparison']);

    // Wastage Report routes
    Route::get('/reports/wastage', [WastageReportController::class, 'index']);
    Route::get('/reports/wastage/trends', [WastageReportController::class, 'trends']);
    Route::get('/reports/wastage/export', [WastageReportController::class, 'export']);
    Route::get('/reports/wastage/location/{location}', [WastageReportController::class, 'byLocation']);

    // Purchase Report routes
    Route::get('/reports/purchases', [PurchaseReportController::class, 'index']);
    Route::get('/reports/purchases/supplier', [PurchaseReportController::class, 'bySupplier']);
    Route::get('/reports/purchases/export', [PurchaseReportController::class, 'export']);
    Route::get('/reports/wastage/item/{type}/{id}', [WastageReportController::class, 'byItem']);

    // Inventory Report routes
    Route::get('/reports/inventory', [InventoryReportController::class, 'index']);
    Route::get('/reports/inventory/valuation', [InventoryReportController::class, 'valuation']);
    Route::get('/reports/inventory/material/{materialId}', [InventoryReportController::class, 'materialDetails']);
    Route::get('/reports/inventory/alerts', [InventoryReportController::class, 'alerts']);
    Route::get('/reports/inventory/batches', [InventoryReportController::class, 'batches']);
    Route::get('/reports/inventory/reorder', [InventoryReportController::class, 'reorderSuggestions']);
    Route::get('/reports/inventory/export', [InventoryReportController::class, 'export']);

});

/*
|--------------------------------------------------------------------------
| SPA Catch-all Route
|--------------------------------------------------------------------------
| This route must be last to catch all frontend routes for React Router
*/

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
