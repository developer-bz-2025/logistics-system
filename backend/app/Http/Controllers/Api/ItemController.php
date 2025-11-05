<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        if ($v = $request->integer('location_id'))     $q->where('items.location_id', $v);
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
                'id'                   => $row->id,
                'sn'                   => $row->sn,
                'fixed_item_id'        => $row->fixed_item_id,
                'fixed_item_name'      => $row->fixed_item_name,

                'description'          => $row->description,
                'category_id'          => $row->category_id,
                'category_name'        => $row->category_name,
                'sub_category_id'      => $row->sub_category_id,
                'sub_category_name'    => $row->sub_category_name,

                'status_id'            => $row->status_id,
                'status_name'          => $row->status_name,
                'location_id'          => $row->location_id,
                'location_name'        => $row->location_name,
                'floor_id'             => $row->floor_id,
                'floor_name'           => $row->floor_name,
                'supplier_id'          => $row->supplier_id,
                'supplier_name'        => $row->supplier_name,
                'brand_id'             => $row->brand_id,
                'brand_name'           => $row->brand_name,
                'color_id'             => $row->color_id,
                'color_name'           => $row->color_name,
                'holder_user_id'       => $row->holder_user_id,
                'holder_name'          => $row->holder_name,

                // keep as strings; DB::table returns scalar values (no Carbon here)
                'acquisition_date'      => $row->acquisition_date,
                'acquisition_cost'      => $row->acquisition_cost !== null ? (float)$row->acquisition_cost : null,
                'warranty_start_date'  => $row->warranty_start_date,
                'warranty_end_date'    => $row->warranty_end_date,

                'budget_code'          => $row->budget_code,
                'budget_donor'         => $row->budget_donor,
                'pr_id'                => $row->pr_id,
                'notes'                => $row->notes,
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
}
