<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = Category::query()->orderBy('name');

        if ($s = $request->query('search')) {
            $q->where('name', 'like', "%{$s}%");
        }

        if ($perPage = (int) $request->query('per_page')) {
            return CategoryResource::collection($q->paginate($perPage));
        }

        return CategoryResource::collection($q->get());
    }
}
