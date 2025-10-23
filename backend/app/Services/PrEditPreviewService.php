<?php

namespace App\Services;

use App\Models\Pr;
use App\Models\PrItem;
use App\Models\PrEditRequest;
use App\Models\FixedItem;

class PrEditPreviewService
{
    /**
     * Returns ['header_after' => [...], 'items_after' => [...]] without persisting.
     */
    public function buildPreview(PrEditRequest $req): array
    {
        $pr = $req->pr;                     // current PR (must be loaded)
        $items = $pr->items()->with('fixedItem')->get()->map(fn($r) => $r->toArray())->keyBy('id');

        // Header after
        $headerAfter = [
            'pr_code' => $req->new_pr_code ?? $pr->pr_code,
            'pr_date' => $req->new_acquisition_date ?? $pr->pr_date,
            'total_price' => $req->new_total_price ?? $pr->total_price,
            'pr_path' => $req->new_pr_path ?? $pr->pr_path,
        ];

        // Apply item diffs
        foreach ($req->items as $diff) {
            switch ($diff->action) {
                case 'add':
                    // You may be carrying new item payload on the diff row (recommended).
                    // Expect: new_supplier_id, new_unit_cost, qty, currency, new_fixed_item_id
                    $fixedItem = FixedItem::find($diff->new_fixed_item_id);

                    $items->push([
                        'id' => null, // will be new on approve
                        'pr_id' => $pr->id,
                        'supplier_id' => $diff->new_supplier_id,
                        'fixed_item_id' => $diff->new_fixed_item_id,
                        'item_name' => $fixedItem?->name,
                        'qty' => (float) ($diff->qty ?? 1),
                        'unit_cost' => (float) ($diff->new_unit_cost ?? 0),
                        'currency' => $diff->currency ?? 'USD',
                        '__action' => 'add',
                    ]);
                    break;

                case 'delete':
                    if ($diff->pr_item_id && $items->has($diff->pr_item_id)) {
                        $row = $items->get($diff->pr_item_id);
                        $row['__action'] = 'delete';
                        $items->put($diff->pr_item_id, $row);
                    }
                    break;

                case 'update_supplier':
                case 'update_cost':
                    if ($diff->pr_item_id && $items->has($diff->pr_item_id)) {
                        $row = $items->get($diff->pr_item_id);
                        if ($diff->action === 'update_supplier')
                            $row['supplier_id'] = $diff->new_supplier_id;
                        if ($diff->action === 'update_cost')
                            $row['unit_cost'] = (float) $diff->new_unit_cost;

                        $fixedItem = FixedItem::find($row['fixed_item_id']);
                        $row['item_name'] = $fixedItem?->name;
                        $row['__touched'][] = $diff->action;
                        $items->put($diff->pr_item_id, $row);
                    }
                    break;

                // case 'update_supplier':
                //     if ($diff->pr_item_id && $items->has($diff->pr_item_id)) {
                //         $row = $items->get($diff->pr_item_id);
                //         $row['supplier_id'] = $diff->new_supplier_id;
                //         $row['__touched'][] = 'supplier';
                //         $items->put($diff->pr_item_id, $row);
                //     }
                //     break;

                // case 'update_cost':
                //     if ($diff->pr_item_id && $items->has($diff->pr_item_id)) {
                //         $row = $items->get($diff->pr_item_id);
                //         $row['unit_cost'] = (float) $diff->new_unit_cost;
                //         $row['__touched'][] = 'unit_cost';
                //         $items->put($diff->pr_item_id, $row);
                //     }
                //     break;
            }
        }

        // Remove deleted from final preview, keep them only as diffs
        $itemsAfter = $items->filter(fn($r) => ($r['__action'] ?? null) !== 'delete')
            ->values()
            ->map(function ($r) {
                // Add item name for any item missing it (e.g., unchanged lines)
                if (empty($r['item_name']) && isset($r['fixed_item_id'])) {
                    $r['item_name'] = FixedItem::find($r['fixed_item_id'])?->name;
                }
                return $r;
            })
            ->all();
        return [
            'header_after' => $headerAfter,
            'items_after' => $itemsAfter,
        ];
    }
}