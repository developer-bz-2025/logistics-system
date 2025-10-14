<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'Authorization token not found.'
            ], 401);
        }

        $token = trim(str_replace('Bearer', '', $authHeader));

        try {
            $user = JWTAuth::setToken($token)->authenticate();
            if (! $user) {
                return response()->json(['success' => false, 'message' => 'User not found.'], 401);
            }

            // Optionally bind the user to request
            $request->setUserResolver(fn () => $user);

        } catch (TokenExpiredException $e) {
            return response()->json(['success' => false, 'message' => 'Token expired.'], 401);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Invalid token.'], 401);
        }

        return $next($request);
    }
}
 