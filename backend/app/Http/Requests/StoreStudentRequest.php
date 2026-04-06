<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $schoolId = $this->user()?->school_id;
        $studentId = $this->route('student')?->id;

        return [
            'name'             => ['required', 'string', 'max:255'],
            'class_id'         => ['required', 'exists:classes,id'],
            'parent_id'        => ['nullable', 'exists:users,id'],
            'dob'              => ['nullable', 'date'],
            'gender'           => ['nullable', 'in:male,female'],
            'admission_number' => [
                'nullable', 'string', 'max:50',
                Rule::unique('students')
                    ->where('school_id', $schoolId)
                    ->ignore($studentId),
            ],
            'status'           => ['nullable', 'in:active,inactive'],
            // Inline parent creation fields
            'parent_name'      => ['nullable', 'string', 'max:255'],
            'parent_phone'     => ['nullable', 'string', 'max:20'],
            'parent_phone2'    => ['nullable', 'string', 'max:20'],
            'parent_email'     => ['nullable', 'email', 'max:255'],
        ];
    }
}
