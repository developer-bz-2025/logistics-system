<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    public function index()
    {
        $rows = DB::table('locations')->select('id','name')->orderBy('name')->get();
        return response()->json(['data' => $rows]);
    }
}
