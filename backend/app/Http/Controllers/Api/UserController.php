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

    public function index(Request $request)
    {
        $q = User::with('role');

        // search by name or email
        if ($s = trim((string) $request->query('search'))) {
            $q->where(function ($qq) use ($s) {
                $qq->where('name', 'like', "%{$s}%")
                   ->orWhere('email', 'like', "%{$s}%");
            });
        }

        return response()->json($q->get());
    }
}
