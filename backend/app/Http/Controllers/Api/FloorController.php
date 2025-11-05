<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class FloorController extends Controller
{
    public function index()
    {
        $rows = DB::table('floors')->select('id','name')->orderBy('id')->get();
        return response()->json(['data' => $rows]);
    }
}
