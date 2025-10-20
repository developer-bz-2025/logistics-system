<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pr;
use App\Models\PrItem;
use App\Models\PrEditRequest;
use App\Models\PrEditRequestItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Api\Response;

class PrEditRequestController extends Controller
{
    // POST /api/prs/{pr}/pr-edit-requests
    public function store(Request $request, Pr $pr)
    {
        // Validate input (no pr_id needed now)
        $validated = $request->validate([
            'pr_code' => ['required', 'string', 'max:190'],        // uniqueness checked at approval time
            'pr_date' => ['required', 'date_format:Y-m-d'],
            // 'reason'    => ['required', 'string', 'min:10'],
            'pr_file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.pr_item_id' => ['nullable', 'integer', 'exists:pr_items,id'],
            'items.*.supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'items.*.fixed_item_id' => ['required', 'integer', 'exists:fixed_items,id'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0.01'],
            'items.*.currency' => ['nullable', 'string', 'size:3'],
        ], [
            'pr_file.mimes' => 'The pr file must be a file of type: pdf, doc, docx and be less than 10 MB.',
            'pr_file.max' => 'The pr file must be a file of type: pdf, doc, docx and be less than 10 MB.',
        ]);

        $userId = auth()->id() ?? optional($request->user())->id;

        $pendingStatusIds = DB::table('change_status')
        ->whereIn('value', ['Pending', 'Pending Approval'])
        ->pluck('id')
        ->all();

    // Guard: only one active (not-approved) request per PR
    $alreadyPending = DB::transaction(function () use ($pr, $pendingStatusIds) {
        return DB::table('pr_edit_requests')
            ->where('pr_id', $pr->id)
            ->whereIn('status_id', $pendingStatusIds)
            ->lockForUpdate()     // prevents races
            ->exists();
    });

    if ($alreadyPending) {
        return response()->json([
            'message' => 'There is already a pending edit request for this PR. Please wait for approval or rejection before submitting another request.',
            'errors'  => [
                'pr_id' => ['Active edit request exists for this PR.']
            ]
        ], 409); // 409
    }

        // Normalize incoming lines and compute new total
        $incoming = collect($validated['items'])->map(function ($r) {
            $r['qty'] = (int) ($r['qty'] ?? 1);
            $r['currency'] = strtoupper($r['currency'] ?? 'USD');
            $r['unit_cost'] = (float) $r['unit_cost'];
            return $r;
        });

        $newTotal = $incoming->reduce(fn($c, $r) => $c + ($r['qty'] * $r['unit_cost']), 0.0);

        // Existing lines keyed by id
        $existing = $pr->items()->get()->keyBy('id');

        // Split incoming into existing vs new
        $incomingExisting = $incoming->filter(fn($r) => !empty($r['pr_item_id']))->keyBy('pr_item_id');
        $incomingNew = $incoming->filter(fn($r) => empty($r['pr_item_id']));

        // Build change rows
        $reqItemRows = [];

        // Updates (for rows carrying pr_item_id)
        foreach ($incomingExisting as $id => $newRow) {
            /** @var PrItem|null $old */
            $old = $existing->get((int) $id);
            if (!$old) {
                // safety: treat as add
                $reqItemRows[] = [
                    'pr_item_id' => null,
                    'old_supplier_id' => null,
                    'new_supplier_id' => (int) $newRow['supplier_id'],
                    'old_unit_cost' => null,
                    'new_unit_cost' => (float) $newRow['unit_cost'],
                    'action' => 'add',
                ];
                continue;
            }

            // supplier changed?
            if ((int) $old->supplier_id !== (int) $newRow['supplier_id']) {
                $reqItemRows[] = [
                    'pr_item_id' => (int) $old->id,
                    'old_supplier_id' => (int) $old->supplier_id,
                    'new_supplier_id' => (int) $newRow['supplier_id'],
                    'old_unit_cost' => null,
                    'new_unit_cost' => null,
                    'action' => 'update_supplier',
                ];
            }

            // unit_cost changed?
            if (abs(((float) $old->unit_cost) - ((float) $newRow['unit_cost'])) >= 0.01) {
                $reqItemRows[] = [
                    'pr_item_id' => (int) $old->id,
                    'old_supplier_id' => null,
                    'new_supplier_id' => null,
                    'old_unit_cost' => (float) $old->unit_cost,
                    'new_unit_cost' => (float) $newRow['unit_cost'],
                    'action' => 'update_cost',
                ];
            }
        }

