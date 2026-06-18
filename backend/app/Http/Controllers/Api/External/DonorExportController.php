<?php

namespace App\Http\Controllers\Api\External;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use Illuminate\Http\Request;

class DonorExportController extends Controller
{
    /**
     * GET /api/v1/external/donors
     *
     * Supports ?updated_since=YYYY-MM-DDTHH:MM:SS for incremental sync.
     */
    public function index(Request $request)
    {
        $query = Donor::with([
            'financeOfficer:id,name,email',
            'locations:id,name',
        ]);

        if ($request->has('updated_since')) {
            $request->validate(['updated_since' => 'date']);
            $query->where('updated_at', '>=', $request->input('updated_since'));
        }

        $donors = $query->orderBy('id', 'asc')->get();

        $data = $donors->map(function (Donor $donor) {
            return [
                'id'                   => $donor->id,
                'account_no'           => $donor->account_no,
                'department_name'      => $donor->department_name,
                'donor'                => $donor->donor,
                'end_date'             => $donor->end_date?->toDateString(),
                'notes'                => $donor->notes,
                'finance_officer_id'   => $donor->finance_officer_id,
                'finance_officer_name' => $donor->financeOfficer?->name,
                'finance_officer_email'=> $donor->financeOfficer?->email,
                'locations'            => $donor->locations->map(fn ($loc) => [
                    'id'   => $loc->id,
                    'name' => $loc->name,
                ]),
                'created_at'           => $donor->created_at?->toIso8601String(),
                'updated_at'           => $donor->updated_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data'  => $data,
            'count' => $data->count(),
        ]);
    }

    /**
     * GET /api/v1/external/donors/{id}
     */
    public function show(int $id)
    {
        $donor = Donor::with([
            'financeOfficer:id,name,email',
            'locations:id,name',
        ])->findOrFail($id);

        return response()->json([
            'data' => [
                'id'                   => $donor->id,
                'account_no'           => $donor->account_no,
                'department_name'      => $donor->department_name,
                'donor'                => $donor->donor,
                'end_date'             => $donor->end_date?->toDateString(),
                'notes'                => $donor->notes,
                'finance_officer_id'   => $donor->finance_officer_id,
                'finance_officer_name' => $donor->financeOfficer?->name,
                'finance_officer_email'=> $donor->financeOfficer?->email,
                'locations'            => $donor->locations->map(fn ($loc) => [
                    'id'   => $loc->id,
                    'name' => $loc->name,
                ]),
                'created_at'           => $donor->created_at?->toIso8601String(),
                'updated_at'           => $donor->updated_at?->toIso8601String(),
            ],
        ]);
    }
}
