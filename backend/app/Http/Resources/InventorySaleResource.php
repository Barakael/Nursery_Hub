<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventorySaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'item'           => $this->whenLoaded('item', fn () => [
                'id'    => $this->item->id,
                'name'  => $this->item->name,
                'price' => $this->item->price,
            ]),
            'quantity'       => $this->quantity,
            'unit_price'     => $this->unit_price,
            'total_price'    => $this->total_price,
            'recipient_type' => $this->recipient_type,
            'student'        => $this->whenLoaded('student', fn () => $this->student
                ? ['id' => $this->student->id, 'name' => $this->student->name]
                : null),
            'recipient_name' => $this->recipient_name,
            'recorder'       => $this->whenLoaded('recorder', fn () => [
                'id'   => $this->recorder->id,
                'name' => $this->recorder->name,
            ]),
            'payment_method' => $this->payment_method ?? 'cash',
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
