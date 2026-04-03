<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Http\Resources\SubjectResource;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Subject::with(['schoolClass', 'teacher']);

        if ($user->isTeacher()) {
            $query->where('teacher_id', $user->id);
        } elseif (!$user->isAdmin()) {
            $query->whereHas('schoolClass', fn($q) => $q->where('school_id', $user->school_id));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        return SubjectResource::collection($query->orderBy('name')->get());
    }

    public function show(Subject $subject)
    {
        return new SubjectResource($subject->load('schoolClass', 'teacher'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'class_id'    => ['required', 'exists:classes,id'],
            'teacher_id'  => ['nullable', 'exists:users,id'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $subject = Subject::create($data);
        return new SubjectResource($subject->load('schoolClass', 'teacher'));
    }

    public function update(Request $request, Subject $subject)
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'class_id'    => ['sometimes', 'exists:classes,id'],
            'teacher_id'  => ['nullable', 'exists:users,id'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $subject->update($data);
        return new SubjectResource($subject->load('schoolClass', 'teacher'));
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
        return response()->json(['message' => 'Subject deleted.']);
    }
}
