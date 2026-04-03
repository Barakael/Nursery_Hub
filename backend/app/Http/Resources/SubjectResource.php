<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'class_id'    => $this->class_id,
            'teacher_id'  => $this->teacher_id,
            'class'       => $this->whenLoaded('schoolClass', fn() => ['id' => $this->schoolClass->id, 'name' => $this->schoolClass->name]),
            'teacher'     => $this->whenLoaded('teacher', fn() => ['id' => $this->teacher->id, 'name' => $this->teacher->name]),
        ];
    }
}
