<?php

use App\Http\Controllers\AuthController;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MakamController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\TpuController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ─── Landing page publik (tidak perlu login) ─────────────────
Route::get('/', [PublicController::class, 'index'])->name('home');

// ─── Auth ────────────────────────────────────────────────────
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ─── Panel admin (wajib login) ───────────────────────────────
Route::middleware('auth')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Kelola Makam — hanya admin
    Route::resource('makam', MakamController::class)
        ->middleware('role:admin');

    // Kelola TPU — hanya superadmin
    Route::resource('tpu', TpuController::class)
        ->middleware('role:superadmin');



    // Manajemen user — hanya superadmin
    Route::resource('users', UserController::class)
        ->middleware('role:superadmin');
});
