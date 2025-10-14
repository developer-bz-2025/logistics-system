<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;

use App\Models\User;

use App\Http\Controllers\Controller;



class UserController extends Controller
{

       /**
     * Store a new user with role assignment.
     *
     * @param Request $request
     * @return JsonResponse
     */


    public function show($id)
    {
        $user = User::with('role')->findOrFail($id);

        return response()->json($user);
    }

    public function index()
    {
        // get all users with their roles
        $users = User::with('role')->get();

        return response()->json($users);
    }
}