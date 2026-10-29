<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DonorPolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_id',
        'content',
        'sort_order',
    ];

    public function donor()
    {
        return $this->belongsTo(Donor::class);
    }
}
