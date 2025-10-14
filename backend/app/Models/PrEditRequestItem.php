<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PrEditRequestItem extends Model
{
    use HasFactory;

    protected $table = 'pr_edit_request_items';
    protected $fillable = [
        'pr_edit_request_id','pr_item_id','old_supplier_id','new_supplier_id','action'
    ];

    public function request()   { return $this->belongsTo(PrEditRequest::class, 'pr_edit_request_id'); }
    public function prItem()    { return $this->belongsTo(PrItem::class, 'pr_item_id'); }
    public function oldSupplier(){ return $this->belongsTo(Supplier::class, 'old_supplier_id'); }
    public function newSupplier(){ return $this->belongsTo(Supplier::class, 'new_supplier_id'); }
}
