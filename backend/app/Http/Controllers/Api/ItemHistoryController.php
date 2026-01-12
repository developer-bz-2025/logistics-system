<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemHistory;
use App\Models\LocationChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemHistoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $itemId = $request->route('item') ?? $request->input('item_id');
        
        if (!$itemId) {
            return response()->json([
                'message' => 'Item ID is required.',
                'errors' => ['item_id' => ['Item ID must be provided.']]
            ], 422);
        }

        $query = ItemHistory::with([
            'item:id,description,sn',
            'actor:id,name,email' // Load actor relationship
        ])
            ->where('item_id', $itemId);

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
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);
        $histories = $query->paginate($perPage);

        // Get location change request IDs from payloads
        $locationChangeRequestIds = [];
        foreach ($histories->items() as $history) {
            if (in_array($history->event_type, [
                'location_change_request_submitted',
                'location_change_request_approved',
                'location_change_request_rejected'
            ]) && isset($history->payload['request_id'])) {
                $locationChangeRequestIds[] = $history->payload['request_id'];
            }
        }

        // Load location change requests with relationships
        $locationChangeRequests = [];
        if (!empty($locationChangeRequestIds)) {
            $requests = LocationChangeRequest::with([
                'current:id,name',
                'requested:id,name',
                'requester:id,name,email',
                'approver:id,name,email',
                'statusRef:id,value'
            ])
            ->whereIn('id', array_unique($locationChangeRequestIds))
            ->get()
            ->keyBy('id');

            foreach ($requests as $req) {
                $locationChangeRequests[$req->id] = [
                    'id' => (int) $req->id,
                    'current_location' => [
                        'id' => (int) $req->current_location_id,
                        'name' => $req->current->name ?? null,
                    ],
                    'requested_location' => [
                        'id' => (int) $req->requested_location_id,
                        'name' => $req->requested->name ?? null,
                    ],
                    'status' => $req->statusRef->value ?? null,
                    'requested_by' => [
                        'id' => (int) $req->requested_by_admin_id,
                        'name' => $req->requester->name ?? null,
                        'email' => $req->requester->email ?? null,
                    ],
                    'approved_by' => $req->approved_by_admin_id ? [
                        'id' => (int) $req->approved_by_admin_id,
                        'name' => $req->approver->name ?? null,
                        'email' => $req->approver->email ?? null,
                    ] : null,
                    'request_date' => $req->request_date?->toDateTimeString(),
                    'approval_date' => $req->approval_date?->toDateTimeString(),
                    'notes' => $req->notes,
                ];
            }
        }

        // Collect all IDs from payloads to resolve names
        $statusIds = [];
        $floorIds = [];
        $locationIds = [];
        $holderUserIds = [];
        $brandIds = [];
        $colorIds = [];
        $supplierIds = [];

        foreach ($histories->items() as $history) {
            if ($history->payload && isset($history->payload['changes'])) {
                $changes = $history->payload['changes'];
                if (isset($changes['old_values'])) {
                    $this->collectIds($changes['old_values'], $statusIds, $floorIds, $locationIds, $holderUserIds, $brandIds, $colorIds, $supplierIds);
                }
                if (isset($changes['new_values'])) {
                    $this->collectIds($changes['new_values'], $statusIds, $floorIds, $locationIds, $holderUserIds, $brandIds, $colorIds, $supplierIds);
                }
            }
        }

        // Fetch names for all IDs
        $statusNames = $this->fetchStatusNames(array_unique($statusIds));
        $floorNames = $this->fetchFloorNames(array_unique($floorIds));
        $locationNames = $this->fetchLocationNames(array_unique($locationIds));
        $holderNames = $this->fetchUserNames(array_unique($holderUserIds));
        $brandNames = $this->fetchBrandNames(array_unique($brandIds));
        $colorNames = $this->fetchColorNames(array_unique($colorIds));
        $supplierNames = $this->fetchSupplierNames(array_unique($supplierIds));

        // Format response
        $data = collect($histories->items())->map(function ($history) use ($locationChangeRequests, $statusNames, $floorNames, $locationNames, $holderNames, $brandNames, $colorNames, $supplierNames) {
            $payload = $history->payload ?? [];
            
            // Resolve IDs to names in payload if it's an update event
            if ($history->event_type === 'updated' && isset($payload['changes'])) {
                $payload = $this->resolvePayloadNames($payload, $statusNames, $floorNames, $locationNames, $holderNames, $brandNames, $colorNames, $supplierNames);
            }

            // Handle by_user - try relationship first, then fallback to manual load if needed
            $byUser = null;
            if ($history->by_user_id !== null) {
                if ($history->actor) {
                    // Relationship loaded successfully
                    $byUser = [
                        'id' => (int) $history->actor->id,
                        'name' => $history->actor->name ?? null,
                        'email' => $history->actor->email ?? null,
                    ];
                } else {
                    // Relationship failed, try to load manually
                    $user = DB::table('users')
                        ->where('id', $history->by_user_id)
                        ->select('id', 'name', 'email')
                        ->first();
                    
                    if ($user) {
                        $byUser = [
                            'id' => (int) $user->id,
                            'name' => $user->name ?? null,
                            'email' => $user->email ?? null,
                        ];
                    }
                }
            }

            $response = [
                'id' => (int) $history->id,
                'item_id' => (int) $history->item_id,
                'event_type' => $history->event_type,
                'summary' => $history->summary,
                'by_user_id' => $history->by_user_id !== null ? (int) $history->by_user_id : null,
                'by_user' => $byUser,
                'occurred_at' => $history->accurred_at?->toDateTimeString(),
                'payload' => $payload,
            ];

            // Add location change request details if available
            if (in_array($history->event_type, [
                'location_change_request_submitted',
                'location_change_request_approved',
                'location_change_request_rejected'
            ]) && isset($history->payload['request_id'])) {
                $requestId = $history->payload['request_id'];
                if (isset($locationChangeRequests[$requestId])) {
                    $response['location_change_request'] = $locationChangeRequests[$requestId];
                }
            }

            return $response;
        });

        return response()->json([
            'data' => $data,
            'total' => $histories->total(),
            'per_page' => $histories->perPage(),
            'current_page' => $histories->currentPage(),
            'last_page' => $histories->lastPage(),
        ]);
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

    /**
     * Collect IDs from values array
     */
    private function collectIds(array $values, &$statusIds, &$floorIds, &$locationIds, &$holderUserIds, &$brandIds, &$colorIds, &$supplierIds): void
    {
        if (isset($values['status_id']) && $values['status_id'] !== null) {
            $statusIds[] = (int) $values['status_id'];
        }
        if (isset($values['floor_id']) && $values['floor_id'] !== null) {
            $floorIds[] = (int) $values['floor_id'];
        }
        if (isset($values['location_id']) && $values['location_id'] !== null) {
            $locationIds[] = (int) $values['location_id'];
        }
        if (isset($values['holder_user_id']) && $values['holder_user_id'] !== null) {
            $holderUserIds[] = (int) $values['holder_user_id'];
        }
        if (isset($values['brand_id']) && $values['brand_id'] !== null) {
            $brandIds[] = (int) $values['brand_id'];
        }
        if (isset($values['color_id']) && $values['color_id'] !== null) {
            $colorIds[] = (int) $values['color_id'];
        }
        if (isset($values['supplier_id']) && $values['supplier_id'] !== null) {
            $supplierIds[] = (int) $values['supplier_id'];
        }
    }

    /**
     * Fetch status names by IDs
     */
    private function fetchStatusNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('status')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Fetch floor names by IDs
     */
    private function fetchFloorNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('floors')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Fetch location names by IDs
     */
    private function fetchLocationNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('locations')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Fetch user names by IDs
     */
    private function fetchUserNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('users')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Fetch brand names by IDs
     */
    private function fetchBrandNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('brands')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Fetch color names by IDs
     */
    private function fetchColorNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('colors')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Fetch supplier names by IDs
     */
    private function fetchSupplierNames(array $ids): array
    {
        if (empty($ids)) return [];
        return DB::table('suppliers')
            ->whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($item) {
                return [(int) $item->id => $item->name];
            })
            ->toArray();
    }

    /**
     * Resolve IDs to names in payload
     */
    private function resolvePayloadNames(array $payload, array $statusNames, array $floorNames, array $locationNames, array $holderNames, array $brandNames, array $colorNames, array $supplierNames): array
    {
        if (!isset($payload['changes'])) {
            return $payload;
        }

        $resolved = $payload;
        
        // Resolve old_values
        if (isset($resolved['changes']['old_values'])) {
            $resolved['changes']['old_values'] = $this->resolveValues($resolved['changes']['old_values'], $statusNames, $floorNames, $locationNames, $holderNames, $brandNames, $colorNames, $supplierNames);
        }

        // Resolve new_values
        if (isset($resolved['changes']['new_values'])) {
            $resolved['changes']['new_values'] = $this->resolveValues($resolved['changes']['new_values'], $statusNames, $floorNames, $locationNames, $holderNames, $brandNames, $colorNames, $supplierNames);
        }

        return $resolved;
    }

    /**
     * Resolve IDs to names in values array
     */
    private function resolveValues(array $values, array $statusNames, array $floorNames, array $locationNames, array $holderNames, array $brandNames, array $colorNames, array $supplierNames): array
    {
        $resolved = $values;

        if (isset($resolved['status_id']) && $resolved['status_id'] !== null) {
            $statusId = (int) $resolved['status_id'];
            $resolved['status_id'] = $statusId;
            $resolved['status_name'] = $statusNames[$statusId] ?? null;
        }
        if (isset($resolved['floor_id']) && $resolved['floor_id'] !== null) {
            $floorId = (int) $resolved['floor_id'];
            $resolved['floor_id'] = $floorId;
            $resolved['floor_name'] = $floorNames[$floorId] ?? null;
        }
        if (isset($resolved['location_id']) && $resolved['location_id'] !== null) {
            $locationId = (int) $resolved['location_id'];
            $resolved['location_id'] = $locationId;
            $resolved['location_name'] = $locationNames[$locationId] ?? null;
        }
        if (isset($resolved['holder_user_id']) && $resolved['holder_user_id'] !== null) {
            $holderId = (int) $resolved['holder_user_id'];
            $resolved['holder_user_id'] = $holderId;
            $resolved['holder_name'] = $holderNames[$holderId] ?? null;
        }
        if (isset($resolved['brand_id']) && $resolved['brand_id'] !== null) {
            $brandId = (int) $resolved['brand_id'];
            $resolved['brand_id'] = $brandId;
            $resolved['brand_name'] = $brandNames[$brandId] ?? null;
        }
        if (isset($resolved['color_id']) && $resolved['color_id'] !== null) {
            $colorId = (int) $resolved['color_id'];
            $resolved['color_id'] = $colorId;
            $resolved['color_name'] = $colorNames[$colorId] ?? null;
        }
        if (isset($resolved['supplier_id']) && $resolved['supplier_id'] !== null) {
            $supplierId = (int) $resolved['supplier_id'];
            $resolved['supplier_id'] = $supplierId;
            $resolved['supplier_name'] = $supplierNames[$supplierId] ?? null;
        }

        return $resolved;
    }
}
