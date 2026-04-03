<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FeeStructure extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'name',
        'total_amount',
        'term',
        'academic_year',
        'due_date',
        'is_active',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'due_date'     => 'date',
        'is_active'    => 'boolean',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function getCollectedAttribute(): float
    {
        return (float) $this->payments()->sum('amount_paid');
    }

    public function getPendingAttribute(): float
    {
        return max(0, $this->total_amount - $this->collected);
    }

    public function getCollectionPercentAttribute(): float
    {
        if ($this->total_amount <= 0) return 0;
        return round(($this->collected / $this->total_amount) * 100, 1);
    }
}
