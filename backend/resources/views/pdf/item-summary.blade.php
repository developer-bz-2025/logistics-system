<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Asset Summary</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            color: #111827;
            margin: 0;
            padding: 24px;
            background: #f9fafb;
        }

        .card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 18px;
        }

        .card h2 {
            margin: 0 0 12px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #4b5563;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 18px;
        }

        .grid div span {
            font-weight: 600;
            color: #374151;
        }

        .attributes ul {
            margin: 4px 0 0 16px;
            padding: 0;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
        }

        .photo {
            text-align: center;
            margin-bottom: 18px;
        }

        .photo img {
            max-width: 100%;
            max-height: 280px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            object-fit: cover;
        }

        .muted {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="margin:0;font-size:20px;color:#111827;">{{ $item->fixedItem->name ?? 'Asset' }}</h1>
            <p style="margin:4px 0 0;" class="muted">Serial: {{ $item->sn ?? 'N/A' }}</p>
        </div>
        <div style="text-align:right;">
            <p style="margin:0;" class="muted">Created: {{ optional($item->created_at)->format('M j, Y') }}</p>
            <p style="margin:4px 0 0;" class="muted">Updated: {{ optional($item->updated_at)->format('M j, Y') }}</p>
        </div>
    </div>

    @if($photoDataUri)
        <div class="photo">
            <img src="{{ $photoDataUri }}" alt="Asset Photo">
        </div>
    @endif

    @php
        $subCategory = optional($item->fixedItem)->subCategory;
        $category = optional($subCategory)->category;
    @endphp

    <div class="card">
        <h2>Classification</h2>
        <div class="grid">
            <div><span>Category:</span> {{ $category->name ?? '—' }}</div>
            <div><span>Sub-Category:</span> {{ $subCategory->name ?? '—' }}</div>
            <div><span>Item Type:</span> {{ $item->fixedItem->name ?? '—' }}</div>
        </div>
        @if(!empty($attributes))
            <div class="attributes" style="margin-top:12px;">
                <span style="font-weight:600;color:#374151;">Attributes:</span>
                <ul>
                    @foreach($attributes as $attribute)
                        <li>{{ $attribute['name'] }}: {{ $attribute['value'] }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>

    <div class="card">
        <h2>General Information</h2>
        @php
            $formatDate = fn($value) => $value ? \Illuminate\Support\Carbon::parse($value)->format('M j, Y') : '—';
            $formatMoney = fn($value) => $value !== null ? '$' . number_format((float) $value, 2) : '—';
        @endphp
        <div class="grid">
            <div><span>Supplier:</span> {{ $item->supplier->name ?? '—' }}</div>
            <div><span>Brand:</span> {{ $item->brand->name ?? '—' }}</div>
            <div><span>Purchase Request:</span> {{ $item->pr_id ?? '—' }}</div>
            <div><span>Color:</span> {{ $item->color->name ?? '—' }}</div>
            <div><span>Acquisition Cost:</span> {{ $formatMoney($item->acquisition_cost) }}</div>
            <div><span>Acquisition Date:</span> {{ $formatDate($item->acquisition_date) }}</div>
            <div><span>Warranty Start:</span> {{ $formatDate($item->warranty_start_date) }}</div>
            <div><span>Warranty End:</span> {{ $formatDate($item->warranty_end_date) }}</div>
        </div>
    </div>

    <div class="card">
        <h2>Assignment & Status</h2>
        <div class="grid">
            <div><span>Location:</span> {{ $item->location->name ?? '—' }}</div>
            <div><span>Floor:</span> {{ $item->floor->name ?? '—' }}</div>
            <div><span>Status:</span> {{ $item->status->name ?? '—' }}</div>
            <div><span>Holder:</span> {{ $item->holder->name ?? '—' }}</div>
            <div><span>Serial:</span> {{ $item->sn ?? '—' }}</div>
        </div>
    </div>

    <div class="card">
        <h2>Additional Information</h2>
        <p><span style="font-weight:600;">Description:</span> {{ $item->description ?? '—' }}</p>
        <p><span style="font-weight:600;">Notes:</span> {{ $item->notes ?? '—' }}</p>
        <div class="grid">
            <div><span>Budget Code:</span> {{ $item->budget_code ?? '—' }}</div>
            <div><span>Budget Donor:</span> {{ $item->budget_donor ?? '—' }}</div>
        </div>
    </div>
</body>
</html>

