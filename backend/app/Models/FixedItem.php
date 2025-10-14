<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FixedItem extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'sub_id'];

    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class, 'sub_id');
    }

    // All options available for this fixed item (through its subcategory)
    public function availableOptions()
    {
        return $this->subCategory->allowedOptions();
    }

    // All attributes available for this fixed item (through its category)
    public function availableAttributes()
    {
        return $this->subCategory->category->attributes();
    }

    public function items()
    {
        return $this->hasMany(Item::class, 'fixed_item_id');
    }


}
