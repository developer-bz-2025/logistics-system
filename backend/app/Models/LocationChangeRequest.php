<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LocationChangeRequest extends Model
{
    use HasFactory;

    protected $table = 'location_change_requests';
    protected $fillable = [
        'item_id','current_location_id','requested_location_id',
        'requested_by_admin_id','approved_by_admin_id',
        'change_location_status_id','request_date','approval_date','notes'
    ];

    protected $casts = [
        'request_date' => 'datetime',
        'approval_date' => 'datetime',
    ];

    public function item()        { return $this->belongsTo(Item::class); }
    public function current()     { return $this->belongsTo(Location::class, 'current_location_id'); }
    public function requested()   { return $this->belongsTo(Location::class, 'requested_location_id'); }
    public function requester()   { return $this->belongsTo(User::class, 'requested_by_admin_id'); }
    public function approver()    { return $this->belongsTo(User::class, 'approved_by_admin_id'); }
    public function statusRef()   { return $this->belongsTo(ChangeStatus::class, 'change_location_status_id'); }
}
