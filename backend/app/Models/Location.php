<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Location extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    // public function floors() { return $this->hasMany(Floor::class); }
    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_locations')->withTimestamps();
    }

    public function locationChangeRequestS()
    {
        return $this->hasMany(LocationChangeRequest::class);
    }

    public function currentChangeRequests()
    {
        return $this->hasMany(LocationChangeRequest::class, 'current_location_id');
    }
    public function requestedChangeRequests()
    {
        return $this->hasMany(LocationChangeRequest::class, 'requested_location_id');
    }

}
