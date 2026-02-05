<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Services\ActivityLogService;

class BrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Brand::query()
            ->select(['brands.id', 'brands.name'])
            ->orderBy('brands.name');

        if ($cid = $request->query('category_id')) {
            $query->whereHas('categories', fn ($q) => $q->where('categories.id', $cid));
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $brand = Brand::create([
            'name' => trim($validator->validated()['name']),
        ]);

        // Log activity
        ActivityLogService::logBrandCreated(auth()->id(), $brand->id, $brand->name);

        return response()->json([
            'id' => $brand->id,
            'name' => $brand->name,
        ], 201);
    }

    public function update(Request $request, Brand $brand): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $oldName = $brand->name;
        $brand->update([
            'name' => trim($validator->validated()['name']),
        ]);

        // Log activity
        ActivityLogService::logBrandUpdated(auth()->id(), $brand->id, $brand->name, [
            'old_name' => $oldName,
            'new_name' => $brand->name,
        ]);

        return response()->json([
            'id' => $brand->id,
            'name' => $brand->name,
        ]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        $brandName = $brand->name;
        $brandId = $brand->id;
        $brand->delete();

        // Log activity
        ActivityLogService::logBrandDeleted(auth()->id(), $brandId, $brandName);

        return response()->noContent();
    }
}
