<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_log';
    public $timestamps = false;
    protected $fillable = ['user_id','action_id','context','created_at'];

    protected $casts = [
        'created_at' => 'datetime',
        'context' => 'array',
    ];

    public function user()   { return $this->belongsTo(User::class); }
    public function action() { return $this->belongsTo(Action::class, 'action_id'); }
}
