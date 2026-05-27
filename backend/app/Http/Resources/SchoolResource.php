<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'name'     => $this->name,
            'address'  => $this->address,
            'phone'    => $this->phone,
            'email'    => $this->email,
            'logo'     => $this->logo,
            'is_active'=> (bool) $this->is_active,
            'settings' => $this->settings,
            'students_count' => $this->whenCounted('students'),
            'classes_count' => $this->whenCounted('classes'),
            'manager'  => $this->whenLoaded('users', function () {
                $manager = $this->users->firstWhere('role', 'school');
                if (!$manager) {
                    return null;
                }
                return [
                    'id' => $manager->id,
                    'name' => $manager->name,
                    'email' => $manager->email,
                    'phone' => $manager->phone,
                ];
            }),
            'current_subscription' => $this->whenLoaded('currentSubscription', function () {
                if (!$this->currentSubscription) {
                    return null;
                }
                return [
                    'id' => $this->currentSubscription->id,
                    'status' => $this->currentSubscription->status,
                    'starts_on' => $this->currentSubscription->starts_on?->toDateString(),
                    'ends_on' => $this->currentSubscription->ends_on?->toDateString(),
                    'plan_name' => $this->currentSubscription->plan?->name,
                    'plan_id' => $this->currentSubscription->plan?->id,
                ];
            }),
        ];
    }
}
