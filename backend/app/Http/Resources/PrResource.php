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
    public function toArray(Request $request): array
    {
        $include = collect(explode(',', (string) $request->query('include')))->map(fn($s)=>trim($s))->filter()->all();
        $withItems = in_array('items', $include, true);

        $documentUrl = $this->pr_path ? Storage::url($this->pr_path) : null;

        // convenience primary supplier name = first item's supplier (if loaded)
        $primarySupplierName = null;
        if ($this->relationLoaded('items')) {
            $first = $this->items->first();
            $primarySupplierName = optional(optional($first)->supplier)->name;
        }

        return [
            'id'            => $this->id,
            'pr_code'       => $this->pr_code,
            'pr_date'       => $this->pr_date,
            'total_price'   => (float) $this->total_price,
            'pr_path'       => $this->pr_path,
            'document_url'  => $documentUrl,
            'supplier_name' => $primarySupplierName, // optional convenience

            // include items only if requested
            'items'         => $withItems && $this->relationLoaded('items')
                                ? PrItemResource::collection($this->items)
                                : null,
        ];
    
    }
}
