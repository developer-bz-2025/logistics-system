<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\FixedItemController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PrController;


// Group all API routes
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('jwt.auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});


Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/prs', [PrController::class, 'store']);
    Route::get('/prs', [PrController::class, 'index']);

});

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/categories/{category}/sub-categories', [SubCategoryController::class, 'indexByCategory'])
    ->whereNumber('category');

Route::get('/sub-categories/{subCategory}/fixed-items', [FixedItemController::class, 'indexBySubCategory'])
    ->whereNumber('subCategory');

    Route::get('/suppliers', [SupplierController::class, 'index']);


// Route::middleware('auth.jwt')->group(function () {
//     Route::apiResource('categories', CategoryController::class);
//     // … add suppliers, brands, items, prs, etc.
// });