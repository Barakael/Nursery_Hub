<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolSubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'status' => $this->status,
            'starts_on' => $this->starts_on?->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'notes' => $this->notes,
            'plan' => $this->whenLoaded('plan', fn () => [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'price' => $this->plan->price,
                'billing_cycle' => $this->plan->billing_cycle,
            ]),
            'activated_by' => $this->whenLoaded('activator', fn () => [
                'id' => $this->activator->id,
                'name' => $this->activator->name,
            ]),
            'created_at' => $this->created_at?->toDateString(),
        ];
    }
}
