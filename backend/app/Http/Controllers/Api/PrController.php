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
use Illuminate\Validation\Rule;
use App\Services\ActivityLogService;
use App\Models\Role;


class PrController extends Controller
{
    public function store(Request $request)
    {
        $user = auth()->user();
        $rules = [
            'pr_code' => ['required', 'string', 'max:190', 'unique:prs,pr_code'],
            'pr_date' => ['required', 'date_format:Y-m-d'],
            'pr_file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:20480'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'items.*.fixed_item_id' => ['required', 'integer', 'exists:fixed_items,id'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.currency' => ['nullable', 'string', 'size:3'],
        ];

        // Add location_id validation for Logistics Admin with multiple locations
        if ($user->role?->name === Role::LOG_ADMIN) {
            $userLocations = $user->locations()->pluck('locations.id')->toArray();
            if (count($userLocations) > 1) {
                $rules['location_id'] = ['required', 'integer', 'in:' . implode(',', $userLocations)];
            }
        }

        $data = $request->validate($rules);
        $locationId = null;

        // Set location_id for PR based on user role
        if ($user->role?->name === Role::LOG_ADMIN) {
            // Logistics Admin can only create PRs for their assigned locations
            $userLocations = $user->locations()->pluck('locations.id')->toArray();
            if (count($userLocations) === 1) {
                $locationId = $userLocations[0];
            } elseif (count($userLocations) > 1) {
                // If multiple locations, require location_id in request
                $locationId = $request->input('location_id');
                if (!$locationId || !in_array($locationId, $userLocations)) {
                    return response()->json([
                        'message' => 'Invalid location_id for PR creation.',
                        'available_locations' => $userLocations
                    ], 422);
                }
            }
        }


        $userId = auth()->id() ?? optional($request->user())->id;

        $items = collect($data['items'])->map(function ($row) {
            $row['qty'] = (int) ($row['qty'] ?? 1);
            $row['currency'] = strtoupper($row['currency'] ?? 'USD');
            return $row;
        });
        $total = $items->reduce(fn($carry, $r) => $carry + ($r['qty'] * $r['unit_cost']), 0);

        // Calculate total items count (sum of all qty)
        $totalItemsCount = $items->sum('qty');

        // ==============================
        // 📄 1) Rename and store document
        // ==============================
        $ext = $request->file('pr_file')->getClientOriginalExtension();
        $safeCode = Str::slug($data['pr_code']);  // e.g. PR-2025-001 → pr-2025-001
        $datePart = $data['pr_date'];
        $newFileName = "{$safeCode}_{$datePart}.{$ext}";
        // This stores in storage/app/prs/<filename>
        $path = $request->file('pr_file')->storeAs('prs', $newFileName, 'public');
        // $documentUrl = Storage::disk('public')->url($path);

        // ==============================
        // 💾 2) Save PR + items in transaction
        // ==============================
        $pr = DB::transaction(function () use ($data, $items, $total, $totalItemsCount, $path, $userId, $locationId) {
            $pr = Pr::create([
                'pr_code' => $data['pr_code'],
                'pr_date' => $data['pr_date'],
                'total_price' => $total,
                'pr_path' => $path,
                'created_by' => $userId,
                'total_items_count' => $totalItemsCount,
                'remaining_items_count' => $totalItemsCount, // Initially same as total
                'location_id' => $locationId, // Add this field

            ]);

            $rows = $items->map(fn($r) => [
                'pr_id' => $pr->id,
                'supplier_id' => $r['supplier_id'],
                'fixed_item_id' => $r['fixed_item_id'],
                'qty' => $r['qty'],
                'unit_cost' => $r['unit_cost'],
                'currency' => $r['currency'],
            ])->all();

            PrItem::insert($rows);

            return $pr->load('items');
        });

        // Log activity
        ActivityLogService::logPrCreated($userId, $pr->id, $pr->pr_code, $locationId);

        return response()->json([
            'message' => 'PR created successfully',
            'data' => [
                'id' => $pr->id,
                'pr_code' => $pr->pr_code,
                'pr_date' => $pr->pr_date,
                'total_price' => $pr->total_price,
                'pr_path' => $pr->pr_path,
                'document_url' => $pr->pr_path ? url('api/storage/' . ltrim($pr->pr_path, '/')) : null,
                'created_by' => $userId,
                'total_items_count' => $pr->total_items_count,
                'remaining_items_count' => $pr->remaining_items_count,
            ],
        ], 201);
    }

    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage <= 0)
            $perPage = 15;
        if ($perPage > 100)
            $perPage = 100;

        $search = trim((string) $request->query('search', ''));
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $supplierId = $request->query('supplier_id');
        $locationId = $request->query('location_id'); // “if applicable”
        $includeParam = (string) $request->query('include', '');
        $includes = collect(explode(',', $includeParam))->map(fn($s) => trim($s))->filter()->all();

