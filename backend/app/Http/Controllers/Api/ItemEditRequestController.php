<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemEditRequest;
use App\Models\Role;
use App\Services\ActivityLogService;
use App\Services\ItemHistoryService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemEditRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role?->name !== Role::SUPER_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for pro admins only.',
            ], 403);
        }

        $q = ItemEditRequest::with(['statusRef', 'requester', 'item', 'reviewer']);

        if ($request->filled('status') && $request->string('status') !== 'all') {
            $statuses = collect(explode(',', (string) $request->string('status')))
                ->map(fn ($s) => trim($s))
                ->filter()
                ->map(fn ($s) => match (strtolower($s)) {
                    'pending' => 'Pending',
                    'approved' => 'Approved',
                    'rejected' => 'Rejected',
                    default => $s,
                })
                ->all();

            $q->whereHas('statusRef', fn ($x) => $x->whereIn('value', $statuses));
        }

        if ($request->filled('q') || $request->filled('search')) {
            $needle = (string) ($request->input('q') ?? $request->input('search'));
            $q->where(function ($w) use ($needle) {
                $w->where('id', 'like', "%{$needle}%")
                    ->orWhereHas('item', function ($i) use ($needle) {
                        $i->where('description', 'like', "%{$needle}%")
                            ->orWhere('sn', 'like', "%{$needle}%");
                    })
                    ->orWhereHas('requester', function ($u) use ($needle) {
                        $u->where('name', 'like', "%{$needle}%")
                            ->orWhere('email', 'like', "%{$needle}%");
                    });
            });
        }

        $q->orderByDesc('submitted_at')->orderByDesc('id');

        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);
        $page = $q->paginate($perPage)->appends($request->query());

        $data = collect($page->items())->map(fn (ItemEditRequest $req) => $this->serializeListRow($req));

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $page->total(),
                'per_page' => $page->perPage(),
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
            ],
            'total' => $page->total(),
            'page' => $page->currentPage(),
            'pageSize' => $page->perPage(),
            'last_page' => $page->lastPage(),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role?->name !== Role::SUPER_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for pro admins only.',
            ], 403);
        }

        $req = ItemEditRequest::with(['statusRef', 'requester', 'item', 'reviewer'])->find($id);
        if (!$req) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['data' => $this->serializeDetail($req)]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role?->name !== Role::SUPER_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for pro admins only.',
            ], 403);
        }

        /** @var ItemEditRequest $req */
        $req = ItemEditRequest::query()->with(['item', 'statusRef'])->findOrFail($id);
        $this->assertPending($req);

        $changes = $req->requested_changes ?? [];
        $fields = $changes['fields'] ?? [];
        $attributes = $changes['attributes'] ?? [];

        $approvedId = $this->statusId('Approved');

        DB::transaction(function () use ($req, $fields, $attributes, $approvedId, $user) {
            $itemId = (int) $req->item_id;
            $item = DB::table('items')->where('id', $itemId)->lockForUpdate()->first();
            if (!$item) {
                throw ValidationException::withMessages(['item' => 'Item no longer exists.']);
            }

            $updatePayload = [];
            $historyChanges = [];
            $oldValues = [];
            $newValues = [];

            $dateFields = ['acquisition_date', 'warranty_start_date', 'warranty_end_date'];

            foreach ($fields as $field => $diff) {
                if (!is_array($diff) || !array_key_exists('new', $diff)) {
                    continue;
                }
                $newValue = $diff['new'];
                if (in_array($field, $dateFields, true) && $newValue) {
                    $newValue = \Carbon\Carbon::parse($newValue)->format('Y-m-d H:i:s');
                }
                if ($field === 'owned_by') {
                    $newValue = $this->normalizeOwnedBy($newValue);
                }
                $updatePayload[$field] = $newValue;
                $historyChanges[] = $field;
                $oldValues[$field] = $diff['old'] ?? $item->$field ?? null;
                $newValues[$field] = $diff['new'] ?? $newValue;
            }

            $oldPrId = $item->pr_id !== null ? (int) $item->pr_id : null;
            $newPrId = array_key_exists('pr_id', $updatePayload)
                ? ($updatePayload['pr_id'] !== null ? (int) $updatePayload['pr_id'] : null)
                : $oldPrId;
            $prIdChanged = array_key_exists('pr_id', $updatePayload) && $oldPrId !== $newPrId;

            if (!empty($updatePayload)) {
                $updatePayload['updated_at'] = now();
                DB::table('items')->where('id', $itemId)->update($updatePayload);
            }

            if ($prIdChanged) {
                if ($oldPrId !== null) {
                    DB::table('prs')->where('id', $oldPrId)->increment('remaining_items_count');
                    $oldPrCode = DB::table('prs')->where('id', $oldPrId)->value('pr_code') ?? 'Unknown';
                    ActivityLogService::logAssetUnlinkedFromPr($user->id, $itemId, $oldPrId, $oldPrCode);
                }
                if ($newPrId !== null) {
                    DB::table('prs')
                        ->where('id', $newPrId)
                        ->where('remaining_items_count', '>', 0)
                        ->decrement('remaining_items_count');
                    $newPrCode = DB::table('prs')->where('id', $newPrId)->value('pr_code') ?? 'Unknown';
                    ActivityLogService::logAssetLinkedToPr($user->id, $itemId, $newPrId, $newPrCode);
                }
            }

            if (is_array($attributes) && !empty($attributes)) {
                $categoryId = DB::table('items')
                    ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
                    ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
                    ->where('items.id', $itemId)
                    ->value('sub_category.cat_id');

                foreach ($attributes as $attribute) {
                    $attId = (int) ($attribute['att_id'] ?? 0);
                    $attOptionId = (int) ($attribute['att_option_id'] ?? 0);
                    if (!$attId || !$attOptionId) {
                        continue;
                    }

                    $attr = DB::table('attributes')->where('id', $attId)->first();
                    if (!$attr) {
                        continue;
                    }

                    $allowed = DB::table('category_attributes')
                        ->where('category_id', $categoryId)
                        ->where('att_id', $attId)
                        ->exists();
                    if (!$allowed) {
                        continue;
                    }

                    $option = DB::table('att_options')
                        ->where('id', $attOptionId)
                        ->where('att_id', $attId)
                        ->first();
                    if (!$option) {
                        continue;
                    }

                    DB::table('item_attribute_values')->updateOrInsert(
                        ['item_id' => $itemId, 'att_id' => $attId],
                        ['att_option_id' => $attOptionId]
                    );

                    $attrName = $attribute['name'] ?? $attr->name;
                    $historyChanges[] = "attribute:{$attrName}";
                    $oldValues["attribute:{$attrName}"] = $attribute['old_value'] ?? null;
                    $newValues["attribute:{$attrName}"] = $attribute['new_value'] ?? $option->value;
                }
            }

            $req->status_id = $approvedId;
            $req->reviewed_by_admin_id = $user->id;
            $req->reviewed_at = now();
            $req->save();

            if (!empty($historyChanges)) {
                ItemHistoryService::logItemUpdated(
                    $itemId,
                    [
                        'changes' => $historyChanges,
                        'old_values' => $oldValues,
                        'new_values' => $newValues,
                        'via_edit_request_id' => $req->id,
                    ],
                    $user->id
                );

                ActivityLogService::logAssetUpdated($user->id, $itemId, [
                    'changes' => $historyChanges,
                    'changed_fields' => count($historyChanges),
                    'via_edit_request_id' => $req->id,
                ]);

                if (in_array('status_id', $historyChanges, true)) {
                    $oldStatus = DB::table('status')->where('id', $oldValues['status_id'] ?? null)->value('name') ?? 'Unknown';
                    $newStatus = DB::table('status')->where('id', $newValues['status_id'] ?? null)->value('name') ?? 'Unknown';
                    ActivityLogService::logAssetStatusChanged($user->id, $itemId, $oldStatus, $newStatus);
                }

                if (in_array('holder_user_id', $historyChanges, true)) {
                    ActivityLogService::logAssetHolderAssigned(
                        $user->id,
                        $itemId,
                        $oldValues['holder_user_id'] ?? null,
                        $newValues['holder_user_id'] ?? null
                    );
                }
            }

            ItemHistoryService::logEditRequestApproved($itemId, $req->id);
        });

        $itemDescription = $req->item?->description
            ?? DB::table('items')->where('id', $req->item_id)->value('description')
            ?? ('Item #' . $req->item_id);

        NotificationService::notifyItemEditRequestApproved(
            $req->id,
            (int) $req->item_id,
            (string) $itemDescription,
            $user->id,
            $user->name ?? 'Unknown',
            (int) $req->requested_by_admin_id
        );

        $req->refresh()->load(['statusRef', 'requester', 'item', 'reviewer']);

        return response()->json([
            'message' => 'Item edit request approved and applied.',
            'id' => $req->id,
            'status' => 'Approved',
            'data' => $this->serializeDetail($req),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role?->name !== Role::SUPER_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for pro admins only.',
            ], 403);
        }

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'min:3'],
        ]);

        /** @var ItemEditRequest $req */
        $req = ItemEditRequest::query()->with(['item', 'statusRef'])->findOrFail($id);
        $this->assertPending($req);

        $rejectedId = $this->statusId('Rejected');

        DB::transaction(function () use ($req, $data, $rejectedId, $user) {
            $req->status_id = $rejectedId;
            $req->rejection_reason = $data['reason'] ?? null;
            $req->reviewed_by_admin_id = $user->id;
            $req->reviewed_at = now();
            $req->save();

            ItemHistoryService::logEditRequestRejected(
                (int) $req->item_id,
                $req->id,
                $data['reason'] ?? null
            );
        });

        $itemDescription = $req->item?->description
            ?? DB::table('items')->where('id', $req->item_id)->value('description')
            ?? ('Item #' . $req->item_id);

        NotificationService::notifyItemEditRequestRejected(
            $req->id,
            (int) $req->item_id,
            (string) $itemDescription,
            $user->id,
            $user->name ?? 'Unknown',
            (int) $req->requested_by_admin_id,
            $data['reason'] ?? null
        );

        $req->refresh()->load(['statusRef', 'requester', 'item', 'reviewer']);

        return response()->json([
            'message' => 'Item edit request rejected.',
            'id' => $req->id,
            'status' => 'Rejected',
            'reason' => $req->rejection_reason,
            'data' => $this->serializeDetail($req),
        ]);
    }

    private function assertPending(ItemEditRequest $req): void
    {
        $pendingIds = DB::table('change_status')
            ->whereIn('value', ['Pending', 'Pending Approval'])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (!in_array((int) $req->status_id, $pendingIds, true)) {
            throw ValidationException::withMessages(['status' => 'This request is not pending.']);
        }
    }

    private function statusId(string $value): int
    {
        $id = DB::table('change_status')->where('value', $value)->value('id');
        if (!$id) {
            $id = DB::table('change_status')->insertGetId(['value' => $value]);
        }

        return (int) $id;
    }

    private function normalizeOwnedBy(?string $value): string
    {
        $normalized = strtoupper(trim((string) $value));
        return match ($normalized) {
            'B&Z', 'BZ' => 'BZ',
            'LANDLORD' => 'LANDLORD',
            default => $normalized ?: 'BZ',
        };
    }

    private function serializeListRow(ItemEditRequest $req): array
    {
        $fields = $req->requested_changes['fields'] ?? [];
        $attrs = $req->requested_changes['attributes'] ?? [];

        return [
            'id' => $req->id,
            'item_id' => $req->item_id,
            'item_description' => $req->item?->description,
            'item_sn' => $req->item?->sn,
            'status' => $req->statusRef?->value,
            'submitted_at' => optional($req->submitted_at)->toDateTimeString(),
            'requested_by' => $req->requester ? [
                'id' => $req->requester->id,
                'name' => $req->requester->name,
                'email' => $req->requester->email,
            ] : null,
            'changed_fields_count' => count($fields) + count($attrs),
            'reviewed_at' => optional($req->reviewed_at)->toDateTimeString(),
        ];
    }

    private function serializeDetail(ItemEditRequest $req): array
    {
        $changes = $req->requested_changes ?? [];
        $fields = $changes['fields'] ?? [];
        $attributes = $changes['attributes'] ?? [];

        return [
            'id' => $req->id,
            'item_id' => $req->item_id,
            'item' => $req->item ? [
                'id' => $req->item->id,
                'description' => $req->item->description,
                'sn' => $req->item->sn,
            ] : null,
            'status' => $req->statusRef?->value,
            'submitted_at' => optional($req->submitted_at)->toDateTimeString(),
            'reviewed_at' => optional($req->reviewed_at)->toDateTimeString(),
            'rejection_reason' => $req->rejection_reason,
            'requested_by' => $req->requester ? [
                'id' => $req->requester->id,
                'name' => $req->requester->name,
                'email' => $req->requester->email,
            ] : null,
            'reviewed_by' => $req->reviewer ? [
                'id' => $req->reviewer->id,
                'name' => $req->reviewer->name,
                'email' => $req->reviewer->email,
            ] : null,
            'field_diffs' => $this->enrichFieldDiffs($fields),
            'attribute_diffs' => array_values($attributes),
        ];
    }

    private function enrichFieldDiffs(array $fields): array
    {
        $enriched = [];

        foreach ($fields as $field => $diff) {
            if (!is_array($diff)) {
                continue;
            }

            $row = [
                'field' => $field,
                'label' => $this->fieldLabel($field),
                'old' => $diff['old'] ?? null,
                'new' => $diff['new'] ?? null,
                'old_label' => $diff['old_label'] ?? null,
                'new_label' => $diff['new_label'] ?? null,
            ];

            if ($row['old_label'] === null || $row['new_label'] === null) {
                [$oldLabel, $newLabel] = $this->resolveFkLabels($field, $row['old'], $row['new']);
                $row['old_label'] = $row['old_label'] ?? $oldLabel;
                $row['new_label'] = $row['new_label'] ?? $newLabel;
            }

            $enriched[] = $row;
        }

        return $enriched;
    }

    private function fieldLabel(string $field): string
    {
        return match ($field) {
            'sn' => 'Serial Number',
            'description' => 'Description',
            'color_id' => 'Color',
            'brand_id' => 'Brand',
            'supplier_id' => 'Supplier',
            'status_id' => 'Status',
            'floor_id' => 'Floor',
            'holder_user_id' => 'Holder',
            'pr_id' => 'Purchase Request',
            'acquisition_date' => 'Acquisition Date',
            'acquisition_cost' => 'Acquisition Cost',
            'warranty_start_date' => 'Warranty Start',
            'warranty_end_date' => 'Warranty End',
            'budget_code' => 'Budget Code',
            'budget_donor' => 'Budget Donor',
            'donor_id' => 'Donor',
            'notes' => 'Notes',
            'owned_by' => 'Owned By',
            default => ucwords(str_replace('_', ' ', $field)),
        };
    }

    private function resolveFkLabels(string $field, $old, $new): array
    {
        $map = [
            'color_id' => ['colors', 'name'],
            'brand_id' => ['brands', 'name'],
            'supplier_id' => ['suppliers', 'name'],
            'status_id' => ['status', 'name'],
            'floor_id' => ['floors', 'name'],
            'holder_user_id' => ['users', 'name'],
            'donor_id' => ['donors', 'donor'],
            'pr_id' => ['prs', 'pr_code'],
        ];

        if (!isset($map[$field])) {
            return [
                $old !== null && $old !== '' ? (string) $old : null,
                $new !== null && $new !== '' ? (string) $new : null,
            ];
        }

        [$table, $col] = $map[$field];

        return [
            $old !== null ? (DB::table($table)->where('id', $old)->value($col) ?? (string) $old) : null,
            $new !== null ? (DB::table($table)->where('id', $new)->value($col) ?? (string) $new) : null,
        ];
    }
}