        // Deletes (existing ids missing from incoming)
        $incomingIds = $incomingExisting->keys()->map(fn($v) => (int) $v)->all();
        foreach ($existing as $old) {
            if (!in_array((int) $old->id, $incomingIds, true)) {
                $reqItemRows[] = [
                    'pr_item_id' => (int) $old->id,
                    'old_supplier_id' => (int) $old->supplier_id,
                    'new_supplier_id' => null,
                    'old_unit_cost' => (float) $old->unit_cost,
                    'new_unit_cost' => null,
                    'action' => 'delete',
                ];
            }
        }

        // Adds (incoming without id)
        foreach ($incomingNew as $newRow) {
            $reqItemRows[] = [
                'pr_item_id' => null,
                'old_supplier_id' => null,
                'new_supplier_id' => (int) $newRow['supplier_id'],
                'old_unit_cost' => null,
                'new_unit_cost' => (float) $newRow['unit_cost'],
                'action' => 'add',
            ];
        }

        // Optional: new proposed file
        $newPrPath = null;
        if ($request->hasFile('pr_file')) {
            $ext = $request->file('pr_file')->getClientOriginalExtension();
            $safe = preg_replace('/[^A-Za-z0-9\-\_\.]/', '-', $validated['pr_code']);
            $file = "{$safe}_{$validated['pr_date']}.{$ext}";
            $newPrPath = $request->file('pr_file')->storeAs('pr_edit_requests', $file, 'public');
        }

        // Pending status
        $statusId = DB::table('change_status')->whereIn('value', ['Pending', 'Pending Approval'])->value('id')
            ?? DB::table('change_status')->insertGetId(['value' => 'Pending']);

        // Persist request + items
        $editReq = DB::transaction(function () use ($pr, $validated, $userId, $newPrPath, $newTotal, $reqItemRows, $statusId) {
            /** @var PrEditRequest $req */

            $oldPath = $pr->pr_path;

            // If old PRs stored the full URL, convert to relative for DB storage
            $publicBase = rtrim(url('/storage'), '/') . '/';
            if (is_string($oldPath) && str_starts_with($oldPath, $publicBase)) {
                $oldPath = substr($oldPath, strlen($publicBase)); // 'prs/xxx.pdf'
            }


            $req = PrEditRequest::create([
                'pr_id' => $pr->id,
                'requested_by_admin_id' => $userId,
                'status_id' => $statusId,
                'request_date' => now(),

                'old_pr_code' => $pr->pr_code,
                'new_pr_code' => $validated['pr_code'],

                // mapping PR date to acquisition_date columns per your schema
                'old_acquisition_date' => $pr->pr_date,
                'new_acquisition_date' => $validated['pr_date'],

                'old_pr_path' => $oldPath,
                'new_pr_path' => $newPrPath,

                'old_total_price' => (float) $pr->total_price,
                'new_total_price' => (float) $newTotal,

                // If you added a `reason` column on pr_edit_requests, include it:
                // 'reason' => $validated['reason'],
            ]);

            foreach ($reqItemRows as $row) {
                PrEditRequestItem::create([
                    'pr_edit_request_id' => $req->id,
                    'pr_item_id' => $row['pr_item_id'],
                    'old_supplier_id' => $row['old_supplier_id'],
                    'new_supplier_id' => $row['new_supplier_id'],
                    'old_unit_cost' => $row['old_unit_cost'],
                    'new_unit_cost' => $row['new_unit_cost'],
                    'action' => $row['action'], // add|delete|update_supplier|update_cost
                ]);
            }

            return $req->load('items');
        });

        return response()->json([
            'id' => $editReq->id,
            'pr_id' => $editReq->pr_id,
            'status_id' => $editReq->status_id,
            'request_date' => $editReq->request_date?->toDateTimeString(),
            'header_changes' => [
                'old_pr_code' => $pr->pr_code,
                'new_pr_code' => $validated['pr_code'],
                'old_pr_date' => $pr->pr_date,
                'new_pr_date' => $validated['pr_date'],
                'old_total' => (float) $pr->total_price,
                'new_total' => (float) $newTotal,
                'old_pr_path' => $pr->pr_path,
                'new_pr_path' => $newPrPath,
            ],
            'items' => $editReq->items->map(fn(PrEditRequestItem $it) => [
                'pr_item_id' => $it->pr_item_id,
                'old_supplier_id' => $it->old_supplier_id,
                'new_supplier_id' => $it->new_supplier_id,
                'old_unit_cost' => $it->old_unit_cost,
                'new_unit_cost' => $it->new_unit_cost,
                'action' => $it->action,
            ])->values(),
        ], 201);
    }
}
