<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Role;

class LogisticsAdminPrAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // If user is Logistics Admin, they can only access PRs from their assigned locations
        if ($user->role?->name === Role::LOG_ADMIN) {
            $userLocationIds = $user->locations()->pluck('locations.id')->toArray();
            
            // Add location filter to the request for later use in controllers
            $request->merge(['user_location_ids' => $userLocationIds]);
        }

        return $next($request);
    }
}