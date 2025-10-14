<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FixedItemResource;
use App\Models\SubCategory;
use Illuminate\Http\Request;

class FixedItemController extends Controller
{
    // GET /sub-categories/{subCategory}/fixed-items
    public function indexBySubCategory(Request $request, SubCategory $subCategory)
    {
        $q = $subCategory->fixedItems()->orderBy('name');

        if ($s = $request->query('search')) {
            $q->where('name', 'like', "%{$s}%");
        }

        if ($perPage = (int) $request->query('per_page')) {
            return FixedItemResource::collection($q->paginate($perPage));
        }

        return FixedItemResource::collection($q->get());
    }
}