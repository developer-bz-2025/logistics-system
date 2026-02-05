<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use App\Models\Role;


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

    public function assetsByLocationCategory()
    {
        $stats = DB::table('items')
            ->join('locations', 'items.location_id', '=', 'locations.id')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
            ->join('categories', 'sub_category.cat_id', '=', 'categories.id')
            ->select('locations.name as location', 'categories.name as category', DB::raw('COUNT(items.id) as count'))
            ->groupBy('locations.name', 'categories.name')
            ->orderBy('locations.name')
            ->orderBy('categories.name')
            ->get();

        // Group by location, then by category
        $groupedStats = [];
        foreach ($stats as $stat) {
            $location = $stat->location;
            $category = $stat->category;
            $count = $stat->count;

            if (!isset($groupedStats[$location])) {
                $groupedStats[$location] = [];
            }

            $groupedStats[$location][$category] = $count;
        }

        return response()->json([
            'data' => $groupedStats
        ]);
    }


    public function logAdminStats()
    {
        $user = auth()->user();

        if (!$user || $user->role?->name !== Role::LOG_ADMIN) {
            $message = !$user ? 'Unauthorized' : 'Access denied. Logistics Admin only.';
            $status = !$user ? 401 : 403;
            return response()->json(['message' => $message], $status);
        }

        $locationIds = $user->locations()->pluck('locations.id')->toArray();

        if (empty($locationIds)) {
            return response()->json(['data' => []]);
        }

        $stats = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
            ->join('categories', 'sub_category.cat_id', '=', 'categories.id')
            ->whereIn('items.location_id', $locationIds) // Filter by admin's locations
            ->select('categories.name', DB::raw('COUNT(items.id) as count'))
            ->groupBy('categories.name')
            ->orderBy('categories.name')
            ->pluck('count', 'name')
            ->toArray();

        // Format category names
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
