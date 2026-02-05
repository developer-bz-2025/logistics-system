<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use App\Services\ActivityLogService;

class LocationController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Location::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $location = Location::create([
            'name' => trim($validator->validated()['name']),
        ]);

        // Log activity
        ActivityLogService::logLocationCreated(auth()->id(), $location->id, $location->name);

        return response()->json([
            'id' => $location->id,
            'name' => $location->name,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $location = Location::find($id);

        if (!$location) {
            return response()->json([
                'message' => 'Location not found.',
                'errors' => [
                    'id' => ['The location with the given ID does not exist.']
                ]
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $oldName = $location->name;
        $location->update([
            'name' => trim($validator->validated()['name']),
        ]);

        // Log activity
        ActivityLogService::logLocationUpdated(auth()->id(), $location->id, $location->name, [
            'old_name' => $oldName,
            'new_name' => $location->name,
        ]);

        return response()->json([
            'id' => $location->id,
            'name' => $location->name,
        ]);
    }

    public function destroy($id): JsonResponse|Response
    {
        $location = Location::find($id);

        if (!$location) {
            return response()->json([
                'message' => 'Location not found.',
                'errors' => [
                    'id' => ['The location with the given ID does not exist.']
                ]
            ], 404);
        }

        // Check if location has related items
        if ($location->items()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete location. It is associated with one or more items.',
                'errors' => [
                    'location_id' => ['This location cannot be deleted because it has associated items. Please reassign or remove the items first.']
                ]
            ], 422);
        }

        // Check if location has associated users
        if ($location->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete location. It is assigned to one or more users.',
                'errors' => [
                    'location_id' => ['This location cannot be deleted because it is assigned to users. Please unassign the users first.']
                ]
            ], 422);
        }

        // Check if location has change requests
        $hasChangeRequests = $location->currentChangeRequests()->count() > 0 
            || $location->requestedChangeRequests()->count() > 0;
        
        if ($hasChangeRequests) {
            return response()->json([
                'message' => 'Cannot delete location. It has associated location change requests.',
                'errors' => [
                    'location_id' => ['This location cannot be deleted because it has associated location change requests.']
                ]
            ], 422);
        }

        $locationName = $location->name;
        $locationId = $location->id;
        $location->delete();

        // Log activity
        ActivityLogService::logLocationDeleted(auth()->id(), $locationId, $locationName);

        return response()->noContent();
    }
}
