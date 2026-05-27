<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'subscription_plan_id',
        'starts_on',
        'ends_on',
        'status',
        'notes',
        'activated_by',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function activator()
    {
        return $this->belongsTo(User::class, 'activated_by');
    }
}
