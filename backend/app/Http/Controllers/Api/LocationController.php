<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LocationController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Location::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $location = Location::create([
            'name' => trim($validator->validated()['name']),
        ]);

        return response()->json([
            'id' => $location->id,
            'name' => $location->name,
        ], 201);
    }

    public function update(Request $request, Location $location): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $location->update([
            'name' => trim($validator->validated()['name']),
        ]);

        return response()->json([
            'id' => $location->id,
            'name' => $location->name,
        ]);
    }

    public function destroy(Location $location): JsonResponse
    {
        $location->delete();

        return response()->noContent();
    }
}
