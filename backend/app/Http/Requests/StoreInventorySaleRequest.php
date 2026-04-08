<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventorySaleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'item_id'        => ['required', 'exists:inventory_items,id'],
            'quantity'       => ['required', 'integer', 'min:1'],
            'recipient_type' => ['required', 'in:student,other'],
            'student_id'     => ['nullable', 'required_if:recipient_type,student', 'exists:students,id'],
            'recipient_name' => ['nullable', 'string', 'max:255'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ];
    }
}
