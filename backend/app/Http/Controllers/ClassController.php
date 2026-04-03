<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Http\Resources\ClassResource;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    private function schoolId(Request $request): int
    {
        $user = $request->user();
        return $user->isAdmin()
            ? (int) ($request->query('school_id', $user->school_id))
            : (int) $user->school_id;
    }

    public function index(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $classes  = SchoolClass::withCount('students')
            ->where('school_id', $schoolId)
            ->orderBy('name')
            ->get();

        return ClassResource::collection($classes);
    }

    public function show(SchoolClass $class)
    {
        return new ClassResource($class->loadCount('students'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:10'],
            'capacity'      => ['nullable', 'integer', 'min:1'],
        ]);

        $data['school_id'] = $this->schoolId($request);
        $class = SchoolClass::create($data);

        return new ClassResource($class);
    }

    public function update(Request $request, SchoolClass $class)
    {
        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:10'],
            'capacity'      => ['nullable', 'integer', 'min:1'],
        ]);

        $class->update($data);
        return new ClassResource($class->loadCount('students'));
    }

    public function destroy(SchoolClass $class)
    {
        $class->delete();
        return response()->json(['message' => 'Class deleted.']);
    }
}
