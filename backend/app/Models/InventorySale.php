<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventorySale extends Model
{
    protected $fillable = [
        'school_id',
        'item_id',
        'quantity',
        'unit_price',
        'recipient_type',
        'student_id',
        'recipient_name',
        'recorded_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'float',
            'quantity'   => 'integer',
        ];
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function getTotalPriceAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
