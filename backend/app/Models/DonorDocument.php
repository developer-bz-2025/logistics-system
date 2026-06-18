<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DonorDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'original_name',
        'file_path',
        'mime_type',
        'uploaded_by',
    ];

    protected $appends = ['file_url'];

    public function donor()
    {
        return $this->belongsTo(Donor::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        return url('api/storage/' . ltrim($this->file_path, '/'));
    }
}
