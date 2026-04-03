<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'student_id'        => ['required', 'exists:students,id'],
            'fee_structure_id'  => ['required', 'exists:fee_structures,id'],
            'amount_paid'       => ['required', 'numeric', 'min:0.01'],
            'payment_date'      => ['required', 'date'],
            'method'            => ['nullable', 'string', 'max:50'],
            'reference'         => ['nullable', 'string', 'max:100'],
            'notes'             => ['nullable', 'string', 'max:500'],
        ];
    }
}
