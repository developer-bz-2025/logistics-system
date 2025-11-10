<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;


class AuthController extends Controller
{

    public function login(Request $request)
    {
        $request->validate([ 
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Step 1: Check if user with given email exists
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'error' => 'Email not found.'
            ], 404);
        }

        // Step 2: Check if password is correct
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Incorrect password.'
            ], 401);
        }

        // Step 3: Generate token manually
        /** @var string $token */
        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($token);
    }



    public function logout()
    {
        auth()->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }

    public function refresh(Request $request)
    {
        try {
            $request->validate([
                'refresh_token' => 'required|string',
            ]);

            // Set the token to be refreshed
            JWTAuth::setToken($request->refresh_token);

            // Get the user from the refresh token
            $user = JWTAuth::authenticate();

            if (!$user) {
                return response()->json([
                    'error' => 'Invalid refresh token'
                ], 401);
            }

            // Generate a new access token for the user
            $newToken = JWTAuth::fromUser($user);

            return response()->json([
                'access_token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Invalid refresh token'
            ], 401);
        }
    }

    protected function respondWithToken($token)
    {
        // For now, use the same token as both access and refresh token
        // In a production system, you'd want separate tokens with different TTLs
        return response()->json([
            'access_token' => $token,
            'refresh_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ]);
    }
}
