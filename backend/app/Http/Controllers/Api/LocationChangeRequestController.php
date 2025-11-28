<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateLocationChangeRequestRequest;
use App\Models\Item;
use App\Models\Location;
use App\Models\LocationChangeRequest;
use App\Models\ChangeStatus;
use App\Models\Role;
use App\Models\ActivityLog;
use App\Models\Action;
use App\Services\ItemHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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

                // Log activity for super admin
                $this->logActivity(
                    $requestedByAdminId,
                    'Location Changed',
                    [
                        'item_id' => $item->id,
                        'old_location_id' => $currentLocationId,
                        'old_location_name' => $oldLocation->name ?? null,
                        'new_location_id' => $requestedLocationId,
                        'new_location_name' => $requestedLocation->name ?? null,
                        'moved_immediately' => true,
                    ]
                );

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

                // Log activity for super admin
                $this->logActivity(
                    $requestedByAdminId,
                    'Location Change Request Created',
                    [
                        'request_id' => $locationChangeRequest->id,
                        'item_id' => $itemId,
                        'current_location_id' => $currentLocationId,
                        'current_location_name' => $currentLocation->name ?? null,
                        'requested_location_id' => $requestedLocationId,
                        'requested_location_name' => $requestedLocation->name ?? null,
                        'status' => 'Pending',
                        'notes' => $notes,
                    ]
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
     * Ensure action exists and return its ID
     */
    private function ensureAction(string $actionName): int
    {
        $action = Action::firstOrCreate(
            ['action' => $actionName],
            ['action' => $actionName]
        );

        return $action->id;
    }

    /**
     * Log activity to activity_log table
     */
    private function logActivity(int $userId, string $actionName, array $context = []): void
    {
        $actionId = $this->ensureAction($actionName);

        ActivityLog::create([
            'user_id' => $userId,
            'action_id' => $actionId,
            'created_at' => now(),
        ]);
    }
}

