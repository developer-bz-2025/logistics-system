<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description'];

    public function subCategories()
    {
        return $this->hasMany(SubCategory::class, 'cat_id');
    }

    public function attributes() {
    return $this->belongsToMany(Attribute::class, 'category_attributes', 'category_id', 'att_id')
                ->withTimestamps();
}

    public function brands()
    {
        return $this->belongsToMany(Brand::class, 'brand_category');
    }
    public function suppliers()
    {
        return $this->belongsToMany(Supplier::class, 'supplier_category');
    }

}
