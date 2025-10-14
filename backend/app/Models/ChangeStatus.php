<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ChangeStatus extends Model
{
    use HasFactory;

    protected $table = 'change_status';
    protected $fillable = ['value'];
}
