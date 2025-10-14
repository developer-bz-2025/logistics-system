<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\Request;

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