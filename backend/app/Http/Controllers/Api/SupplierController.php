<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Services\ActivityLogService;

class SupplierController extends Controller
{
    // GET /suppliers?search=&category_id=&per_page=
    public function index(Request $request)
    {
        $q = Supplier::query()->select(['id','name'])->orderBy('name');

        // optional category filter via pivot supplier_category
        if ($cid = $request->query('category_id')) {
            $q->whereHas('categories', fn($qq) => $qq->where('categories.id', $cid));
        }

        // search by name (case-insensitive)
        if ($s = trim((string) $request->query('search'))) {
            $q->where('name', 'like', "%{$s}%");
        }

        // optional pagination; if per_page missing/0 => return all
        $perPage = (int) $request->query('per_page', 0);
        if ($perPage > 0) {
            return SupplierResource::collection($q->paginate($perPage));
        }

        return SupplierResource::collection($q->limit(1000)->get()); // cap just in case
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $supplier = Supplier::create([
            'name' => trim($validator->validated()['name']),
        ]);

        // Log activity
        ActivityLogService::logSupplierCreated(auth()->id(), $supplier->id, $supplier->name);

        return response()->json([
            'id' => $supplier->id,
            'name' => $supplier->name,
        ], 201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $oldName = $supplier->name;
        $supplier->update([
            'name' => trim($validator->validated()['name']),
        ]);

        // Log activity
        ActivityLogService::logSupplierUpdated(auth()->id(), $supplier->id, $supplier->name, [
            'old_name' => $oldName,
            'new_name' => $supplier->name,
        ]);

        return response()->json([
            'id' => $supplier->id,
            'name' => $supplier->name,
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplierName = $supplier->name;
        $supplierId = $supplier->id;
        $supplier->delete();

        // Log activity
        ActivityLogService::logSupplierDeleted(auth()->id(), $supplierId, $supplierName);

        return response()->noContent();
    }

    // GET /categories/{category}/suppliers?search=&per_page=
    public function byCategory(Request $request, Category $category)
    {
        $q = $category->suppliers()->select(['suppliers.id','suppliers.name'])->orderBy('suppliers.name');

        if ($s = trim((string) $request->query('search'))) {
            $q->where('suppliers.name', 'like', "%{$s}%");
        }

        $perPage = (int) $request->query('per_page', 0);
        if ($perPage > 0) {
            return SupplierResource::collection($q->paginate($perPage));
        }

        return SupplierResource::collection($q->get());
    }
}