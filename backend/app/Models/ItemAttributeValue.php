<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class ItemAttributeValue extends Model {
    protected $fillable = ['item_id','att_id','att_option_id','free_text'];

    public function item()      { return $this->belongsTo(Item::class); }
    public function attribute() { return $this->belongsTo(Attribute::class, 'att_id'); }
    public function option()    { return $this->belongsTo(AttOption::class, 'att_option_id'); }
}