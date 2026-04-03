<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Score extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'subject_id',
        'recorded_by',
        'score',
        'max_score',
        'term',
        'academic_year',
    ];

    protected $casts = [
        'score'     => 'float',
        'max_score' => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function getPercentageAttribute(): float
    {
        return $this->max_score > 0
            ? round(($this->score / $this->max_score) * 100, 1)
            : 0;
    }

    public function getGradeAttribute(): string
    {
        $pct = $this->percentage;
        if ($pct >= 90) return 'A+';
        if ($pct >= 80) return 'A';
        if ($pct >= 70) return 'B+';
        if ($pct >= 60) return 'B';
        if ($pct >= 50) return 'C';
        return 'F';
    }
}
