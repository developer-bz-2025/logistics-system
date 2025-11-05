<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CategoryAttribute extends Model
{
    use HasFactory;

    protected $fillable = ['category_id', 'att_id'];

    public function options() { return $this->hasMany(\App\Models\AttOption::class, 'att_id'); }


}