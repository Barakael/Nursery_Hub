<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'class_id'         => ['required', 'exists:classes,id'],
            'parent_id'        => ['nullable', 'exists:users,id'],
            'dob'              => ['nullable', 'date'],
            'gender'           => ['nullable', 'in:male,female'],
            'admission_number' => ['nullable', 'string', 'max:50'],
            'status'           => ['in:active,inactive'],
        ];
    }
}
