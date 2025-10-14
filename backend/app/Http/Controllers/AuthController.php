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

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60 * 60
            // 'expires_in' => auth('api')->factory()->getTTL() * 36000
        ]);
    }
}