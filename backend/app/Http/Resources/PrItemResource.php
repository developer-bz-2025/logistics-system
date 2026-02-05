<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
   public function toArray($request)
    {
        return [
            'id'            => (int) $this->id,
            'supplier_id'   => $this->supplier_id !== null ? (int) $this->supplier_id : null,
            'supplier_name' => $this->whenLoaded('supplier', fn() => $this->supplier?->name),
            'fixed_item_id' => $this->fixed_item_id !== null ? (int) $this->fixed_item_id : null,
            "fixed_item"  =>$this->fixedItem?->name ?? null,
            // 'fixed_item'    => $this->whenLoaded('fixedItem', fn() => [
            //     'id'   => $this->fixedItem?->id,
            //     'name' => $this->fixedItem?->name ?? null,
            //     // add more fixedItem fields if you have them
            // ]),
            'qty'       => (int) $this->qty,
            'unit_cost' => (float)$this->unit_cost,
            'currency'  => $this->currency,
            'line_total'=> (float)$this->qty * (float)$this->unit_cost,
        ];
    }
}
