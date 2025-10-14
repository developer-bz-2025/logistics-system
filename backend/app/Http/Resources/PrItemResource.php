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
    public function toArray(Request $request): array
    {
        return [
            'supplier_id'     => $this->supplier_id,
            'supplier_name'   => optional($this->supplier)->name,
            'fixed_item_id'   => $this->fixed_item_id,
            'fixed_item_name' => optional($this->fixedItem)->name,
            'qty'             => (int) $this->qty,
            'unit_cost'       => (float) $this->unit_cost,
            'currency'        => $this->currency,
        ];

    }
}
