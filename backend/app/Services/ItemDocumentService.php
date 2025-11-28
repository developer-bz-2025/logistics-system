<?php

namespace App\Services;

use App\Models\Item;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ItemDocumentService
{
    public function generateSummaryPdf(Item $item): string
    {
        $item->loadMissing([
            'fixedItem.subCategory.category',
            'brand',
            'color',
            'supplier',
            'location',
            'floor',
            'status',
            'holder',
            'attributeValues.attribute',
            'attributeValues.option',
        ]);

        $attributes = $item->attributeValues
            ->map(function ($attributeValue) {
                $name = $attributeValue->attribute->name ?? null;
                $value = $attributeValue->option->value ?? null;

                if (! $name || ! $value) {
                    return null;
                }

                return [
                    'name'  => $name,
                    'value' => $value,
                ];
            })
            ->filter()
            ->values()
            ->all();

        $photoDataUri = null;

        if ($item->photo_path && Storage::disk('public')->exists($item->photo_path)) {
            $mime = Storage::disk('public')->mimeType($item->photo_path) ?: 'image/jpeg';
            $photoContents = Storage::disk('public')->get($item->photo_path);
            $photoDataUri = 'data:' . $mime . ';base64,' . base64_encode($photoContents);
        }

        $pdf = Pdf::loadView('pdf.item-summary', [
            'item'          => $item,
            'attributes'    => $attributes,
            'photoDataUri'  => $photoDataUri,
        ])->setPaper('a4');

        $filePath = 'items/pdfs/item-' . $item->id . '-' . now()->format('YmdHis') . '.pdf';

        Storage::disk('public')->put($filePath, $pdf->output());

        return $filePath;
    }
}

