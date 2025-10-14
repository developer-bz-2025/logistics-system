<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;


class User extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $fillable = ['name','email','password','employee_no','hr_id','position','role_id'];
    protected $hidden   = ['password','remember_token'];

        // ---------------------------
    // JWT Methods
    // ---------------------------

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function role() { return $this->belongsTo(Role::class); }

    public function locations()
    {
        return $this->belongsToMany(Location::class, 'user_locations')->withTimestamps();
    }

    public function actions()
    {
        return $this->hasMany(ActivityLog::class);
    }

     public function notificationRecipients()
    {
        return $this->hasMany(NotificationRecipient::class);
    }

    public function createdItems() { return $this->hasMany(Item::class, 'created_by'); }

    public function createdPrs()   { return $this->hasMany(Pr::class, 'created_by'); }

    public function createdMaintenances() { return $this->hasMany(Maintenance::class, 'created_by'); }

    public function locationChangeRequestsRequester(){
        return $this->hasMany(LocationChangeRequest::class,'requested_by_admin_id');
    }

    public function locationChangeRequestsApproval(){
        return $this->hasMany(LocationChangeRequest::class,'approved_by_admin_id');
    }

    public function prEditRequests(){
        return $this->hasMany(PrEditRequest::class,'requested_by_admin_id');
    }

    public function prEditRequestsApproval(){
        return $this->hasMany(PrEditRequest::class,'approved_by_admin_id');
    }

    public function itemEditRequests(){
        return $this->hasMany(ItemEditRequest::class,'requested_by_admin_id');
    }

    public function itemEditRequestsApproval(){
        return $this->hasMany(ItemEditRequest::class,'approved_by_admin_id');
    }



}
