<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role?->name !== Role::SUPER_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for super admins only.',
            ], 403);
        }

        return $next($request);
    }
}

