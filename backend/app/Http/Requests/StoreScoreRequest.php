<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'student_id'    => ['required', 'exists:students,id'],
            'subject_id'    => ['required', 'exists:subjects,id'],
            'score'         => ['required', 'numeric', 'min:0'],
            'max_score'     => ['nullable', 'numeric', 'min:1'],
            'term'          => ['nullable', 'string', 'max:20'],
            'academic_year' => ['nullable', 'string', 'max:10'],
        ];
    }
}
