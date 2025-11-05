<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $stats = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
            ->join('categories', 'sub_category.cat_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('COUNT(items.id) as count'))
            ->groupBy('categories.name')
            ->orderBy('categories.name')
            ->pluck('count', 'name')
            ->toArray();

        // Format category names to match the requested format
        $formattedStats = [];
        foreach ($stats as $category => $count) {
            $formattedName = strtolower(str_replace(' ', '_', $category));
            $formattedStats[$formattedName] = $count;
        }

        return response()->json([
            'data' => $formattedStats
        ]);
    }
}
