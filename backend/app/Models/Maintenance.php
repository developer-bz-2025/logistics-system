<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Maintenance extends Model
{
    use HasFactory;

    protected $table = 'maintenance';
    protected $fillable = ['dateIn','dateOut','status_id','item_id','created_by'];
    protected $casts = ['dateIn' => 'datetime','dateOut' => 'datetime'];

    public function status() { return $this->belongsTo(MaintenanceStatus::class, 'status_id'); }
    public function item()   { return $this->belongsTo(Item::class); }
    
    public function createdBy()    { return $this->belongsTo(User::class, 'created_by'); }

    
}
 