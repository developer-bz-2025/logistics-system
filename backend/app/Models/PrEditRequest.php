<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PrEditRequest extends Model
{
    use HasFactory;

    protected $table = 'pr_edit_requests';
    protected $fillable = [
        'pr_id','requested_by_admin_id','status_id','request_date',
        'old_pr_code','new_pr_code','old_acquisition_date','new_acquisition_date',
        'old_pr_path','new_pr_path','old_total_price','new_total_price','reason',
    ];

    protected $casts = [
        'request_date' => 'datetime',
        'old_acquisition_date' => 'date',
        'new_acquisition_date' => 'date',
        'old_total_price' => 'float',
        'new_total_price' => 'float',
    ];

    public function pr()        { return $this->belongsTo(Pr::class, 'pr_id'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by_admin_id'); }
    public function approval() { return $this->belongsTo(User::class, 'approved_by_admin_id'); }
    public function statusRef() { return $this->belongsTo(ChangeStatus::class, 'status_id'); }
    public function items()     { return $this->hasMany(PrEditRequestItem::class, 'pr_edit_request_id'); }
}
