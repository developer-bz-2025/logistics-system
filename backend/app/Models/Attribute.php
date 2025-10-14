<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attribute extends Model
{
    use HasFactory;

    protected $table = 'attributes';
    protected $fillable = ['name'];

    public function options()
    {
        return $this->hasMany(AttOption::class, 'att_id');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_attributes', 'att_id', 'category_id')
            ->withTimestamps();
    }
}
