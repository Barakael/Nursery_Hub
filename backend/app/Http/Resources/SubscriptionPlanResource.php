<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'billing_cycle' => $this->billing_cycle,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toDateString(),
        ];
    }
}
