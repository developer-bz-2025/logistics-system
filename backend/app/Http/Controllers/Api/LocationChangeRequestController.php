<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateLocationChangeRequestRequest;
use App\Models\Item;
use App\Models\Location;
use App\Models\LocationChangeRequest;
use App\Models\ChangeStatus;
use App\Models\Role;
use App\Models\User;
use App\Services\ItemHistoryService;
use App\Services\NotificationService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LocationChangeRequestController extends Controller
{
    /**
     * Create a location change request
     * If both locations have the same admin, move immediately and log
     * Otherwise, create a pending request
     */
    public function store(CreateLocationChangeRequestRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $itemId = $validated['item_id'];
        $requestedLocationId = $validated['requested_location_id'];
        $notes = $validated['notes'] ?? null;
        $requestedByAdminId = auth()->id();

        return DB::transaction(function () use ($itemId, $requestedLocationId, $notes, $requestedByAdminId) {
            // Check if there's already a pending request for this item
            $pendingStatusIds = DB::table('change_status')
                ->whereIn('value', ['Pending', 'Pending Approval'])
                ->pluck('id')
                ->all();

            $existingPendingRequest = LocationChangeRequest::where('item_id', $itemId)
                ->whereIn('change_location_status_id', $pendingStatusIds)
                ->with(['current:id,name', 'requested:id,name', 'statusRef:id,value'])
                ->first();

            if ($existingPendingRequest) {
                return response()->json([
                    'message' => 'There is already a pending location change request for this item. Please wait for approval or rejection before submitting another request.',
                    'errors' => [
                        'item_id' => [
                            'A location change request already exists for this item and is pending approval. ' .
                            'You cannot create a new request until the existing request is approved or rejected.'
                        ]
                    ],
                    'existing_request' => [
                        'id' => $existingPendingRequest->id,
                        'current_location' => $existingPendingRequest->current->name ?? null,
                        'requested_location' => $existingPendingRequest->requested->name ?? null,
                        'status' => $existingPendingRequest->statusRef->value ?? null,
                        'request_date' => $existingPendingRequest->request_date,
                    ]
                ], 409);
            }

            // Load the item with its current location
            $item = Item::with('location')->findOrFail($itemId);
            $currentLocationId = $item->location_id;

            // Check if requested location is the same as current
            if ($currentLocationId === $requestedLocationId) {
                return response()->json([
                    'message' => 'The requested location is the same as the current location.',
                    'errors' => [
                        'requested_location_id' => ['The requested location must be different from the current location.']
                    ]
                ], 422);
            }

            // Load locations
            $currentLocation = Location::findOrFail($currentLocationId);
            $requestedLocation = Location::findOrFail($requestedLocationId);

            // Check if both locations have the same admin
            $hasSameAdmin = $this->locationsHaveSameAdmin($currentLocationId, $requestedLocationId);

            if ($hasSameAdmin) {
                // Same admin: move immediately and log
                $oldLocation = $item->location;
                $item->location_id = $requestedLocationId;
                $item->save();

                // Log the location change
                ItemHistoryService::logLocationChanged(
                    $item->id,
                    $oldLocation,
                    $requestedLocation
                );

                // Log activity
                ActivityLogService::logLocationChanged($requestedByAdminId, $item->id, [
                    'old_location_id' => $currentLocationId,
                    'old_location_name' => $oldLocation->name ?? null,
                    'new_location_id' => $requestedLocationId,
                    'new_location_name' => $requestedLocation->name ?? null,
                    'moved_immediately' => true,
                ]);

                return response()->json([
                    'message' => 'Location changed successfully.',
                    'data' => [
                        'item_id' => $item->id,
                        'old_location_id' => $currentLocationId,
                        'new_location_id' => $requestedLocationId,
                        'moved_immediately' => true,
                    ]
                ], 200);
            } else {
                // Different admins: create pending request
                $pendingStatus = ChangeStatus::where('value', 'Pending')->first();

                if (!$pendingStatus) {
                    return response()->json([
                        'message' => 'Pending status not found in the system.',
                    ], 500);
                }

                // Create the request
                $locationChangeRequest = LocationChangeRequest::create([
                    'item_id' => $itemId,
                    'current_location_id' => $currentLocationId,
                    'requested_location_id' => $requestedLocationId,
                    'requested_by_admin_id' => $requestedByAdminId,
                    'change_location_status_id' => $pendingStatus->id,
                    'request_date' => now(),
                    'notes' => $notes,
                ]);

                // Log the request submission
                ItemHistoryService::logEvent(
                    $itemId,
                    'location_change_request_submitted',
                    'Location change request submitted',
                    [
                        'request_id' => $locationChangeRequest->id,
                        'current_location_id' => $currentLocationId,
                        'requested_location_id' => $requestedLocationId,
                    ],
                    $requestedByAdminId
                );

                // Log activity
                ActivityLogService::logLocationChangeRequestCreated($requestedByAdminId, $locationChangeRequest->id, $itemId, [
                    'current_location_id' => $currentLocationId,
                    'current_location_name' => $currentLocation->name ?? null,
                    'requested_location_id' => $requestedLocationId,
                    'requested_location_name' => $requestedLocation->name ?? null,
                    'status' => 'Pending',
                    'notes' => $notes,
                ]);

                // Send notification to log admins of the requested location
                $requester = User::find($requestedByAdminId);
                NotificationService::notifyLocationChangeRequestReceived(
                    $locationChangeRequest->id,
                    $itemId,
                    $item->description ?? $item->sn ?? "Item #{$itemId}",
                    $currentLocation->name ?? 'Unknown',
                    $requestedLocation->name ?? 'Unknown',
                    $requestedByAdminId,
                    $requester->name ?? 'Unknown',
                    $requestedLocationId
                );

                $locationChangeRequest->load([
                    'item:id,description,sn',
                    'current:id,name',
                    'requested:id,name',
                    'requester:id,name,email',
                    'statusRef:id,value'
                ]);

                return response()->json([
                    'message' => 'Location change request created successfully.',
                    'data' => [
                        'id' => $locationChangeRequest->id,
                        'item_id' => $locationChangeRequest->item_id,
                        'current_location' => [
                            'id' => $locationChangeRequest->current->id,
                            'name' => $locationChangeRequest->current->name,
                        ],
                        'requested_location' => [
                            'id' => $locationChangeRequest->requested->id,
                            'name' => $locationChangeRequest->requested->name,
                        ],
                        'status' => $locationChangeRequest->statusRef->value,
                        'requested_by' => [
                            'id' => $locationChangeRequest->requester->id,
                            'name' => $locationChangeRequest->requester->name,
                        ],
                        'request_date' => $locationChangeRequest->request_date,
                        'notes' => $locationChangeRequest->notes,
                        'moved_immediately' => false,
                    ]
                ], 201);
            }
        });
    }

    /**
     * Check if two locations have at least one common admin
     */
    private function locationsHaveSameAdmin(int $locationId1, int $locationId2): bool
    {
        // Get log admin role ID
        $logAdminRoleId = Role::where('name', Role::LOG_ADMIN)->value('id');

        if (!$logAdminRoleId) {
            return false;
        }

        // Get admin user IDs for location 1
        $admins1 = DB::table('user_locations')
            ->join('users', 'user_locations.user_id', '=', 'users.id')
            ->where('user_locations.location_id', $locationId1)
            ->where('users.role_id', $logAdminRoleId)
            ->pluck('users.id')
            ->toArray();

        // Get admin user IDs for location 2
        $admins2 = DB::table('user_locations')
            ->join('users', 'user_locations.user_id', '=', 'users.id')
            ->where('user_locations.location_id', $locationId2)
            ->where('users.role_id', $logAdminRoleId)
            ->pluck('users.id')
            ->toArray();

        // Check if there's any common admin
        return !empty(array_intersect($admins1, $admins2));
    }


    /**
     * GET /api/location-change-requests
     * Fetch location change requests for the authenticated admin's locations
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user || $user->role?->name !== Role::LOG_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for log admins only.',
            ], 403);
        }

        // Get admin's assigned location IDs
        $adminLocationIds = $user->locations()->pluck('locations.id')->all();

        if (empty($adminLocationIds)) {
            return response()->json([
                'data' => [],
                'total' => 0,
            ]);
        }

        $query = LocationChangeRequest::with([
            'item:id,description,sn,fixed_item_id',
            'item.fixedItem:id,name',
            'current:id,name',
            'requested:id,name',
            'requester:id,name,email',
            'approver:id,name,email',
            'statusRef:id,value'
        ])
        ->whereIn('requested_location_id', $adminLocationIds)
        ->orderBy('request_date', 'desc');

        // Filter by status if provided
        if ($request->filled('status')) {
            $statuses = is_array($request->status) 
                ? $request->status 
                : explode(',', $request->status);
            
            $query->whereHas('statusRef', function ($q) use ($statuses) {
                $q->whereIn('value', array_map('trim', $statuses));
            });
        }

        // Pagination
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);
        $page = $query->paginate($perPage);

        $data = collect($page->items())->map(function ($request) {
            return [
                'id' => (int) $request->id,
                'item' => [
                    'id' => (int) $request->item_id,
                    'description' => $request->item->description ?? null,
                    'sn' => $request->item->sn ?? null,
                    'fixed_item_id' => $request->item->fixed_item_id !== null ? (int) $request->item->fixed_item_id : null,
                    'fixed_item_name' => $request->item->fixedItem->name ?? null,
                ],
                'current_location' => [
                    'id' => (int) $request->current_location_id,
                    'name' => $request->current->name ?? null,
                ],
                'requested_location' => [
                    'id' => (int) $request->requested_location_id,
                    'name' => $request->requested->name ?? null,
                ],
                'status' => $request->statusRef->value ?? null,
                'requested_by' => [
                    'id' => (int) $request->requested_by_admin_id,
                    'name' => $request->requester->name ?? null,
                    'email' => $request->requester->email ?? null,
                ],
                'approved_by' => $request->approved_by_admin_id ? [
                    'id' => (int) $request->approved_by_admin_id,
                    'name' => $request->approver->name ?? null,
                    'email' => $request->approver->email ?? null,
                ] : null,
                'request_date' => $request->request_date?->toDateTimeString(),
                'approval_date' => $request->approval_date?->toDateTimeString(),
                'notes' => $request->notes,
            ];
        });

        return response()->json([
            'data' => $data,
            'total' => $page->total(),
            'per_page' => $page->perPage(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
        ]);
    }

    /**
     * POST /api/location-change-requests/{id}/approve
     * Approve a location change request and move the item
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user || $user->role?->name !== Role::LOG_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for log admins only.',
            ], 403);
        }

        $locationChangeRequest = LocationChangeRequest::with(['item', 'current', 'requested', 'statusRef'])
            ->findOrFail($id);

        // Check if request is pending
        $pendingStatusIds = DB::table('change_status')
            ->whereIn('value', ['Pending', 'Pending Approval'])
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();

        if (!in_array((int) $locationChangeRequest->change_location_status_id, $pendingStatusIds)) {
            return response()->json([
                'message' => 'This request is not pending.',
                'errors' => [
                    'status' => ['This request is not pending.']
                ]
            ], 422);
        }

        // Verify admin has permission for the requested location
        $adminLocationIds = $user->locations()->pluck('locations.id')->all();
        if (!in_array($locationChangeRequest->requested_location_id, $adminLocationIds)) {
            return response()->json([
                'message' => 'You do not have permission to approve requests for this location.',
                'errors' => [
                    'location' => ['You are not an admin for the requested location.']
                ]
            ], 403);
        }

        return DB::transaction(function () use ($locationChangeRequest, $user) {
            $item = $locationChangeRequest->item;
            $oldLocation = $locationChangeRequest->current;
            $newLocation = $locationChangeRequest->requested;

            // Update item location
            $item->location_id = $locationChangeRequest->requested_location_id;
            $item->save();

            // Update request status
            $approvedStatus = ChangeStatus::where('value', 'Approved')->first();
            if (!$approvedStatus) {
                $approvedStatus = ChangeStatus::create(['value' => 'Approved']);
            }

            $locationChangeRequest->change_location_status_id = $approvedStatus->id;
            $locationChangeRequest->approved_by_admin_id = $user->id;
            $locationChangeRequest->approval_date = now();
            $locationChangeRequest->save();

            // Log the location change
            ItemHistoryService::logLocationChanged(
                $item->id,
                $oldLocation,
                $newLocation
            );

            // Log request approval
            ItemHistoryService::logEvent(
                $item->id,
                'location_change_request_approved',
                'Location change request approved',
                [
                    'request_id' => $locationChangeRequest->id,
                    'old_location_id' => $locationChangeRequest->current_location_id,
                    'new_location_id' => $locationChangeRequest->requested_location_id,
                ],
                $user->id
            );

            // Log activity
            ActivityLogService::logLocationChangeRequestApproved($user->id, $locationChangeRequest->id, $item->id, [
                'old_location_id' => $locationChangeRequest->current_location_id,
                'old_location_name' => $oldLocation->name ?? null,
                'new_location_id' => $locationChangeRequest->requested_location_id,
                'new_location_name' => $newLocation->name ?? null,
            ]);
            
            ActivityLogService::logLocationChanged($user->id, $item->id, [
                'old_location_id' => $locationChangeRequest->current_location_id,
                'old_location_name' => $oldLocation->name ?? null,
                'new_location_id' => $locationChangeRequest->requested_location_id,
                'new_location_name' => $newLocation->name ?? null,
                'via_request' => true,
                'request_id' => $locationChangeRequest->id,
            ]);

            // Send notification to requester
            $requester = User::find($locationChangeRequest->requested_by_admin_id);
            NotificationService::notifyLocationChangeRequestApproved(
                $locationChangeRequest->id,
                $item->id,
                $item->description ?? $item->sn ?? "Item #{$item->id}",
                $oldLocation->name ?? 'Unknown',
                $newLocation->name ?? 'Unknown',
                $user->id,
                $user->name ?? 'Unknown',
                $locationChangeRequest->requested_by_admin_id
            );

            return response()->json([
                'message' => 'Location change request approved and item moved successfully.',
                'data' => [
                    'id' => (int) $locationChangeRequest->id,
                    'item_id' => (int) $item->id,
                    'old_location' => [
                        'id' => (int) $locationChangeRequest->current_location_id,
                        'name' => $oldLocation->name ?? null,
                    ],
                    'new_location' => [
                        'id' => (int) $locationChangeRequest->requested_location_id,
                        'name' => $newLocation->name ?? null,
                    ],
                    'status' => 'Approved',
                    'approved_by' => [
                        'id' => (int) $user->id,
                        'name' => $user->name,
                    ],
                    'approval_date' => $locationChangeRequest->approval_date?->toDateTimeString(),
                ]
            ]);
        });
    }

    /**
     * POST /api/location-change-requests/{id}/reject
     * Reject a location change request
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user || $user->role?->name !== Role::LOG_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for log admins only.',
            ], 403);
        }

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'min:3'],
        ]);

        $locationChangeRequest = LocationChangeRequest::with(['item', 'current', 'requested', 'statusRef'])
            ->findOrFail($id);

        // Check if request is pending
        $pendingStatusIds = DB::table('change_status')
            ->whereIn('value', ['Pending', 'Pending Approval'])
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();

        if (!in_array((int) $locationChangeRequest->change_location_status_id, $pendingStatusIds)) {
            return response()->json([
                'message' => 'This request is not pending.',
                'errors' => [
                    'status' => ['This request is not pending.']
                ]
            ], 422);
        }

        // Verify admin has permission for the requested location
        $adminLocationIds = $user->locations()->pluck('locations.id')->all();
        if (!in_array($locationChangeRequest->requested_location_id, $adminLocationIds)) {
            return response()->json([
                'message' => 'You do not have permission to reject requests for this location.',
                'errors' => [
                    'location' => ['You are not an admin for the requested location.']
                ]
            ], 403);
        }

        return DB::transaction(function () use ($locationChangeRequest, $user, $data) {
            // Update request status
            $rejectedStatus = ChangeStatus::where('value', 'Rejected')->first();
            if (!$rejectedStatus) {
                $rejectedStatus = ChangeStatus::create(['value' => 'Rejected']);
            }

            $locationChangeRequest->change_location_status_id = $rejectedStatus->id;
            $locationChangeRequest->approved_by_admin_id = $user->id;
            $locationChangeRequest->approval_date = now();
            
            // Append rejection reason to notes
            if (!empty($data['reason'])) {
                $locationChangeRequest->notes = trim(
                    ($locationChangeRequest->notes ? $locationChangeRequest->notes . "\n" : '') . 
                    'Rejection reason: ' . $data['reason']
                );
            }
            
            $locationChangeRequest->save();

            // Log request rejection
            ItemHistoryService::logEvent(
                $locationChangeRequest->item_id,
                'location_change_request_rejected',
                'Location change request rejected' . (!empty($data['reason']) ? ': ' . $data['reason'] : ''),
                [
                    'request_id' => $locationChangeRequest->id,
                    'reason' => $data['reason'] ?? null,
                ],
                $user->id
            );

            // Log activity
            ActivityLogService::logLocationChangeRequestRejected(
                $user->id,
                $locationChangeRequest->id,
                $locationChangeRequest->item_id,
                $data['reason'] ?? null
            );

            // Send notification to requester
            $requester = User::find($locationChangeRequest->requested_by_admin_id);
            $item = $locationChangeRequest->item;
            NotificationService::notifyLocationChangeRequestRejected(
                $locationChangeRequest->id,
                $locationChangeRequest->item_id,
                $item->description ?? $item->sn ?? "Item #{$locationChangeRequest->item_id}",
                $locationChangeRequest->current->name ?? 'Unknown',
                $locationChangeRequest->requested->name ?? 'Unknown',
                $user->id,
                $user->name ?? 'Unknown',
                $locationChangeRequest->requested_by_admin_id,
                $data['reason'] ?? null
            );

            return response()->json([
                'message' => 'Location change request rejected.',
                'data' => [
                    'id' => (int) $locationChangeRequest->id,
                    'status' => 'Rejected',
                    'rejected_by' => [
                        'id' => (int) $user->id,
                        'name' => $user->name,
                    ],
                    'rejection_date' => $locationChangeRequest->approval_date?->toDateTimeString(),
                    'reason' => $data['reason'] ?? null,
                ]
            ]);
        });
    }

    /**
     * Resolve status ID
     */
    private function statusId(string $value): int
    {
        $status = ChangeStatus::where('value', $value)->first();
        if (!$status) {
            $status = ChangeStatus::create(['value' => $value]);
        }
        return (int) $status->id;
    }
}

