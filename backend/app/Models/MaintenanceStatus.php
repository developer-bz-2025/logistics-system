<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MaintenanceStatus extends Model
{
    use HasFactory;

    protected $table = 'maintenance_status';
    protected $fillable = ['name'];

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class, 'status_id');
    }
}
