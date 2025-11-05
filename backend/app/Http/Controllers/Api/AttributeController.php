<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class AttributeController extends Controller
{
    // GET /api/categories/{category}/attributes
    public function byCategory(Request $request, Category $category)
    {
        // Assuming tables: category_attributes(id,category_id,name,field_name,type)
        // and attribute_options(id,category_attribute_id,value,label)
        $attrs = $category->attributes()
            ->with(['options' => fn($q) => $q->orderBy('value')])
            ->orderBy('id')
            ->get()
            ->map(function ($a) {
                return [
                    'name'       => $a->name,
                    'field_name' => $a->field_name,
                    'type'       => $a->type, // 'select'|'text'|'number'
                    'options'    => $a->options->map(fn($o) => [
                        'id'    => $o->id,
                        // 'label' => $o->label,
                        'value' => $o->value,
                    ])->values(),
                ];
            });

        return response()->json(['data' => $attrs]);
    }
}
 