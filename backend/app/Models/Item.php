<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'fixed_item_id','description','sn','color_id','brand_id','pr_id',
        'acquisition_cost','acquisition_date','warranty_start_date','warranty_end_date',
        'budget_code','budget_donor','supplier_id','location_id','floor_id',
        'status_id','notes','holder_user_id','created_by'
    ];

    protected $casts = [
        'acquisition_cost' => 'float',
        'acquisition_date' => 'date',
        'warranty_start_date' => 'date',
        'warranty_end_date' => 'date',
    ];

    public function attributeValues() {
    return $this->hasMany(ItemAttributeValue::class, 'item_id');
}
    public function fixedItem() { return $this->belongsTo(FixedItem::class); }
    public function brand()     { return $this->belongsTo(Brand::class); }
    public function color()     { return $this->belongsTo(Color::class); }
    public function pr()        { return $this->belongsTo(Pr::class, 'pr_id'); }
    public function supplier()  { return $this->belongsTo(Supplier::class); }
    public function location()  { return $this->belongsTo(Location::class); }
    public function floor()     { return $this->belongsTo(Floor::class); }
    public function status()    { return $this->belongsTo(Status::class); }
    public function holder()    { return $this->belongsTo(User::class, 'holder_user_id'); }

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }


    public function history()
    {
        return $this->hasMany(ItemHistory::class);
    }

    public function maintenanceRecords()
    {
        return $this->hasMany(Maintenance::class);
    }
}
