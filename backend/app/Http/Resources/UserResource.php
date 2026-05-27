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
            'school'               => $this->whenLoaded('school', fn() => [
                'id' => $this->school->id,
                'name' => $this->school->name,
                'logo' => $this->school->logo,
                'is_active' => (bool) $this->school->is_active,
                'current_subscription' => $this->school->currentSubscription ? [
                    'id' => $this->school->currentSubscription->id,
                    'status' => $this->school->currentSubscription->status,
                    'starts_on' => $this->school->currentSubscription->starts_on?->toDateString(),
                    'ends_on' => $this->school->currentSubscription->ends_on?->toDateString(),
                    'plan_name' => $this->school->currentSubscription->plan?->name,
                    'plan_price' => $this->school->currentSubscription->plan?->price,
                    'plan_cycle' => $this->school->currentSubscription->plan?->billing_cycle,
                ] : null,
            ]),
            'children'             => $this->whenLoaded('children', fn() => $this->children->map(fn($c) => [
                'id'         => $c->id,
                'name'       => $c->name,
                'class_id'   => $c->class_id,
                'class_name' => $c->schoolClass?->name,
            ])),
            'can_manage_timetable' => (bool) $this->can_manage_timetable,
            'created_at'           => $this->created_at?->toDateString(),
        ];
    }
}
