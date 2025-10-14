<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class NotificationRecipient extends Model
{
    use HasFactory;

    protected $table = 'notification_recipients';
    protected $fillable = ['notification_id','sender_admin_id','recipient_admin_id','is_read','read_at'];
    protected $casts = ['is_read' => 'boolean','read_at' => 'datetime'];

    public function notification() { return $this->belongsTo(Notification::class); }
    public function sender()       { return $this->belongsTo(User::class, 'sender_admin_id'); }
    public function recipient()    { return $this->belongsTo(User::class, 'recipient_admin_id'); }
}
