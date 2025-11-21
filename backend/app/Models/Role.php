<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Role extends Model
{
    use HasFactory;

    public const PR_ADMIN     = 'pr_admin';
    public const LOG_ADMIN    = 'log_admin';
    public const SUPER_ADMIN  = 'super_admin';

    protected $fillable = ['name'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