        // safe sort
        $allowedSort = [
            'pr_code' => 'prs.pr_code',
            'pr_date' => 'prs.pr_date',
            'total_price' => 'prs.total_price',
            'created_at' => 'prs.created_at',
        ];
        $sort = $request->query('sort', 'created_at');
        $order = strtolower((string) $request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $sortCol = $allowedSort[$sort] ?? 'prs.created_at';

        $q = Pr::query();

        // eager loads (only when needed)
        if (in_array('items', $includes, true)) {
            $q->with(['items.supplier', 'items.fixedItem', 'location']);
        } else {
            // still preload first supplier for convenience name without heavy load:
            $q->with([
                'items' => function ($qq) {
                    $qq->with('supplier')->limit(1);
                },
                'location'
            ]);
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
        if ($dateFrom) {
            $q->whereDate('prs.pr_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $q->whereDate('prs.pr_date', '<=', $dateTo);
        }

        // Filter by supplier (exists on any item)
        if ($supplierId) {
            $q->whereHas('items', fn($iqq) => $iqq->where('supplier_id', $supplierId));
        }

        // Optional: filter by location 
        if ($locationId && Schema::hasColumn('prs', 'location_id')) {
            $q->where('prs.location_id', $locationId);
        }

        $userLocationIds = $request->get('user_location_ids');
        if ($userLocationIds && Schema::hasColumn('prs', 'location_id')) {
            $q->whereIn('prs.location_id', $userLocationIds);
        }


        $q->orderBy($sortCol, $order)->orderBy('prs.id', 'desc');

        $paginator = $q->paginate($perPage, ['*'], 'page', $page);

        // Return standard Laravel paginator shape
        return PrResource::collection($paginator);
    }

    public function show(Request $request, $id)
    {
        $include = collect(explode(',', (string) $request->query('include')))
            ->map(fn($s) => trim($s))
            ->filter()
            ->all();

        $with = [];
        if (in_array('items', $include, true)) {
            // load supplier, fixedItem, and subcategory->category for denormalized fields
            $with = ['items.supplier', 'items.fixedItem.subCategory', 'location'];
        } else {
            // still fetch first item’s supplier to expose supplier_name (optional)
            $with = ['items' => fn($q) => $q->with('supplier')->limit(1), 'location'];
        }

        $pr = Pr::with($with)->find($id);
        if (!$pr) {
            return response()->json(['message' => 'PR not found.'], 404);
        }

        // Check location access for Logistics Admin
        $userLocationIds = $request->get('user_location_ids');
        if ($userLocationIds && $pr->location_id && !in_array($pr->location_id, $userLocationIds)) {
            return response()->json(['message' => 'Access denied to PR from different location.'], 403);
        }

        $documentUrl = $pr->pr_path ? url('api/storage/' . ltrim($pr->pr_path, '/')) : null;

        $payload = [
            'id' => (int) $pr->id,
            'location' => [
                'id' => $pr->location?->id,
                'name' => $pr->location?->name,
            ],
            'pr_code' => $pr->pr_code,
            'pr_date' => $pr->pr_date,        // already YYYY-MM-DD
            'total_price' => (float) $pr->total_price,
            'pr_path' => $documentUrl,        // return URL as pr_path per your example
            'total_items_count' => (int) ($pr->total_items_count ?? 0),
            'remaining_items_count' => (int) ($pr->remaining_items_count ?? 0),
        ];

        if (in_array('items', $include, true)) {
            $payload['items'] = $pr->items->map(function (PrItem $pi) {
                $sub = optional(optional($pi->fixedItem)->subCategory);
                return [
                    'pr_item_id' => (int) $pi->id,
                    'fixed_item_id' => $pi->fixed_item_id !== null ? (int) $pi->fixed_item_id : null,
                    'supplier_id' => $pi->supplier_id !== null ? (int) $pi->supplier_id : null,
                    'qty' => (int) $pi->qty,
                    'unit_cost' => (float) $pi->unit_cost,
                    'currency' => $pi->currency,
                    'fixed_item_name' => optional($pi->fixedItem)->name,
                    'supplier_name' => optional($pi->supplier)->name,
                    'category_id' => $sub ? (int) $sub->cat_id : null,
                    'sub_category_id' => $pi->fixedItem && $pi->fixedItem->sub_id !== null ? (int) $pi->fixedItem->sub_id : null,
                ];
            })->values();
        }

        return response()->json($payload);
    }

    /**
     * PUT /api/prs/{id}
     * Content-Type: multipart/form-data
     * Only replace document if pr_file is provided.
     * Recompute total from items (qty * unit_cost). qty is 1 fixed; currency = USD default.
     */
    public function update(Request $request, $id)
    {
        $pr = Pr::with('items')->find($id);
        if (!$pr) {
            return response()->json(['message' => 'PR not found.'], 404);
        }

        // Validate (multipart/form-data). items[] can come as nested fields.
        $validated = $request->validate([
            'pr_code' => ['required', 'string', 'max:190', Rule::unique('prs', 'pr_code')->ignore($pr->id)],
            'pr_date' => ['required', 'date_format:Y-m-d'],
            'reason' => ['required', 'string', 'min:10'],

            // optional file, replace only if present
            'pr_file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],

            // items (array)
            'items' => ['required', 'array', 'min:1'],
            'items.*.supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'items.*.fixed_item_id' => ['required', 'integer', 'exists:fixed_items,id'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0.01'],
            'items.*.currency' => ['nullable', 'string', 'size:3'],
        ], [
            // custom message example for file (matches your example phrasing)
            'pr_file.mimes' => 'The pr file must be a file of type: pdf, doc, docx and be less than 10 MB.',
            'pr_file.max' => 'The pr file must be a file of type: pdf, doc, docx and be less than 10 MB.',
        ]);

        // Normalize items & compute total
        $items = collect($validated['items'])->map(function ($row) {
            $row['qty'] = (int) ($row['qty'] ?? 1);            // fixed to 1 if omitted
            $row['currency'] = strtoupper($row['currency'] ?? 'USD');
            return $row;
        });

        $total = $items->reduce(fn($carry, $r) => $carry + ($r['qty'] * (float) $r['unit_cost']), 0.0);

        // Calculate new total items count
        $newTotalItemsCount = $items->sum('qty');

        // Get current linked assets count
        $currentLinkedAssetsCount = DB::table('items')->where('pr_id', $pr->id)->count();

        // Calculate new remaining count
        $newRemainingItemsCount = max(0, $newTotalItemsCount - $currentLinkedAssetsCount);

        // If a new file is uploaded, store it with PR-CODE_DATE.ext and replace
        $newPath = null;
        if ($request->hasFile('pr_file')) {
            $ext = $request->file('pr_file')->getClientOriginalExtension();
            $safeCode = preg_replace('/[^A-Za-z0-9\-\_\.]/', '-', $validated['pr_code']); // keep case
            $filename = "{$safeCode}_{$validated['pr_date']}.{$ext}";

            // public disk so it’s available at /storage/...
            $newPath = $request->file('pr_file')->storeAs('prs', $filename, 'public');

            // (optional) delete old file if path changed
            if ($pr->pr_path && $pr->pr_path !== $newPath) {
                Storage::disk('public')->delete($pr->pr_path);
            }
        }

        DB::transaction(function () use ($validated, $pr, $items, $total, $newTotalItemsCount, $newRemainingItemsCount, $newPath) {
            // Update PR
            $pr->pr_code = $validated['pr_code'];
            $pr->pr_date = $validated['pr_date'];
            $pr->total_price = $total;
            $pr->total_items_count = $newTotalItemsCount;
            $pr->remaining_items_count = $newRemainingItemsCount;
            if ($newPath) {
                $pr->pr_path = $newPath; // relative path in public disk, e.g., prs/PR-...pdf
            }
            $pr->save();

            // Replace items
            PrItem::where('pr_id', $pr->id)->delete();

            $rows = $items->map(fn($r) => [
                'pr_id' => $pr->id,
                'supplier_id' => $r['supplier_id'],
                'fixed_item_id' => $r['fixed_item_id'],
                'qty' => $r['qty'],
                'unit_cost' => $r['unit_cost'],
                'currency' => $r['currency'],
            ])->all();

            PrItem::insert($rows);

            // You can log the "reason" into a PR history table if needed
            // e.g., DB::table('pr_edit_requests')->insert([...]) — optional
        });

        // Reload with items for response (like GET include=items)
        $pr->load(['items.supplier', 'items.fixedItem.subCategory']);

        // Log activity
        ActivityLogService::logPrUpdated(auth()->id(), $pr->id, $pr->pr_code, [
            'items_count' => $newTotalItemsCount,
            'remaining_items_count' => $newRemainingItemsCount,
        ]);

        $documentUrl = $pr->pr_path ? url('api/storage/' . ltrim($pr->pr_path, '/')) : null;

        $resp = [
            'id' => $pr->id,
            'pr_code' => $pr->pr_code,
            'pr_date' => $pr->pr_date,
            'total_price' => (float) $pr->total_price,
            'pr_path' => $documentUrl, // full /storage/... path per your example
            'total_items_count' => $pr->total_items_count,
            'remaining_items_count' => $pr->remaining_items_count,
            'items' => $pr->items->map(function (PrItem $pi) {
                $sub = optional(optional($pi->fixedItem)->subCategory);
                return [
                    'fixed_item_id' => $pi->fixed_item_id,
                    'supplier_id' => $pi->supplier_id,
                    'qty' => (int) $pi->qty,
                    'unit_cost' => (float) $pi->unit_cost,
                    'currency' => $pi->currency,
                    'fixed_item_name' => optional($pi->fixedItem)->name,
                    'supplier_name' => optional($pi->supplier)->name,
                    'category_id' => $sub ? $sub->cat_id : null,
                    'sub_category_id' => optional($pi->fixedItem)->sub_id,
                ];
            })->values(),
        ];

        return response()->json($resp);
    }

}
