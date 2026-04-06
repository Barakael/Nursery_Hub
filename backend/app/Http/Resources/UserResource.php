<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'phone'      => $this->phone,
            'avatar'     => $this->avatar,
            'school_id'  => $this->school_id,
            'school'               => $this->whenLoaded('school', fn() => ['id' => $this->school->id, 'name' => $this->school->name]),
            'children'             => $this->whenLoaded('children', fn() => $this->children->map(fn($c) => ['id' => $c->id, 'name' => $c->name])),
            'can_manage_timetable' => (bool) $this->can_manage_timetable,
            'created_at'           => $this->created_at?->toDateString(),
        ];
    }
}
