<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserLocation extends Model
{
    use HasFactory;

    protected $table = 'user_locations';
    protected $fillable = ['user_id','location_id'];

    public function user()     { return $this->belongsTo(User::class); }
    public function location() { return $this->belongsTo(Location::class); }
}
