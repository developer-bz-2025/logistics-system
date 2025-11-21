<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttributeController extends Controller
{
    // GET /api/categories/{category}/attributes?sub_category_id={id}
    public function byCategory(Request $request, Category $category)
    {
        $subCategoryId = $request->query('sub_category_id');

        $attrs = $category->attributes()
            ->orderBy('name')
            ->get()
            ->map(function ($attribute) use ($subCategoryId) {
                $optionsQuery = DB::table('att_options')
                    ->where('att_id', $attribute->id)
                    ->orderBy('value');

                // If sub_category_id is provided, filter options by sub-category constraints
                if ($subCategoryId) {
                    $optionsQuery->join('sub_category_att_options', 'att_options.id', '=', 'sub_category_att_options.att_option_id')
                        ->where('sub_category_att_options.sub_category_id', $subCategoryId);
                }

                $options = $optionsQuery->select('att_options.id', 'att_options.value')->get();

                return [
                    'name'       => $attribute->name,
                    'att_id'       => $attribute->id,
                    'field_name' => strtolower(str_replace(' ', '_', $attribute->name)),
                    'type'       => 'select', // All attributes are select type based on the data structure
                    'options'    => $options->map(fn($o) => [
                        'id'    => $o->id,
                        'value' => $o->value,
                    ])->values(),
                ];
            });

        return response()->json(['data' => $attrs]);
    }
}
