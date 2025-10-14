<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = ['name','phone','address','email','docs'];

    public function prItems()
    {
        return $this->hasMany(PrItem::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function categories(){ return $this->belongsToMany(Category::class, 'supplier_category'); }

    
}
