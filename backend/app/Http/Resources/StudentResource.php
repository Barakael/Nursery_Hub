<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'dob'              => $this->dob?->toDateString(),
            'gender'           => $this->gender,
            'photo'            => $this->photo,
            'admission_number' => $this->admission_number,
            'status'           => $this->status,
            'school_id'        => $this->school_id,
            'class_id'         => $this->class_id,
            'parent_id'        => $this->parent_id,
            'class'            => $this->whenLoaded('schoolClass', fn() => ['id' => $this->schoolClass->id, 'name' => $this->schoolClass->name]),
            'parent'           => $this->whenLoaded('parent', fn() => ['id' => $this->parent->id, 'name' => $this->parent->name, 'phone' => $this->parent->phone, 'phone2' => $this->parent->phone2]),
        ];
    }
}
