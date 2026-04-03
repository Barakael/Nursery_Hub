<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'student_id'    => $this->student_id,
            'subject_id'    => $this->subject_id,
            'score'         => $this->score,
            'max_score'     => $this->max_score,
            'percentage'    => $this->percentage,
            'grade'         => $this->grade,
            'term'          => $this->term,
            'academic_year' => $this->academic_year,
            'student'       => $this->whenLoaded('student', fn() => ['id' => $this->student->id, 'name' => $this->student->name]),
            'subject'       => $this->whenLoaded('subject', fn() => ['id' => $this->subject->id, 'name' => $this->subject->name]),
            'recorded_at'   => $this->created_at?->toDateString(),
        ];
    }
}
