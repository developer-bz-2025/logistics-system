<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonorController extends Controller
{
    /**
     * GET /api/donors - List all donors (finance role only)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role?->name !== Role::FINANCE) {
            return response()->json([
                'message' => 'This action is authorized for finance role only.',
            ], 403);
        }

        $donors = Donor::with(['financeOfficer', 'locations'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $donors]);
    }

    /**
     * POST /api/donors - Create new donor (finance role only)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role?->name !== Role::FINANCE) {
            return response()->json([
                'message' => 'This action is authorized for finance role only.',
            ], 403);
        }

        $validated = $request->validate([
            'account_no' => 'nullable|string|max:255',
            'department_name' => 'nullable|in:education,protection,FSL,peace_building,advocacy_research,support_community,basic_assistance_emergency,capacity_building_admin_support',
            'finance_officer_id' => 'nullable|integer|exists:users,id',
            'donor' => 'required|string|max:255',
            'end_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'location_ids' => 'nullable|array',
            'location_ids.*' => 'integer|exists:locations,id',
        ]);

        $locationIds = $validated['location_ids'] ?? [];
        unset($validated['location_ids']);

        DB::beginTransaction();
        try {
            $donor = Donor::create($validated);

            if (!empty($locationIds)) {
                $donor->locations()->sync($locationIds);
            }

            DB::commit();

            $donor->load(['financeOfficer', 'locations']);

            return response()->json($donor, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create donor.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/donors/{id} - Get donor details
     */
    public function show($id)
    {
        $donor = Donor::with(['financeOfficer', 'locations', 'documents.uploader'])->findOrFail($id);
        return response()->json($donor);
    }

    /**
     * PUT /api/donors/{id} - Update donor (finance role only)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || $user->role?->name !== Role::FINANCE) {
            return response()->json([
                'message' => 'This action is authorized for finance role only.',
            ], 403);
        }

        $donor = Donor::findOrFail($id);

        $validated = $request->validate([
            'account_no' => 'nullable|string|max:255',
            'department_name' => 'nullable|in:education,protection,FSL,peace_building,advocacy_research,support_community,basic_assistance_emergency,capacity_building_admin_support',
            'finance_officer_id' => 'nullable|integer|exists:users,id',
            'donor' => 'sometimes|required|string|max:255',
            'end_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'location_ids' => 'nullable|array',
            'location_ids.*' => 'integer|exists:locations,id',
        ]);

        $locationIds = $validated['location_ids'] ?? null;
        unset($validated['location_ids']);

        DB::beginTransaction();
        try {
            $donor->update($validated);

            if ($locationIds !== null) {
                $donor->locations()->sync($locationIds);
            }

            DB::commit();

            $donor->load(['financeOfficer', 'locations']);

            return response()->json($donor);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update donor.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/donors/{id} - Delete donor (finance role only)
     */
    public function destroy($id)
    {
        $user = request()->user();

        if (!$user || $user->role?->name !== Role::FINANCE) {
            return response()->json([
                'message' => 'This action is authorized for finance role only.',
            ], 403);
        }

        $donor = Donor::findOrFail($id);

        // Check if donor is used in any items
        $itemsCount = $donor->items()->count();
        if ($itemsCount > 0) {
            return response()->json([
                'message' => "Cannot delete donor. It is associated with {$itemsCount} asset(s).",
            ], 422);
        }

        $donor->locations()->detach();
        $donor->delete();

        return response()->json(['message' => 'Donor deleted successfully.']);
    }

    /**
     * GET /api/donors-for-asset-creation - Get donors list for log_admin asset creation
     */
    public function getDonorsForAssetCreation(Request $request)
    {
        $donors = Donor::select(['id', 'donor', 'account_no', 'department_name'])
            ->orderBy('donor', 'asc')
            ->get();

        return response()->json(['data' => $donors]);
    }
}
