<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimetableSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'school_id'   => $this->school_id,
            'class_id'    => $this->class_id,
            'type'        => $this->type,
            'day_of_week' => $this->day_of_week,
            'time_start'  => $this->time_start,
            'time_end'    => $this->time_end,
            'title'       => $this->title,
            'description' => $this->description,
            'class'       => $this->whenLoaded('schoolClass', fn() => ['id' => $this->schoolClass->id, 'name' => $this->schoolClass->name]),
        ];
    }
}
