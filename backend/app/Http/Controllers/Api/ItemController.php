<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\ItemHistoryService;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ItemController extends Controller
{
    // GET /api/items
    public function index(Request $request)
    {
        $pageSize = min(max((int)$request->integer('pageSize', 10), 1), 100);
        $sort     = $request->get('sort', 'items.created_at');
        $dir      = strtolower($request->get('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        // Base query + joins
        $q = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
            ->join('categories', 'sub_category.cat_id', '=', 'categories.id')
            ->leftJoin('status', 'items.status_id', '=', 'status.id')
            ->leftJoin('locations', 'items.location_id', '=', 'locations.id')
            ->leftJoin('floors', 'items.floor_id', '=', 'floors.id')
            ->leftJoin('suppliers', 'items.supplier_id', '=', 'suppliers.id')
            ->leftJoin('brands', 'items.brand_id', '=', 'brands.id')
            ->leftJoin('colors', 'items.color_id', '=', 'colors.id')
            ->leftJoin('users as holders', 'items.holder_user_id', '=', 'holders.id')
            ->select([
                'items.id',
                'items.fixed_item_id',
                'items.description',
                'items.sn',
                'items.color_id',
                'items.brand_id',
                'items.pr_id',
                'items.acquisition_cost',
                'items.acquisition_date',
                'items.warranty_start_date',
                'items.warranty_end_date',
                'items.budget_code',
                'items.budget_donor',
                'items.supplier_id',
                'items.location_id',
                'items.floor_id',
                'items.status_id',
                DB::raw('COALESCE(items.Notes, items.notes) as notes'),
                'items.holder_user_id',
                'items.photo_path',
                'items.details_pdf_path',
                'items.created_by',
                'items.created_at',
                'items.updated_at',

                'fixed_items.name as fixed_item_name',
                'categories.id as category_id',
                'categories.name as category_name',
                'sub_category.id as sub_category_id',
                'sub_category.name as sub_category_name',

                'status.name as status_name',
                'locations.name as location_name',
                'floors.name as floor_name',
                'suppliers.name as supplier_name',
                'brands.name as brand_name',
                'colors.name as color_name',
                'holders.name as holder_name',
            ]);

        // Standard filters
        if ($v = $request->integer('category_id'))     $q->where('categories.id', $v);
        if ($v = $request->integer('sub_category_id')) $q->where('sub_category.id', $v);
        if ($v = $request->integer('fixed_item_id'))   $q->where('items.fixed_item_id', $v);
        if ($v = $request->integer('status_id'))       $q->where('items.status_id', $v);

        $locationIds = $request->input('location_ids');
        if (is_array($locationIds)) {
            $locationIds = array_values(array_filter(array_map('intval', $locationIds)));
            if (!empty($locationIds)) {
                $q->whereIn('items.location_id', $locationIds);
            }
        } elseif ($v = $request->integer('location_id')) {
            $q->where('items.location_id', $v);
        }

        if ($v = $request->integer('floor_id'))        $q->where('items.floor_id', $v);
        if ($v = $request->integer('supplier_id'))     $q->where('items.supplier_id', $v);
        if ($v = $request->integer('holder_user_id'))  $q->where('items.holder_user_id', $v);

        // Search (SN / description)
        if ($s = trim((string)$request->get('search'))) {
            $q->where(function ($qq) use ($s) {
                $qq->where('items.sn', 'like', "%{$s}%")
                   ->orWhere('items.description', 'like', "%{$s}%");
            });
        }

        /**
         * Dynamic attribute filters
         * Expecting query like:
         *   ?attr[Material]=Wood&attr[Size]=Large
         * or option id values:
         *   ?attr_id[Material]=123
         *
         * We resolve by attribute name -> attributes.id -> att_options.value/att_option_id
         * and ensure attribute belongs to the item's category via category_attributes.
         */
        $attr = $request->get('attr');      // map of attribute-name => option-text
        $attrId = $request->get('attr_id'); // map of attribute-name => att_option_id

        if (is_array($attr) && count($attr)) {
            foreach ($attr as $attName => $optionText) {
                if ($optionText === null || $optionText === '') continue;

                $aliasA   = 'a_'  . md5($attName);
                $aliasCA  = 'ca_' . md5($attName);
                $aliasIAV = 'iav_' . md5($attName);
                $aliasAO  = 'ao_' . md5($attName);

                // attribute by name
                $q->join("attributes as {$aliasA}", function ($j) use ($aliasA, $attName) {
                    $j->where("{$aliasA}.name", '=', $attName);
                });

                // ensure attribute is allowed for this category
                $q->join("category_attributes as {$aliasCA}", function ($j) use ($aliasCA, $aliasA) {
                    $j->on("{$aliasCA}.att_id", '=', "{$aliasA}.id")
                      ->on("{$aliasCA}.category_id", '=', "categories.id");
                });

                // item values for that attribute
                $q->join("item_attribute_values as {$aliasIAV}", function ($j) use ($aliasIAV, $aliasA) {
                    $j->on("{$aliasIAV}.item_id", '=', 'items.id')
                      ->on("{$aliasIAV}.att_id", '=', "{$aliasA}.id");
                });

                // chosen option by text
                $q->join("att_options as {$aliasAO}", function ($j) use ($aliasAO, $aliasA) {
                    $j->on("{$aliasAO}.att_id", '=', "{$aliasA}.id")
                      ->on("{$aliasAO}.id", '=', DB::raw("{$aliasAO}.id")); // no-op to allow where below
                });

                $q->where("{$aliasAO}.value", '=', $optionText)
                  ->where("{$aliasIAV}.att_option_id", '=', DB::raw("{$aliasAO}.id"));
            }
        }

        if (is_array($attrId) && count($attrId)) {
            foreach ($attrId as $attName => $attOptionId) {
                if (!$attOptionId) continue;

                $aliasA   = 'a2_'  . md5($attName);
                $aliasCA  = 'ca2_' . md5($attName);
                $aliasIAV = 'iav2_' . md5($attName);

                $q->join("attributes as {$aliasA}", function ($j) use ($aliasA, $attName) {
                    $j->where("{$aliasA}.name", '=', $attName);
                });

                $q->join("category_attributes as {$aliasCA}", function ($j) use ($aliasCA, $aliasA) {
                    $j->on("{$aliasCA}.att_id", '=', "{$aliasA}.id")
                      ->on("{$aliasCA}.category_id", '=', "categories.id");
                });

                $q->join("item_attribute_values as {$aliasIAV}", function ($j) use ($aliasIAV, $aliasA, $attOptionId) {
                    $j->on("{$aliasIAV}.item_id", '=', 'items.id')
                      ->on("{$aliasIAV}.att_id", '=', "{$aliasA}.id")
                      ->where("{$aliasIAV}.att_option_id", '=', (int)$attOptionId);
                });
            }
        }

        // Sort (whitelist) — use your real column names
        $sortable = [
            'items.created_at',
            'items.updated_at',
            'items.acquisition_date',  // note the schema spelling
            'items.acquisition_cost',
            'categories.name',
            'sub_category.name',
            'fixed_items.name',
            'status.name',
        ];
        if (!in_array($sort, $sortable, true)) $sort = 'items.created_at';
        $q->orderBy($sort, $dir);

        // Paginate
        $result = $q->paginate($pageSize)->appends($request->query());

        // Collect item ids on this page
        $itemIds = array_map(fn($r) => $r->id, $result->items());

        // Fetch attributes for these items (single roundtrip)
        $attrRows = DB::table('item_attribute_values as iav')
            ->join('attributes as a', 'iav.att_id', '=', 'a.id')
            ->leftJoin('att_options as ao', 'ao.id', '=', 'iav.att_option_id')
            ->whereIn('iav.item_id', $itemIds)
            ->select([
                'iav.item_id',
                'a.name as attribute',
                'ao.value as option_value',
                'iav.att_id',
                'iav.att_option_id',
            ])
            ->orderBy('a.name')
            ->get()
            ->groupBy('item_id');

        // Map response
        $data = collect($result->items())->map(function ($row) use ($attrRows) {
            $attrs = [];
            foreach ($attrRows->get($row->id, collect()) as $ar) {
                $attrs[$ar->attribute] = $ar->option_value;
            }

            return [
                'id'                   => (int) $row->id,
                'sn'                   => $row->sn,
                'fixed_item_id'        => $row->fixed_item_id !== null ? (int) $row->fixed_item_id : null,
                'fixed_item_name'      => $row->fixed_item_name,

                'description'          => $row->description,
                'category_id'          => $row->category_id !== null ? (int) $row->category_id : null,
                'category_name'        => $row->category_name,
                'sub_category_id'      => $row->sub_category_id !== null ? (int) $row->sub_category_id : null,
                'sub_category_name'    => $row->sub_category_name,

                'status_id'            => $row->status_id !== null ? (int) $row->status_id : null,
                'status_name'          => $row->status_name,
                'location_id'          => $row->location_id !== null ? (int) $row->location_id : null,
                'location_name'        => $row->location_name,
                'floor_id'             => $row->floor_id !== null ? (int) $row->floor_id : null,
                'floor_name'           => $row->floor_name,
                'supplier_id'          => $row->supplier_id !== null ? (int) $row->supplier_id : null,
                'supplier_name'        => $row->supplier_name,
                'brand_id'             => $row->brand_id !== null ? (int) $row->brand_id : null,
                'brand_name'           => $row->brand_name,
                'color_id'             => $row->color_id !== null ? (int) $row->color_id : null,
                'color_name'           => $row->color_name,
                'holder_user_id'       => $row->holder_user_id !== null ? (int) $row->holder_user_id : null,
                'holder_name'          => $row->holder_name,

                // keep as strings; DB::table returns scalar values (no Carbon here)
                'acquisition_date'      => $row->acquisition_date,
                'acquisition_cost'      => $row->acquisition_cost !== null ? (float)$row->acquisition_cost : null,
                'warranty_start_date'  => $row->warranty_start_date,
                'warranty_end_date'    => $row->warranty_end_date,

                'budget_code'          => $row->budget_code,
                'budget_donor'         => $row->budget_donor,
                'pr_id'                => $row->pr_id !== null ? (int) $row->pr_id : null,
                'notes'                => $row->notes,
                'photo_path'           => $row->photo_path,
                'details_pdf_path'     => $row->details_pdf_path,
                'photo_url'            => $this->fileUrl($row->photo_path),
                'details_pdf_url'      => $this->fileUrl($row->details_pdf_path),
                'created_at'           => $row->created_at,
                'updated_at'           => $row->updated_at,

                'attributes'           => (object)$attrs,
            ];
        });

        return response()->json([
            'data'     => $data,
            'total'    => $result->total(),
            'page'     => $result->currentPage(),
            'pageSize' => $result->perPage(),
        ]);
    }

    /**
     * GET /api/items/{id} - Get single asset details
     */
    public function show($id)
    {
        // Use the same query structure as index but for a single item
        $item = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
            ->join('categories', 'sub_category.cat_id', '=', 'categories.id')
            ->leftJoin('status', 'items.status_id', '=', 'status.id')
            ->leftJoin('locations', 'items.location_id', '=', 'locations.id')
            ->leftJoin('floors', 'items.floor_id', '=', 'floors.id')
            ->leftJoin('suppliers', 'items.supplier_id', '=', 'suppliers.id')
            ->leftJoin('brands', 'items.brand_id', '=', 'brands.id')
            ->leftJoin('colors', 'items.color_id', '=', 'colors.id')
            ->leftJoin('users as holders', 'items.holder_user_id', '=', 'holders.id')
            ->where('items.id', $id)
            ->select([
                'items.id',
                'items.fixed_item_id',
                'items.description',
                'items.sn',
                'items.color_id',
                'items.brand_id',
                'items.pr_id',
                'items.acquisition_cost',
                'items.acquisition_date',
                'items.warranty_start_date',
                'items.warranty_end_date',
                'items.budget_code',
                'items.budget_donor',
                'items.supplier_id',
                'items.location_id',
                'items.floor_id',
                'items.status_id',
                DB::raw('COALESCE(items.Notes, items.notes) as notes'),
                'items.holder_user_id',
                'items.photo_path',
                'items.details_pdf_path',
                'items.created_by',
                'items.created_at',
                'items.updated_at',

                'fixed_items.name as fixed_item_name',
                'categories.id as category_id',
                'categories.name as category_name',
                'sub_category.id as sub_category_id',
                'sub_category.name as sub_category_name',

                'status.name as status_name',
                'locations.name as location_name',
                'floors.name as floor_name',
                'suppliers.name as supplier_name',
                'brands.name as brand_name',
                'colors.name as color_name',
                'holders.name as holder_name',
            ])
            ->first();

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Fetch attributes for this item
        $attrRows = DB::table('item_attribute_values as iav')
            ->join('attributes as a', 'iav.att_id', '=', 'a.id')
            ->leftJoin('att_options as ao', 'ao.id', '=', 'iav.att_option_id')
            ->where('iav.item_id', $id)
            ->select([
                'a.name as attribute',
                'ao.value as option_value',
                'iav.att_id',
                'iav.att_option_id',
            ])
            ->orderBy('a.name')
            ->get();

        $attrs = [];
        foreach ($attrRows as $ar) {
            $attrs[$ar->attribute] = $ar->option_value;
        }

        $result = [
            'id'                   => (int) $item->id,
            'sn'                   => $item->sn,
            'fixed_item_id'        => $item->fixed_item_id !== null ? (int) $item->fixed_item_id : null,
            'fixed_item_name'      => $item->fixed_item_name,

            'description'          => $item->description,
            'category_id'          => $item->category_id !== null ? (int) $item->category_id : null,
            'category_name'        => $item->category_name,
            'sub_category_id'      => $item->sub_category_id !== null ? (int) $item->sub_category_id : null,
            'sub_category_name'    => $item->sub_category_name,

            'status_id'            => $item->status_id !== null ? (int) $item->status_id : null,
            'status_name'          => $item->status_name,
            'location_id'          => $item->location_id !== null ? (int) $item->location_id : null,
            'location_name'        => $item->location_name,
            'floor_id'             => $item->floor_id !== null ? (int) $item->floor_id : null,
            'floor_name'           => $item->floor_name,
            'supplier_id'          => $item->supplier_id !== null ? (int) $item->supplier_id : null,
            'supplier_name'        => $item->supplier_name,
            'brand_id'             => $item->brand_id !== null ? (int) $item->brand_id : null,
            'brand_name'           => $item->brand_name,
            'color_id'             => $item->color_id !== null ? (int) $item->color_id : null,
            'color_name'           => $item->color_name,
            'holder_user_id'       => $item->holder_user_id !== null ? (int) $item->holder_user_id : null,
            'holder_name'          => $item->holder_name,

            'acquisition_date'      => $item->acquisition_date,
            'acquisition_cost'      => $item->acquisition_cost !== null ? (float)$item->acquisition_cost : null,
            'warranty_start_date'  => $item->warranty_start_date,
            'warranty_end_date'    => $item->warranty_end_date,

            'budget_code'          => $item->budget_code,
            'budget_donor'         => $item->budget_donor,
            'pr_id'                => $item->pr_id !== null ? (int) $item->pr_id : null,
            'notes'                => $item->notes,
            'photo_path'           => $item->photo_path,
            'details_pdf_path'     => $item->details_pdf_path,
            'photo_url'            => $this->fileUrl($item->photo_path),
            'details_pdf_url'      => $this->fileUrl($item->details_pdf_path),
            'created_at'           => $item->created_at,
            'updated_at'           => $item->updated_at,

            'attributes'           => (object)$attrs,
        ];

        return response()->json($result);
    }

    /**
     * GET /api/log-admin/assets - Fetch assets for authenticated log admin
     */
    public function logAdminAssets(Request $request)
    {
        $user = $request->user();

        if (! $user || $user->role?->name !== Role::LOG_ADMIN) {
            return response()->json([
                'message' => 'This action is authorized for log admins only.',
            ], 403);
        }

        $locationIds = $user->locations()->pluck('locations.id')->all();

        if (empty($locationIds)) {
            $pageSize = min(max((int) $request->integer('pageSize', 10), 1), 100);
            $page = max((int) $request->integer('page', 1), 1);

            return response()->json([
                'data' => [],
                'total' => 0,
                'page' => $page,
                'pageSize' => $pageSize,
            ]);
        }

        $request->merge(['location_ids' => $locationIds]);

        return $this->index($request);
    }

    /**
     * POST /api/items - Create new asset
     */
    public function store(Request $request)
    {
        $this->normalizeArrayPayloads($request);

        // Validate the request
        $validated = $request->validate([
            'fixed_item_id' => 'required|integer|exists:fixed_items,id',
            'supplier_id' => 'nullable|integer|exists:suppliers,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'color_id' => 'nullable|integer|exists:colors,id',
            'pr_id' => 'nullable|max:255',
            'acquisition_cost' => 'nullable|numeric|min:0',
            'acquisition_date' => 'nullable|date',
            'warranty_start_date' => 'nullable|date',
            'warranty_end_date' => 'nullable|date',
            'location_id' => 'nullable|integer|exists:locations,id',
            'floor_id' => 'nullable|integer|exists:floors,id',
            'holder_user_id' => 'nullable|integer|exists:users,id',
            'status_id' => 'nullable|integer|exists:status,id',
            'description' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'sn' => 'nullable|string|max:255',
            'budget_code' => 'nullable|string|max:255',
            'budget_donor' => 'nullable|string|max:255',
            'attributes' => 'nullable|array',
            'attributes.*.att_id' => 'required_with:attributes|integer',
            'attributes.*.att_option_id' => 'required_with:attributes|integer',
            'photo' => 'nullable|image|max:10240',
        ]);

        // Extract attributes before inserting into items table
        $attributes = $validated['attributes'] ?? null;
        unset($validated['attributes']);

        // Format dates for MySQL compatibility
        $dateFields = ['acquisition_date', 'warranty_start_date', 'warranty_end_date'];
        foreach ($dateFields as $field) {
            if (!empty($validated[$field])) {
                // Parse the date and format it for MySQL
                $validated[$field] = \Carbon\Carbon::parse($validated[$field])->format('Y-m-d H:i:s');
            }
        }

        // Generate SN if not provided (AST-YYYY-NNNN format)
        // if (!isset($validated['sn']) || $validated['sn'] === null || $validated['sn'] === '') {
        //     $validated['sn'] = 'NA';
        // }

        // Handle photo upload when present
        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $this->compressAndStorePhoto($request->file('photo'));
        }

        if (array_key_exists('photo', $validated)) {
            unset($validated['photo']);
        }

        // Set created_by from authenticated user
        $validated['created_by'] = auth()->id();
        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        // Create the item
        $itemId = DB::table('items')->insertGetId($validated);

        // Handle attributes
        if (isset($attributes) && is_array($attributes)) {
            // Get category for this fixed item to validate attributes
            $categoryId = DB::table('fixed_items')
                ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
                ->where('fixed_items.id', $validated['fixed_item_id'])
                ->value('sub_category.cat_id');

            foreach ($attributes as $attribute) {
                $attId = $attribute['att_id'];
                $attOptionId = $attribute['att_option_id'];

                // Validate that attribute exists and is allowed for category
                $attrExists = DB::table('attributes')->where('id', $attId)->exists();
                if (!$attrExists) continue;

                $allowedForCategory = DB::table('category_attributes')
                    ->where('category_id', $categoryId)
                    ->where('att_id', $attId)
                    ->exists();

                if (!$allowedForCategory) continue;

                // Validate that option exists for this attribute
                $optionExists = DB::table('att_options')
                    ->where('id', $attOptionId)
                    ->where('att_id', $attId)
                    ->exists();

                if (!$optionExists) continue;

                // Check if option is allowed for subcategory
                $subCategoryId = DB::table('fixed_items')
                    ->where('id', $validated['fixed_item_id'])
                    ->value('sub_id');

                $allowedForSubcategory = DB::table('sub_category_att_options')
                    ->where('sub_category_id', $subCategoryId)
                    ->where('att_option_id', $attOptionId)
                    ->exists();

                if (!$allowedForSubcategory) continue;

                // Insert attribute value
                DB::table('item_attribute_values')->insert([
                    'item_id' => $itemId,
                    'att_id' => $attId,
                    'att_option_id' => $attOptionId,
                ]);
            }
        }

        // Log item creation
        ItemHistoryService::logItemCreated($itemId, $validated, auth()->id());

        // Return the created item
        return response()->json([
            'id' => $itemId,
            'sn' => $validated['sn'],
            'fixed_item_id' => $validated['fixed_item_id'],
            'created_at' => $validated['created_at'],
            'updated_at' => $validated['updated_at'],
            'photo_path' => $validated['photo_path'] ?? null,
            'photo_url' => $this->fileUrl($validated['photo_path'] ?? null),
        ], 201);
    }

    /**
     * PUT /api/items/{id} - Update asset information
     */
    public function update(Request $request, $id)
    {
        // Get the current item data for comparison
        $currentItem = DB::table('items')->where('id', $id)->first();
        if (!$currentItem) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Validate the request
        $validated = $request->validate([
            'description' => 'nullable|string|max:255',
            'sn' => 'nullable|string|max:255',
            'color_id' => 'nullable|integer|exists:colors,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'supplier_id' => 'nullable|integer|exists:suppliers,id',
            'status_id' => 'nullable|integer|exists:status,id',
            'location_id' => 'nullable|integer|exists:locations,id',
            'floor_id' => 'nullable|integer|exists:floors,id',
            'holder_user_id' => 'nullable|integer|exists:users,id',
            'pr_id' => 'nullable|max:255',
            'acquisition_date' => 'nullable|date',
            'acquisition_cost' => 'nullable|numeric|min:0',
            'warranty_start_date' => 'nullable|date',
            'warranty_end_date' => 'nullable|date',
            'budget_code' => 'nullable|string|max:255',
            'budget_donor' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'attributes' => 'nullable|array',
            'attributes.*.att_id' => 'required_with:attributes|integer|exists:attributes,id',
            'attributes.*.att_option_id' => 'required_with:attributes|integer|exists:att_options,id',
        ]);

        // Format dates for MySQL compatibility
        $dateFields = ['acquisition_date', 'warranty_start_date', 'warranty_end_date'];
        foreach ($dateFields as $field) {
            if (!empty($validated[$field])) {
                // Parse the date and format it for MySQL
                $validated[$field] = \Carbon\Carbon::parse($validated[$field])->format('Y-m-d H:i:s');
            }
        }

        // Extract attributes before updating items table
        $attributes = $validated['attributes'] ?? null;
        unset($validated['attributes']);

        // Track changes for history logging
        $changes = [];
        $oldValues = [];
        $newValues = [];

        // Compare each field and track changes
        $fieldsToCheck = [
            'description', 'sn', 'color_id', 'brand_id', 'supplier_id',
            'status_id', 'location_id', 'floor_id', 'holder_user_id',
            'acquisition_date', 'acquisition_cost', 'warranty_start_date', 'warranty_end_date',
            'budget_code', 'budget_donor', 'notes'
        ];

        foreach ($fieldsToCheck as $field) {
            if (!isset($validated[$field])) {
                continue;
            }

            $oldValue = $currentItem->$field;
            $newValue = $validated[$field];

            // For date fields, compare as dates, not strings
            if (in_array($field, $dateFields)) {
                $oldDate = $oldValue ? \Carbon\Carbon::parse($oldValue)->format('Y-m-d') : null;
                $newDate = $newValue ? \Carbon\Carbon::parse($newValue)->format('Y-m-d') : null;
                
                // Only mark as changed if dates are actually different
                if ($oldDate !== $newDate) {
                    $changes[] = $field;
                    $oldValues[$field] = $oldValue;
                    $newValues[$field] = $validated[$field];
                }
            } else {
                // For non-date fields, use regular comparison
                if ($oldValue != $newValue) {
                    $changes[] = $field;
                    $oldValues[$field] = $oldValue;
                    $newValues[$field] = $newValue;
                }
            }
        }

        // Update the item
        DB::table('items')
            ->where('id', $id)
            ->update(array_merge($validated, [
                'updated_at' => now(),
            ]));

        // Handle attributes update
        if (isset($attributes) && is_array($attributes)) {
            // Get current category to validate attributes
            $categoryId = DB::table('items')
                ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
                ->join('sub_category', 'fixed_items.sub_id', '=', 'sub_category.id')
                ->where('items.id', $id)
                ->value('sub_category.cat_id');

            foreach ($attributes as $attribute) {
                $attId = $attribute['att_id'];
                $attOptionId = $attribute['att_option_id'];

                // Validate that attribute exists
                $attr = DB::table('attributes')->where('id', $attId)->first();
                if (!$attr) continue;

                // Check if attribute is allowed for category
                $allowed = DB::table('category_attributes')
                    ->where('category_id', $categoryId)
                    ->where('att_id', $attId)
                    ->exists();

                if (!$allowed) continue;

                // Validate that option exists for this attribute
                $option = DB::table('att_options')
                    ->where('id', $attOptionId)
                    ->where('att_id', $attId)
                    ->first();

                if (!$option) continue;

                // Get current attribute value for change tracking
                $currentAttrValue = DB::table('item_attribute_values as iav')
                    ->join('att_options as ao', 'iav.att_option_id', '=', 'ao.id')
                    ->where('iav.item_id', $id)
                    ->where('iav.att_id', $attId)
                    ->value('ao.value');

                // Update or insert attribute value
                DB::table('item_attribute_values')->updateOrInsert(
                    ['item_id' => $id, 'att_id' => $attId],
                    ['att_option_id' => $attOptionId]
                );

                // Track attribute changes
                $newAttrValue = $option->value;
                if ($currentAttrValue != $newAttrValue) {
                    $attrName = $attr->name;
                    $changes[] = "attribute:{$attrName}";
                    $oldValues["attribute:{$attrName}"] = $currentAttrValue;
                    $newValues["attribute:{$attrName}"] = $newAttrValue;
                }
            }
        }

        // Log the update if there were changes
        if (!empty($changes)) {
            ItemHistoryService::logItemUpdated(
                $id,
                [
                    'changes' => $changes,
                    'old_values' => $oldValues,
                    'new_values' => $newValues
                ],
                auth()->id() // Pass authenticated user ID
            );
        }

        // Return the updated item
        return $this->show($id);
    }

    private function normalizeArrayPayloads(Request $request): void
    {
        if ($request->has('attributes') && is_string($request->input('attributes'))) {
            $decoded = json_decode((string) $request->input('attributes'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['attributes' => $decoded]);
            }
        }
    }

    private function fileUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        
        // Use API route to serve files through Laravel (avoids web server 403 issues)
        return url('api/storage/' . ltrim($path, '/'));
    }

    /**
     * POST /api/items/{id}/photo - Update item photo
     */
    public function updatePhoto(Request $request, $id)
    {
        // Validate item exists
        $item = DB::table('items')->where('id', $id)->first();
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Validate photo file
        $request->validate([
            'photo' => 'required|image|max:10240', // Max 10MB
        ]);

        if (!$request->hasFile('photo')) {
            return response()->json([
                'error' => 'Photo file is required',
                'errors' => ['photo' => ['The photo field is required.']]
            ], 422);
        }

        // Delete old photo if exists
        if ($item->photo_path && Storage::disk('public')->exists($item->photo_path)) {
            Storage::disk('public')->delete($item->photo_path);
        }

        // Compress and store new photo
        $newPhotoPath = $this->compressAndStorePhoto($request->file('photo'));

        // Update item photo_path
        DB::table('items')
            ->where('id', $id)
            ->update([
                'photo_path' => $newPhotoPath,
                'updated_at' => now(),
            ]);

        // Log the photo update in history
        ItemHistoryService::logEvent(
            $id,
            'photo_updated',
            'Item photo updated',
            [
                'old_photo_path' => $item->photo_path,
                'new_photo_path' => $newPhotoPath,
            ],
            auth()->id()
        );

        return response()->json([
            'message' => 'Photo updated successfully',
            'photo_path' => $newPhotoPath,
            'photo_url' => $this->fileUrl($newPhotoPath),
        ], 200);
    }

    /**
     * Compress and store photo to max 100KB
     */
    private function compressAndStorePhoto($file): string
    {
        $maxSizeKB = 100;
        $maxSizeBytes = $maxSizeKB * 1024;

        // Create image manager
        $manager = new ImageManager(new Driver());

        // Read image from file
        $image = $manager->read($file->getRealPath());

        // Get original dimensions
        $width = $image->width();
        $height = $image->height();

        // Start with reasonable dimensions and quality
        $targetWidth = min(1200, $width);
        $targetHeight = min(1200, $height);
        $quality = 75;

        // Resize if needed
        if ($width > $targetWidth || $height > $targetHeight) {
            $image->scale($targetWidth, $targetHeight);
        }

        // Try different quality levels until we get under 100KB
        $path = null;
        $tempPath = tempnam(sys_get_temp_dir(), 'item_photo_');

        for ($q = $quality; $q >= 30; $q -= 5) {
            // Re-read and resize if needed
            if ($q < $quality) {
                $image = $manager->read($file->getRealPath());
                if ($width > 800 || $height > 800) {
                    $image->scale(800, 800);
                }
            }

            // Save to temp file
            $image->toJpeg($q)->save($tempPath);
            $fileSize = filesize($tempPath);

            if ($fileSize <= $maxSizeBytes) {
                // File size is acceptable
                $fileName = 'item-' . uniqid() . '.jpg';
                $path = 'items/photos/' . $fileName;
                Storage::disk('public')->put($path, file_get_contents($tempPath));
                unlink($tempPath);
                return $path;
            }
        }

        // If still too large, force smaller dimensions
        $image = $manager->read($file->getRealPath());
        $image->scale(600, 600);
        $image->toJpeg(60)->save($tempPath);

        $fileName = 'item-' . uniqid() . '.jpg';
        $path = 'items/photos/' . $fileName;
        Storage::disk('public')->put($path, file_get_contents($tempPath));
        unlink($tempPath);

        return $path;
    }
}
