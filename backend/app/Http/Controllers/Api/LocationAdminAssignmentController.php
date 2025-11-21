<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignLocationAdminRequest;
use App\Models\Role;
use App\Models\User;
use App\Models\UserLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationAdminAssignmentController extends Controller
{
    public function assignedAdmins(): JsonResponse
    {
        $admins = User::query()
            ->select(['id', 'name', 'email', 'employee_no'])
            ->with([
                'role:id,name',
                'locations:id,name',
            ])
            ->whereHas('role', function ($query) {
                $query->where('name', Role::LOG_ADMIN);
            })
            ->whereHas('locations')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $admins,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $limit  = (int) $request->query('limit', 25);
        $limit  = max(1, min($limit, 100));
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->select(['id', 'name', 'email', 'employee_no', 'role_id'])
            ->with([
                'role:id,name',
                'locations:id,name',
            ])
            ->where(function ($query) {
                $query->whereNull('role_id')
                      ->orWhereHas('role', function ($roleQuery) {
                          $roleQuery->where('name', Role::LOG_ADMIN);
                      });
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($scoped) use ($search) {
                    $scoped->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%")
                           ->orWhere('employee_no', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $users,
        ]);
    }

    public function store(AssignLocationAdminRequest $request): JsonResponse
    {
        $user = User::with('role')->findOrFail($request->validated('user_id'));

        if ($user->role && $user->role->name !== Role::LOG_ADMIN) {
            return response()->json([
                'message' => 'Only users without a role or current log admins can be assigned to locations.',
            ], 422);
        }

        $locationIds = $request->validated('location_ids');
        $logAdminRoleId = Role::query()
            ->where('name', Role::LOG_ADMIN)
            ->value('id');

        if (! $logAdminRoleId) {
            abort(500, 'Log admin role is not configured.');
        }

        DB::transaction(function () use ($user, $locationIds, $logAdminRoleId) {
            UserLocation::whereIn('location_id', $locationIds)->delete();
            $user->locations()->sync($locationIds);

            if ($user->role?->name !== Role::LOG_ADMIN) {
                $user->forceFill(['role_id' => $logAdminRoleId])->save();
            }
        });

        $user->load('role:id,name', 'locations:id,name');

        return response()->json([
            'message' => 'Locations assigned successfully.',
            'data'    => $user,
        ]);
    }
}

