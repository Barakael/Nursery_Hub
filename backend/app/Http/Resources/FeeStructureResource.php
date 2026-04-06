<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeStructureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'name'               => $this->name,
            'total_amount'       => $this->total_amount,
            'term'               => $this->term,
            'academic_year'      => $this->academic_year,
            'due_date'           => $this->due_date?->toDateString(),
            'is_active'          => $this->is_active,
            'school_id'          => $this->school_id,
            'class_id'           => $this->class_id,
            'class_name'         => $this->whenLoaded('schoolClass', fn() => $this->schoolClass?->name),
            'collected'          => $this->collected,
            'pending'            => $this->pending,
            'collection_percent' => $this->collection_percent,
        ];
    }
}
