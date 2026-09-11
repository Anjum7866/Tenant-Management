<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\PropertyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::get('/dashboard', DashboardController::class)->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::get('/properties/{property}', [PropertyController::class, 'show']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

    Route::middleware('role:super_admin,property_manager')->group(function () {
        Route::get('/{resource}', [ManagementController::class, 'index'])->where('resource', 'tenants|units|leases|payments');
        Route::post('/{resource}', [ManagementController::class, 'store'])->where('resource', 'tenants|units|leases|payments');
        Route::get('/{resource}/{id}', [ManagementController::class, 'show'])->where(['resource' => 'tenants|units|leases|payments', 'id' => '[0-9]+']);
        Route::put('/{resource}/{id}', [ManagementController::class, 'update'])->where(['resource' => 'tenants|units|leases|payments', 'id' => '[0-9]+']);
        Route::delete('/{resource}/{id}', [ManagementController::class, 'destroy'])->where(['resource' => 'tenants|units|leases|payments', 'id' => '[0-9]+']);
    });

    Route::middleware('role:super_admin,property_manager,tenant')->group(function () {
        Route::get('/maintenance', [ManagementController::class, 'index'])->defaults('resource', 'maintenance');
        Route::post('/maintenance', [ManagementController::class, 'store'])->defaults('resource', 'maintenance');
        Route::get('/maintenance/{id}', [ManagementController::class, 'show'])->defaults('resource', 'maintenance');
        Route::put('/maintenance/{id}', [ManagementController::class, 'update'])->defaults('resource', 'maintenance');
        Route::delete('/maintenance/{id}', [ManagementController::class, 'destroy'])->defaults('resource', 'maintenance')->middleware('role:super_admin,property_manager');
    });

    Route::get('/documents', [ManagementController::class, 'index'])->defaults('resource', 'documents');
    Route::post('/documents', [ManagementController::class, 'store'])->defaults('resource', 'documents');
    Route::get('/documents/{id}', [ManagementController::class, 'show'])->defaults('resource', 'documents');
    Route::put('/documents/{id}', [ManagementController::class, 'update'])->defaults('resource', 'documents');
    Route::delete('/documents/{id}', [ManagementController::class, 'destroy'])->defaults('resource', 'documents');
    Route::post('/messages', [ManagementController::class, 'store'])->defaults('resource', 'messages');
    Route::get('/messages', [ManagementController::class, 'index'])->defaults('resource', 'messages');
    Route::get('/messages/{id}', [ManagementController::class, 'show'])->defaults('resource', 'messages');
    Route::put('/messages/{id}', [ManagementController::class, 'update'])->defaults('resource', 'messages');
});
