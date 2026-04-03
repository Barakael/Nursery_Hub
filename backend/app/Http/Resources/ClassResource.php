<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'academic_year' => $this->academic_year,
            'capacity'      => $this->capacity,
            'school_id'     => $this->school_id,
            'student_count' => $this->whenCounted('students'),
            'students'      => StudentResource::collection($this->whenLoaded('students')),
        ];
    }
}
