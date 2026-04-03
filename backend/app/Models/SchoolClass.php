<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'school_id',
        'name',
        'academic_year',
        'capacity',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'class_id');
    }

    public function timetableSlots()
    {
        return $this->hasMany(TimetableSlot::class, 'class_id');
    }
}
