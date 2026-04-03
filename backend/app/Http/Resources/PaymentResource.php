<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'student_id'        => $this->student_id,
            'fee_structure_id'  => $this->fee_structure_id,
            'amount_paid'       => $this->amount_paid,
            'payment_date'      => $this->payment_date?->toDateString(),
            'reference'         => $this->reference,
            'method'            => $this->method,
            'notes'             => $this->notes,
            'student'           => $this->whenLoaded('student', fn() => ['id' => $this->student->id, 'name' => $this->student->name]),
            'fee_structure'     => $this->whenLoaded('feeStructure', fn() => ['id' => $this->feeStructure->id, 'name' => $this->feeStructure->name, 'total' => $this->feeStructure->total_amount]),
            'recorded_by_name'  => $this->whenLoaded('recorder', fn() => $this->recorder->name),
        ];
    }
}
