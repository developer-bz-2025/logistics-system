<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Action extends Model
{
    use HasFactory;

    protected $fillable = ['action'];

    public function logs()
    {
        return $this->hasMany(ActivityLog::class, 'action_id');
    }
}
