<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use App\Services\ActivityLogService;


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

        // Log login activity
        ActivityLogService::logUserLogin($user->id, $request->ip());

        return $this->respondWithToken($token);
    }



    public function logout()
    {
        $user = auth()->user();
        if ($user) {
            ActivityLogService::logUserLogout($user->id);
        }
        auth()->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }

    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $refreshToken = trim(preg_replace('/^Bearer\s+/i', '', $request->refresh_token));

        if (empty($refreshToken)) {
            return response()->json([
                'error' => 'Invalid refresh token'
            ], 401);
        }

        try {
            // Attempt to refresh the token (will blacklist the old one by default)
            $newToken = JWTAuth::setToken($refreshToken)->refresh();

            $user = JWTAuth::setToken($newToken)->toUser();

            return response()->json([
                'access_token' => $newToken,
                'refresh_token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'user' => $user,
            ]);
        } catch (TokenExpiredException|TokenInvalidException|JWTException $e) {
            return response()->json([
                'error' => 'Invalid refresh token'
            ], 401);
        }
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
            'confirm_password' => 'required|string|same:new_password',
        ], [
            'confirm_password.same' => 'The new password and confirmation password do not match.',
            'new_password.min' => 'The new password must be at least 6 characters.',
        ]);

        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'error' => 'User not authenticated.'
            ], 401);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'error' => 'Current password is incorrect.',
                'errors' => [
                    'current_password' => ['The current password you entered is incorrect.']
                ]
            ], 422);
        }

        // Check if new password is different from current password
        if (Hash::check($request->new_password, $user->password)) {
            return response()->json([
                'error' => 'New password must be different from your current password.',
                'errors' => [
                    'new_password' => ['The new password must be different from your current password.']
                ]
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        // Log password change
        ActivityLogService::logPasswordChanged($user->id);

        return response()->json([
            'message' => 'Password changed successfully.'
        ], 200);
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
