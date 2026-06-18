<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Donor extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_no',
        'department_name',
        'finance_officer_id',
        'donor',
        'end_date',
        'notes'
    ];

    protected $casts = [
        'end_date' => 'date',
    ];

    public function financeOfficer()
    {
        return $this->belongsTo(User::class, 'finance_officer_id');
    }

    public function locations()
    {
        return $this->belongsToMany(Location::class, 'donor_locations')->withTimestamps();
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function documents()
    {
        return $this->hasMany(DonorDocument::class);
    }
}
