<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PrItem extends Model
{
    use HasFactory;

    protected $table = 'pr_items';
    protected $fillable = ['pr_id','supplier_id','fixed_item_id','qty','unit_cost','currency'];
    public function pr()        { return $this->belongsTo(Pr::class, 'pr_id'); }
    public function supplier()  { return $this->belongsTo(Supplier::class,'supplier_id'); }
    public function fixedItem() { return $this->belongsTo(FixedItem::class, 'fixed_item_id'); }
}
