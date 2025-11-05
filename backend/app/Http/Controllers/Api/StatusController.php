<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class StatusController extends Controller
{
    public function index()
    {
        $rows = DB::table('status')->select('id','name')->orderBy('name')->get();
        return response()->json(['data' => $rows]);
    }
}
