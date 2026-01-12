<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Serve storage files through Laravel (handles 403 errors)
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
