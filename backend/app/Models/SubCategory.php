<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SubCategory extends Model
{
    use HasFactory;

    protected $table = 'sub_category';
    protected $fillable = ['name', 'description', 'cat_id'];

    public function category()
    {
        return $this->belongsTo(Category::class, 'cat_id');
    }

    public function fixedItems()
    {
        return $this->hasMany(FixedItem::class, 'sub_id');
    }

    // Allowed options for this subcategory (grouped by attribute in queries)
    public function allowedOptions()
    {
        return $this->belongsToMany(AttOption::class, 'sub_category_att_options', 'sub_category_id', 'att_option_id')
            ->with('attribute') // AttOption->attribute()
            ->withTimestamps();
    }
    // Convenience: attributes are the category’s attributes
    public function attributes()
    {
        return $this->category->attributes();
    }
}
