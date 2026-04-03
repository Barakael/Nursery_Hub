<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeeStructureRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'total_amount'  => ['required', 'numeric', 'min:0'],
            'term'          => ['nullable', 'string', 'max:20'],
            'academic_year' => ['nullable', 'string', 'max:10'],
            'due_date'      => ['nullable', 'date'],
            'is_active'     => ['nullable', 'boolean'],
        ];
    }
}
