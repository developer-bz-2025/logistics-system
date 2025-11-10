<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $q = DB::table('brands')->select('brands.id','brands.name')->orderBy('brands.name');

        // optional category filter via pivot brand_category
        if ($cid = $request->query('category_id')) {
            $q->join('brand_category', 'brands.id', '=', 'brand_category.brand_id')
              ->where('brand_category.category_id', $cid);
        }

        return response()->json(['data' => $q->get()]);
    }
}
