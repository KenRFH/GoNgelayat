<?php

use App\Http\Controllers\Api\MakamApiController;
use App\Http\Controllers\Api\TpuApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider or within bootstrap/app.php
| and will be assigned the "api" middleware group.
|
*/

Route::get('makam/terdekat', [MakamApiController::class, 'getMakamTerdekat'])->name('api.makam.terdekat');
Route::get('tpu/terdekat', [TpuApiController::class, 'getTpuTerdekat'])->name('api.tpu.terdekat');

Route::prefix('tpu')->name('api.tpu.')->group(function () {
    Route::post('/', [TpuApiController::class, 'store'])->name('store');
    Route::put('/{id}', [TpuApiController::class, 'update'])->name('update');
    Route::get('/{id}', [TpuApiController::class, 'show'])->name('show');
});
