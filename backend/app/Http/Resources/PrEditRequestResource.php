<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;


class PrEditRequestResource extends JsonResource
{
    public function toArray($request)
    {
        $include = collect(explode(',', (string) $request->query('include')))->map(fn($s) => trim($s));

        $header = [
            'pr_code' => ['old' => $this->old_pr_code, 'new' => $this->new_pr_code],
            'acquisition_date' => ['old' => $this->old_acquisition_date, 'new' => $this->new_acquisition_date],
            'total_price' => ['old' => $this->old_total_price, 'new' => $this->new_total_price],
            'location' => [
                'old' => $this->old_location_id,
                'old_name' => $this->old_location_id ? \App\Models\Location::find($this->old_location_id)?->name : null,
                'new' => $this->new_location_id,
                'new_name' => $this->new_location_id ? \App\Models\Location::find($this->new_location_id)?->name : null,
            ],
            'pr_path' => [
                'old' => $this->old_pr_path,
                'old_url' => $this->old_pr_path ? Storage::disk('public')->url($this->old_pr_path) : null,
                'new' => $this->new_pr_path,
                'new_url' => $this->new_pr_path ? Storage::disk('public')->url($this->new_pr_path) : null,
            ],
        ];

        // Items diffs + counters
        $items = $this->whenLoaded('items', fn() => PrEditRequestItemResource::collection($this->items));
        $counts = $this->relationLoaded('items')
            ? [
                'add' => $this->items->where('action', 'add')->count(),
                'delete' => $this->items->where('action', 'delete')->count(),
                'update_supplier' => $this->items->where('action', 'update_supplier')->count(),
                'update_cost' => $this->items->where('action', 'update_cost')->count(),
            ]
            : null;

        $pr = $this->whenLoaded('pr', function () {
            return [
                'id' => $this->pr->id,
                'pr_code' => $this->pr->pr_code,
                'pr_date' => optional($this->pr->pr_date)->toDateString(),
                'total_price' => (float) $this->pr->total_price,
                'pr_path' => $this->pr->pr_path,
                'url' => $this->pr->pr_path ? Storage::disk('public')->url($this->pr->pr_path) : null,
                'items' => $this->pr->items()
                    ->with('fixedItem')
                    ->get(['id', 'supplier_id', 'fixed_item_id', 'qty', 'unit_cost', 'currency'])
                    ->map(fn($r) => [
                        'id' => $r->id,
                        'supplier_id' => $r->supplier_id,
                        'fixed_item_id' => $r->fixed_item_id,
                        'item_name' => $r->fixedItem?->name,
                        'qty' => (float) $r->qty,
                        'unit_cost' => (float) $r->unit_cost,
                        'currency' => $r->currency,
                    ]),
            ];
        });

        $requester = $this->whenLoaded('requester', fn() => [
            'id' => $this->requester->id,
            'name' => $this->requester->name,
            'email' => $this->requester->email,
        ]);

        $base = [
            'id' => $this->id,
            'status' => $this->statusRef?->value,
            'request_date' => $this->request_date,
            'requested_by' => $requester,
            'approved_by_admin_id' => $this->approved_by_admin_id,
            'reason' => $this->reason,
            'header_diffs' => $header,
            'items_diffs' => $items,
            'items_counts' => $counts,
            'pr_snapshot' => $pr,
        ];

        // Optional: preview (after-approve dry-run), only if requested
        if ($include->contains('preview') && $this->relationLoaded('pr')) {
            $base['preview_after'] = $this->preview_after ?? null; // controller injects this
        }

        return $base;
    }
}
