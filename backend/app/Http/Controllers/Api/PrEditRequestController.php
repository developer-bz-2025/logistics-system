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
use App\Http\Requests\ListPrEditRequests;
use App\Http\Resources\PrEditRequestResource;

use App\Services\PrEditPreviewService;
use App\Http\Requests\ShowPrRequest;
use Illuminate\Validation\ValidationException;


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
                'errors' => [
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

        logger()->info('Incoming items', $incoming->all());

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
                    'new_fixed_item_id' => (int) $newRow['fixed_item_id'],
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
                    'old_supplier_id' => (int) $old->supplier_id,
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
                'new_fixed_item_id' => (int) $newRow['fixed_item_id'],
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
                    'new_fixed_item_id' => $row['new_fixed_item_id'] ?? null,
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
                'new_fixed_item_id' => $it->new_fixed_item_id ?? null,
                'old_unit_cost' => $it->old_unit_cost,
                'new_unit_cost' => $it->new_unit_cost,
                'action' => $it->action,
            ])->values(),
        ], 201);
    }

    public function index(ListPrEditRequests $req)
    {
        $include = collect(explode(',', (string) $req->query('include')))->map(fn($s) => trim($s))->filter();

        $with = ['statusRef', 'requester']; // default includes for list
        if ($include->contains('pr'))
            $with[] = 'pr';
        if ($include->contains('items'))
            $with[] = 'items'; // careful: can be heavy; use when needed

        $q = PrEditRequest::with($with);

        // Status filter: "Pending", "Approved", "Rejected" (allow comma-separated)
        if ($req->filled('status')) {
            $statuses = collect(explode(',', $req->string('status')))->map(fn($s) => trim($s))->filter()->all();
            $q->whereHas('statusRef', fn($x) => $x->whereIn('value', $statuses));
        }

        // Full-text-ish search
        if ($req->filled('q')) {
            $needle = $req->string('q');
            $q->where(function ($w) use ($needle) {
                $w->where('old_pr_code', 'like', "%{$needle}%")
                    ->orWhere('new_pr_code', 'like', "%{$needle}%")
                    ->orWhereHas('pr', fn($p) => $p->where('pr_code', 'like', "%{$needle}%"))
                    ->orWhereHas('requester', function ($u) use ($needle) {
                        $u->where('name', 'like', "%{$needle}%")
                            ->orWhere('email', 'like', "%{$needle}%");
                    });
            });
        }

        // Date range by request_date
        if ($req->filled('from'))
            $q->where('request_date', '>=', $req->date('from'));
        if ($req->filled('to'))
            $q->where('request_date', '<=', $req->date('to'));

        // Sorting
        // default: newest first by request_date
        $sort = $req->string('sort') ?: '-request_date';
        $dir = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $col = ltrim($sort, '-');
        // whitelist supported columns
        $sortable = ['request_date', 'id', 'pr_id', 'approved_by_admin_id'];
        if (!in_array($col, $sortable)) {
            $col = 'request_date';
            $dir = 'desc';
        }
        $q->orderBy($col, $dir);

        // Pagination
        $perPage = (int) ($req->integer('per_page') ?: 15);
        $page = $q->paginate($perPage)->appends($req->query());

        return PrEditRequestResource::collection($page)
            ->additional([
                'meta' => [
                    'total' => $page->total(),
                    'per_page' => $page->perPage(),
                    'current_page' => $page->currentPage(),
                    'last_page' => $page->lastPage(),
                ]
            ]);
    }

    public function show(ShowPrRequest $req, $id, PrEditPreviewService $preview)
    {
        $include = collect(explode(',', (string) $req->query('include')))
            ->map(fn($s) => trim($s))->filter();

        $with = ['statusRef', 'requester', 'pr.items', 'items.oldSupplier', 'items.newSupplier', 'items.prItem.fixedItem','items.newFixedItem'];
        // If you want lighter payload by default, reduce above and expand only when include=... is present.

        $model = PrEditRequest::with($with)->find($id);
        if (!$model) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Build preview only if requested
        if ($include->contains('preview')) {
            $model->preview_after = $preview->buildPreview($model);
        }

        return new PrEditRequestResource($model);
    }

      /** Resolve status IDs once */
    private function statusId(string $value): int
    {
        $id = DB::table('change_status')->where('value', $value)->value('id');
        if (!$id) {
            $id = DB::table('change_status')->insertGetId(['value' => $value]);
        }
        return (int) $id;
    }

    /** Only allow action on pending requests */
    // private function assertPending(PrEditRequest $req): void
    // {
    //     $pendingIds = DB::table('change_status')->whereIn('value', ['Pending', 'Pending Approval'])->pluck('id')->all();
    //     if (!in_array((int)$req->status_id, $pendingIds, true)) {
    //         throw ValidationException::withMessages(['status' => 'This request is not pending.']);
    //     }
    // }

    private function assertPending(PrEditRequest $req): void
{
    $pendingIds = DB::table('change_status')
        ->whereIn('value', ['Pending', 'Pending Approval'])
        ->pluck('id')
        ->map(fn($id) => (int) $id)
        ->all();
    
    if (!in_array((int)$req->status_id, $pendingIds)) {  // Remove strict comparison
        throw ValidationException::withMessages(['status' => 'This request is not pending.']);
    }
}

    /**
     * POST /pr-edit-requests/{id}/reject
     * Body: { reason?: string }
     */
    public function reject(Request $request, int $id)
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'min:3'],
        ]);

        /** @var PrEditRequest $req */
        $req = PrEditRequest::query()->with('items')->findOrFail($id);
        $this->assertPending($req);

        $rejectedId = $this->statusId('Rejected');

        DB::transaction(function () use ($req, $data, $rejectedId) {
            $req->status_id = $rejectedId;
            // Append/admin reason (keep user-provided reason if any)
            $req->reason = trim(($req->reason ? $req->reason . "\n" : '') . ($data['reason'] ?? ''));
            $req->save();
        });

        return response()->json([
            'message' => 'PR edit request rejected.',
            'id'      => $req->id,
            'status'  => 'rejected',
            'reason'  => $req->reason,
        ]);
    }

    /**
     * POST /pr-edit-requests/{id}/approve
     * Applies header + items changes to the PR, moves file if provided, and marks request approved.
     */
    public function approve(Request $request, int $id)
    {
        /** @var PrEditRequest $req */
        $req = PrEditRequest::query()->with('items')->findOrFail($id);
        $this->assertPending($req);

        /** @var Pr $pr */
        $pr = Pr::query()->with('items')->findOrFail($req->pr_id);

        // Uniqueness check example (optional): ensure new PR code is not used by another PR
        if ($req->new_pr_code && $req->new_pr_code !== $pr->pr_code) {
            $exists = Pr::query()->where('pr_code', $req->new_pr_code)->where('id', '!=', $pr->id)->exists();
            if ($exists) {
                throw ValidationException::withMessages(['pr_code' => 'PR code already in use.']);
            }
        }

        $approvedId = $this->statusId('Approved');

        DB::transaction(function () use ($req, $pr, $approvedId) {
            // 1) Apply header changes
            if ($req->new_pr_code) {
                $pr->pr_code = $req->new_pr_code;
            }
            if ($req->new_acquisition_date) {     // ← if your PR date column is pr_date, map accordingly
                $pr->pr_date = $req->new_acquisition_date;
            }

            // 1.a) Move/attach new PR file if present
            if ($req->new_pr_path) {
                // Source: where store() put the edit-request file (earlier you used 'public' disk)
                $srcDisk  = 'public';
                $dstDisk  = 'public';             // change to 'private' if your PR file storage is private
                $srcPath  = $req->new_pr_path;    // e.g. pr_edit_requests/PR-xxx_2025-10-02.pdf
                // Destination path (e.g. final PR files directory)
                $fileName = basename($srcPath);
                $dstPath  = 'prs/' . $fileName;

                if (Storage::disk($srcDisk)->exists($srcPath)) {
                    // If moving between same disk, you can use move(); otherwise stream copy
                    if ($srcDisk === $dstDisk) {
                        Storage::disk($srcDisk)->move($srcPath, $dstPath);
                    } else {
                        $stream = Storage::disk($srcDisk)->readStream($srcPath);
                        Storage::disk($dstDisk)->put($dstPath, $stream);
                        if (is_resource($stream)) fclose($stream);
                        Storage::disk($srcDisk)->delete($srcPath);
                    }
                    $pr->pr_path = $dstPath; // store path relative to disk
                }
            }

            // 2) Apply item-level changes
            // Build an index of existing PR items by id for quick lookups
            $existingById = $pr->items->keyBy('id'); // PrItem collection keyed by id

            /** @var PrEditRequestItem $row */
            foreach ($req->items as $row) {
                $action = $row->action;

                if ($action === 'add') {
                    // Create a new PR item with the new fields
                    PrItem::create([
                        'pr_id'         => $pr->id,
                        'fixed_item_id' => $row->new_fixed_item_id,     // required for add
                        'supplier_id'   => $row->new_supplier_id,
                        'qty'           => 1,
                        'unit_cost'     => $row->new_unit_cost,
                        'currency'      => 'USD',                       // adjust if you track per-row currency
                    ]);
                    continue;
                }

                // For actions on existing rows, fetch old item
                /** @var PrItem|null $old */
                $old = $existingById->get((int) $row->pr_item_id);

                if (!$old) {
                    // Defensive: if missing, treat as add if we have new data
                    if ($row->new_fixed_item_id || $row->new_supplier_id || $row->new_unit_cost) {
                        PrItem::create([
                            'pr_id'         => $pr->id,
                            'fixed_item_id' => $row->new_fixed_item_id ?: 0,
                            'supplier_id'   => $row->new_supplier_id,
                            'qty'           => 1,
                            'unit_cost'     => $row->new_unit_cost ?: 0,
                            'currency'      => 'USD',
                        ]);
                    }
                    continue;
                }

                if ($action === 'delete') {
                    $old->delete();
                    continue;
                }

                if ($action === 'update_item') {
                    if ($row->new_fixed_item_id) {
                        $old->fixed_item_id = $row->new_fixed_item_id;
                    }
                }

                if ($action === 'update_supplier') {
                    if ($row->new_supplier_id) {
                        $old->supplier_id = $row->new_supplier_id;
                    }
                }

                if ($action === 'update_cost') {
                    if ($row->new_unit_cost !== null) {
                        $old->unit_cost = (float) $row->new_unit_cost;
                    }
                }

                $old->save();
            }

            // 3) Recompute and persist PR total
            $freshItems = PrItem::query()->where('pr_id', $pr->id)->get();
            $pr->total_price = $freshItems->reduce(fn($c, $it) => $c + ((int)($it->qty ?? 1) * (float)$it->unit_cost), 0.0);
            $pr->save();

            // 4) Mark request as approved
            $req->status_id = $approvedId;
            $req->save();
        });

        return response()->json([
            'message' => 'PR edit request approved and applied successfully.',
            'id'      => $req->id,
            'status'  => 'approved',
        ]);
    }

}
