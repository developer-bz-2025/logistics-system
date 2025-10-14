<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemHistory extends Model
{
    use HasFactory;

    protected $table = 'item_history';
    protected $fillable = ['item_id','event_type','by_user_id','accurred_at','payload'];
    protected $casts = [
        'accurred_at' => 'datetime',
        'payload' => 'array',
    ];

    public function item() { return $this->belongsTo(Item::class); }
    public function actor(){ return $this->belongsTo(User::class, 'by_user_id'); }
}
