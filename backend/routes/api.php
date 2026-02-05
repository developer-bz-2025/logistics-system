<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\FixedItemController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PrController;
use App\Http\Controllers\Api\PrEditRequestController;
use App\Http\Controllers\Api\AttributeController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\LocationAdminAssignmentController;
use App\Http\Controllers\Api\LocationChangeRequestController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\NotificationController;


// Group all API routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);

Route::middleware('jwt.auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::get('/prs-for-asset-creation', [ItemController::class, 'getPrsForAssetCreation']);

});


Route::middleware(['jwt.auth','logistics.admin.pr.access'])->group(function () {
    Route::post('/prs', [PrController::class, 'store']);
    Route::get('/prs', [PrController::class, 'index']);

    Route::get('/prs/{pr}', [PrController::class, 'show'])->whereNumber('pr');
    // Route::put('/prs/{pr}', [PrController::class, 'update'])->whereNumber('pr');
    Route::post('/prs/{pr}/pr-edit-requests', [PrEditRequestController::class, 'store']) //by pr admin
        ->whereNumber('pr');

});

Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/log-admin/assets', [ItemController::class, 'logAdminAssets']);
});


Route::middleware(['jwt.auth'])->group(function () { //to add super admin middleware later
    Route::get('/pr-edit-requests', [PrEditRequestController::class, 'index']);
    Route::get('/pr-edit-requests/{id}', [PrEditRequestController::class, 'show']);

    Route::post('/pr-edit-requests/{id}/approve', [PrEditRequestController::class, 'approve']);
    Route::post('/pr-edit-requests/{id}/reject', [PrEditRequestController::class, 'reject']);

Route::post('/import/assets', [\App\Http\Controllers\Api\ImportController::class, 'import']);

});

Route::middleware(['jwt.auth','super.admin'])->prefix('super-admin')->group(function () {
    Route::get('/log-admins', [LocationAdminAssignmentController::class, 'assignedAdmins']);
    Route::get('/log-admin-candidates', [LocationAdminAssignmentController::class, 'index']);
    Route::post('/log-admin-assignments', [LocationAdminAssignmentController::class, 'store']);
});

// Serve storage files through API (public access, no auth required)
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    
    if (!file_exists($fullPath)) {
        abort(404, 'File not found');
    }
    
    $mimeType = mime_content_type($fullPath);
    if (!$mimeType) {
        // Try to determine from extension
        $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
        ];
        $mimeType = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }
    
    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000', // Cache for 1 year
    ]);
})->where('path', '.*');

Route::get('/catalog/structure', function () {
    $categories = \App\Models\Category::with([
        'attributes',
        'subCategories' => function ($query) {
            $query->with([
                'fixedItems',
                'allowedOptions' => function ($subQuery) {
                    $subQuery->with('attribute');
                }
            ]);
        }
    ])->get();

    $result = $categories->map(function ($category) {
        $categoryData = [
            'category' => $category->name,
            'attributes' => $category->attributes->pluck('name')->toArray(),
            'sub_categories' => []
        ];

        foreach ($category->subCategories as $subCategory) {
            $subCategoryData = [
                'name' => $subCategory->name,
                'items' => $subCategory->fixedItems->pluck('name')->toArray(),
                'options' => []
            ];

            // Group options by attribute
            $optionsByAttribute = [];
            foreach ($subCategory->allowedOptions as $allowedOption) {
                $attributeName = $allowedOption->attribute->name;
                $optionValue = $allowedOption->value;

                if (!isset($optionsByAttribute[$attributeName])) {
                    $optionsByAttribute[$attributeName] = [];
                }

                if (!in_array($optionValue, $optionsByAttribute[$attributeName])) {
                    $optionsByAttribute[$attributeName][] = $optionValue;
                }
            }

            $subCategoryData['options'] = $optionsByAttribute;
            $categoryData['sub_categories'][] = $subCategoryData;
        }

        return $categoryData;
    });

    return response()->json($result);
});

Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);
Route::get('/dashboard/assets-by-location-category', [\App\Http\Controllers\Api\DashboardController::class, 'assetsByLocationCategory']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show'])
    ->whereNumber('category');

Route::get('/categories/{category}/sub-categories', [SubCategoryController::class, 'indexByCategory'])
    ->whereNumber('category');

Route::get('/sub-categories/{subCategory}/fixed-items', [FixedItemController::class, 'indexBySubCategory'])
    ->whereNumber('subCategory');

Route::get('/categories/{category}/attributes', [AttributeController::class, 'byCategory'])
    ->whereNumber('category');

Route::get('/items', [ItemController::class, 'index']);
Route::get('/items/{item}', [ItemController::class, 'show'])
    ->whereNumber('item');
Route::get('/items/{item}/history', [\App\Http\Controllers\Api\ItemHistoryController::class, 'index'])
    ->whereNumber('item');

Route::middleware(['jwt.auth'])->group(function () {
    Route::post('/items', [ItemController::class, 'store']);
    Route::put('/items/{item}', [ItemController::class, 'update'])
        ->whereNumber('item');
    Route::post('/items/{item}/photo', [ItemController::class, 'updatePhoto'])
        ->whereNumber('item');
});

Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/dashboard/log-admin-stats', [\App\Http\Controllers\Api\DashboardController::class, 'logAdminStats']);

    Route::get('/location-change-requests', [LocationChangeRequestController::class, 'index']);
    Route::post('/location-change-requests', [LocationChangeRequestController::class, 'store']);
    Route::post('/location-change-requests/{id}/approve', [LocationChangeRequestController::class, 'approve'])
        ->whereNumber('id');
    Route::post('/location-change-requests/{id}/reject', [LocationChangeRequestController::class, 'reject'])
        ->whereNumber('id');
});

Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications/{id}', [NotificationController::class, 'show'])
        ->whereNumber('id');
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
        ->whereNumber('id');
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])
        ->whereNumber('id');
});

Route::get('/statuses', [StatusController::class, 'index']);
Route::get('/colors', [\App\Http\Controllers\Api\ColorController::class, 'index']);
Route::get('/users', [UserController::class, 'index']);

Route::get('/locations', [LocationController::class, 'index']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/suppliers', [SupplierController::class, 'index']);
Route::get('/floors', [FloorController::class, 'index']);
Route::middleware(['jwt.auth','super.admin'])->group(function () {
    // Locations
    Route::post('/locations', [LocationController::class, 'store']);
    Route::put('/locations/{id}', [LocationController::class, 'update'])
        ->whereNumber('id');
    Route::delete('/locations/{id}', [LocationController::class, 'destroy'])
        ->whereNumber('id');

    // Brands
    Route::post('/brands', [BrandController::class, 'store']);
    Route::put('/brands/{brand}', [BrandController::class, 'update'])
        ->whereNumber('brand');
    Route::delete('/brands/{brand}', [BrandController::class, 'destroy'])
        ->whereNumber('brand');

    // Suppliers
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])
        ->whereNumber('supplier');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])
        ->whereNumber('supplier');

    // Floors
    Route::post('/floors', [FloorController::class, 'store']);
    Route::put('/floors/{floor}', [FloorController::class, 'update'])
        ->whereNumber('floor');
    Route::delete('/floors/{floor}', [FloorController::class, 'destroy'])
        ->whereNumber('floor');
});




// Route::middleware('auth.jwt')->group(function () {
//     Route::apiResource('categories', CategoryController::class);
//     // … add suppliers, brands, items, prs, etc.
// });
