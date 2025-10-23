<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PrEditRequestItemResource extends JsonResource
{
    public function toArray($request)
    {
        $fixedItemId = $this->prItem?->fixed_item_id;
        $itemName = $this->prItem?->fixedItem?->name;
        return [
            'id' => $this->id,
            'pr_item_id' => $this->pr_item_id,
            'action' => $this->action, // add | delete | update_supplier | update_cost

            'fixed_item_id' => $fixedItemId,   // will be null for 'add'
            'item_name' => $itemName ?? $this->newFixedItem?->name ,      // will be null for 'add'


            'old_supplier_id' => $this->old_supplier_id,
            'old_supplier' => $this->oldSupplier?->name,
            // 'old_supplier' => $this->whenLoaded('oldSupplier', fn() => ['id' => $this->oldSupplier?->id, 'name' => $this->oldSupplier?->name]),
            'new_supplier_id' => $this->new_supplier_id,
            'new_supplier' => $this->whenLoaded('newSupplier', fn() => ['id' => $this->newSupplier?->id, 'name' => $this->newSupplier?->name]),

            'old_unit_cost' => $this->old_unit_cost,
            'new_unit_cost' => $this->new_unit_cost,

            // Optional payload for 'add'
            'qty' => $this->qty ?? null,
            'currency' => $this->currency ?? null,
            'new_fixed_item_id' => $this->new_fixed_item_id ?? null,
            // 'name' => $this->newFixedItem?->name ?? null,
            // 'new_fixed_item' => $this->when($this->new_fixed_item_id, fn() => [
            //     'id' => $this->new_fixed_item_id,
            //     'name' => $this->newFixedItem?->name ?? null,
            // ]),
        ];
    }
}