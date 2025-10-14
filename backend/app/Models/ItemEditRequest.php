<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemEditRequest extends Model
{
    use HasFactory;

    protected $table = 'item_edit_requests';
    protected $fillable = [
        'item_id','requested_by_admin_id','status_id',
        'requested_changes','submitted_at','reviewed_by_admin_id',
        'reviewed_at','rejection_reason'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    public function item()      { return $this->belongsTo(Item::class); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by_admin_id'); }
    public function reviewer()  { return $this->belongsTo(User::class, 'reviewed_by_admin_id'); }
    public function statusRef() { return $this->belongsTo(ChangeStatus::class, 'status_id'); }
}
