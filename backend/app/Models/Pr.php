<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pr extends Model
{
    use HasFactory;

    protected $table = 'prs';
    protected $fillable = ['pr_code','pr_path','pr_date','total_price','created_by'];
    protected $casts = ['pr_date' => 'date', 'total_price' => 'float'];

    public function items()      { return $this->hasMany(PrItem::class, 'pr_id'); }
    public function creator()    { return $this->belongsTo(User::class, 'created_by'); }

    public function assets()     { return $this->hasMany(Item::class, 'pr_id'); }

    public function prEditRequests(){
        return $this->hasMany(PrEditRequest::class,'pr_id');
    }


}
