<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AttOption extends Model
{
    use HasFactory;

    protected $table = 'att_options';
    protected $fillable = ['att_id', 'value'];

    public function attribute()
    {
        return $this->belongsTo(Attribute::class, 'att_id');
    }

    public function fixedItems()
    {
        return $this->belongsToMany(FixedItem::class, 'item_att_options', 'att_option_id', 'fixed_item_id')
            ->withTimestamps();
    }
    public function subCategories()
    {
        return $this->belongsToMany(SubCategory::class, 'sub_category_att_options', 'att_option_id', 'sub_category_id')
            ->withTimestamps();
    }
}
