<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubCategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;

class SubCategoryController extends Controller
{
    // GET /categories/{category}/sub-categories
    public function indexByCategory(Request $request, Category $category)
    {
        $q = $category->subCategories()->orderBy('name');

        if ($s = $request->query('search')) {
            $q->where('name', 'like', "%{$s}%");
        }

        if ($perPage = (int) $request->query('per_page')) {
            return SubCategoryResource::collection($q->paginate($perPage));
        }

        return SubCategoryResource::collection($q->get());
    }
}