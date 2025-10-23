<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;


class PrResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $items = PrItemResource::collection($this->whenLoaded('items'));

        // compute totals (overall and per currency)
        $totalsByCurrency = [];
        if ($this->relationLoaded('items')) {
            foreach ($this->items as $it) {
                $c = $it->currency ?? 'USD';
                $totalsByCurrency[$c] = ($totalsByCurrency[$c] ?? 0)
                    + ((float)$it->qty * (float)$it->unit_cost);
            }
        }

        return [
            'id'          => $this->id,
            'pr_code'     => $this->pr_code,
            'pr_date'     => optional($this->pr_date)->toDateString(),
            'total_price' => (float)$this->total_price,
            'pr_path'     => $this->pr_path,
            'url'         => $this->pr_path ? Storage::disk('public')->url($this->pr_path) : null,

            'created_by'  => $this->created_by,
            'created_at'  => optional($this->created_at)->toDateTimeString(),
            'updated_at'  => optional($this->updated_at)->toDateTimeString(),

            'items'       => $items,

            'totals'      => [
                'by_currency' => $totalsByCurrency,
                // If you want to trust DB total_price, expose it as 'declared':
                'declared_total_price' => (float)$this->total_price,
                // Or recompute overall in a default currency if all lines share the same:
                'recomputed_if_single_currency' => count($totalsByCurrency) === 1
                    ? reset($totalsByCurrency)
                    : null,
            ],
        ];
    }
}
