<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pr;
use App\Models\PrItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Schema;
use App\Http\Resources\PrResource;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;


class PrController extends Controller
{
     public function store(Request $request)
    {
        $data = $request->validate([
            'pr_code'                => ['required','string','max:190','unique:prs,pr_code'],
            'pr_date'                => ['required','date_format:Y-m-d'],
            'pr_file'                => ['required','file','mimes:pdf,jpg,jpeg,png','max:20480'],
            'items'                  => ['required','array','min:1'],
            'items.*.supplier_id'    => ['required','integer','exists:suppliers,id'],
            'items.*.fixed_item_id'  => ['required','integer','exists:fixed_items,id'],
            'items.*.qty'            => ['nullable','integer','min:1'],
            'items.*.unit_cost'      => ['required','numeric','min:0'],
            'items.*.currency'       => ['nullable','string','size:3'],
        ]);

        $userId = auth()->id() ?? optional($request->user())->id;

        $items = collect($data['items'])->map(function ($row) {
            $row['qty'] = (int)($row['qty'] ?? 1);
            $row['currency'] = strtoupper($row['currency'] ?? 'USD');
            return $row;
        });
        $total = $items->reduce(fn($carry, $r) => $carry + ($r['qty'] * $r['unit_cost']), 0);

        // ==============================
        // 📄 1) Rename and store document
        // ==============================
        $ext = $request->file('pr_file')->getClientOriginalExtension();
        $safeCode = Str::slug($data['pr_code']);  // e.g. PR-2025-001 → pr-2025-001
        $datePart = $data['pr_date'];
        $newFileName = "{$safeCode}_{$datePart}.{$ext}";
        // This stores in storage/app/prs/<filename>
        $path = $request->file('pr_file')->storeAs('prs', $newFileName,'public');
        $documentUrl = Storage::disk('public')->url($path);

        // ==============================
        // 💾 2) Save PR + items in transaction
        // ==============================
        $pr = DB::transaction(function () use ($data, $items, $total, $documentUrl, $userId) {
            $pr = Pr::create([
                'pr_code'     => $data['pr_code'],
                'pr_date'     => $data['pr_date'],
                'total_price' => $total,
                'pr_path'     => $documentUrl,
                'created_by'  => $userId,
            ]);

            $rows = $items->map(fn($r) => [
                'pr_id'         => $pr->id,
                'supplier_id'   => $r['supplier_id'],
                'fixed_item_id' => $r['fixed_item_id'],
                'qty'           => $r['qty'],
                'unit_cost'     => $r['unit_cost'],
                'currency'      => $r['currency'],
            ])->all();

            PrItem::insert($rows);

            return $pr->load('items');
        });

        return response()->json([
            'message' => 'PR created successfully',
            'data' => [
                'id'          => $pr->id,
                'pr_code'     => $pr->pr_code,
                'pr_date'     => $pr->pr_date,
                'total_price' => $pr->total_price,
                'pr_path'     => $pr->pr_path,
                'document_url'=> asset('storage/'.$pr->pr_path),
                'created_by'  => $userId,
            ],
        ], 201);
    }

    public function index(Request $request)
    {
        $page     = max(1, (int) $request->query('page', 1));
        $perPage  = (int) $request->query('per_page', 15);
        if ($perPage <= 0) $perPage = 15;
        if ($perPage > 100) $perPage = 100;

        $search       = trim((string) $request->query('search', ''));
        $dateFrom     = $request->query('date_from');
        $dateTo       = $request->query('date_to');
        $supplierId   = $request->query('supplier_id');
        $locationId   = $request->query('location_id'); // “if applicable”
        $includeParam = (string) $request->query('include', '');
        $includes     = collect(explode(',', $includeParam))->map(fn($s)=>trim($s))->filter()->all();

        // safe sort
        $allowedSort = [
            'pr_code'     => 'prs.pr_code',
            'pr_date'     => 'prs.pr_date',
            'total_price' => 'prs.total_price',
            'created_at'  => 'prs.created_at',
        ];
        $sort  = $request->query('sort', 'created_at');
        $order = strtolower((string) $request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $sortCol = $allowedSort[$sort] ?? 'prs.created_at';

        $q = Pr::query();

        // eager loads (only when needed)
        if (in_array('items', $includes, true)) {
            $q->with(['items.supplier', 'items.fixedItem']);
        } else {
            // still preload first supplier for convenience name without heavy load:
            $q->with(['items' => function ($qq) {
                $qq->with('supplier')->limit(1);
            }]);
        }

        // Search by pr_code or supplier name (through pr_items -> suppliers)
        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('prs.pr_code', 'like', "%{$search}%")
                   ->orWhereHas('items.supplier', function ($iqq) use ($search) {
                       $iqq->where('suppliers.name', 'like', "%{$search}%");
                   });
            });
        }

        // Date range on pr_date
        if ($dateFrom) { $q->whereDate('prs.pr_date', '>=', $dateFrom); }
        if ($dateTo)   { $q->whereDate('prs.pr_date', '<=', $dateTo);   }

        // Filter by supplier (exists on any item)
        if ($supplierId) {
            $q->whereHas('items', fn($iqq) => $iqq->where('supplier_id', $supplierId));
        }

        // Optional: filter by location if your `prs` table has a location_id column
        if ($locationId && Schema::hasColumn('prs', 'location_id')) {
            $q->where('prs.location_id', $locationId);
        }

        $q->orderBy($sortCol, $order)->orderBy('prs.id', 'desc');

        $paginator = $q->paginate($perPage, ['*'], 'page', $page);

        // Return standard Laravel paginator shape
        return PrResource::collection($paginator);
    }

}
