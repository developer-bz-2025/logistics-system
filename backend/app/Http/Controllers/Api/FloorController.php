<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Floor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FloorController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Floor::query()
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

        $floor = Floor::create([
            'name' => trim($validator->validated()['name']),
        ]);

        return response()->json([
            'id' => $floor->id,
            'name' => $floor->name,
        ], 201);
    }

    public function update(Request $request, Floor $floor): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $floor->update([
            'name' => trim($validator->validated()['name']),
        ]);

        return response()->json([
            'id' => $floor->id,
            'name' => $floor->name,
        ]);
    }

    public function destroy(Floor $floor): JsonResponse
    {
        $floor->delete();

        return response()->noContent();
    }
}
