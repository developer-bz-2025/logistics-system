<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemHistory;
use Illuminate\Http\Request;

class ItemHistoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ItemHistory::with(['item', 'actor']);

        // Filter by item_id if provided
        if ($request->has('item_id') && $request->item_id) {
            $query->where('item_id', $request->item_id);
        }

        // Filter by event_type if provided
        if ($request->has('event_type') && $request->event_type) {
            $query->where('event_type', $request->event_type);
        }

        // Filter by user if provided
        if ($request->has('by_user_id') && $request->by_user_id) {
            $query->where('by_user_id', $request->by_user_id);
        }

        // Filter by date range
        if ($request->has('from_date') && $request->from_date) {
            $query->where('accurred_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && $request->to_date) {
            $query->where('accurred_at', '<=', $request->to_date);
        }

        // Order by occurred_at descending (most recent first)
        $query->orderBy('accurred_at', 'desc');

        // Paginate the results
        $perPage = $request->get('per_page', 15);
        $histories = $query->paginate($perPage);

        return response()->json($histories);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
