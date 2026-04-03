<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Resources\StudentResource;
use App\Imports\StudentImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
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

        $query = Student::with(['schoolClass', 'parent'])
            ->where('school_id', $schoolId);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return StudentResource::collection(
            $query->orderBy('name')->paginate($request->integer('per_page', 20))
        );
    }

    public function show(Student $student)
    {
        return new StudentResource($student->load('schoolClass', 'parent'));
    }

    public function store(StoreStudentRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $this->schoolId($request);

        $student = Student::create($data);
        return new StudentResource($student->load('schoolClass', 'parent'));
    }

    public function update(StoreStudentRequest $request, Student $student)
    {
        $student->update($request->validated());
        return new StudentResource($student->load('schoolClass', 'parent'));
    }

    public function destroy(Student $student)
    {
        $student->delete();
        return response()->json(['message' => 'Student deleted.']);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file'     => ['required', 'file', 'mimes:xlsx,xls,csv'],
            'class_id' => ['required', 'exists:classes,id'],
        ]);

        $schoolId = $this->schoolId($request);

        Excel::import(
            new StudentImport($schoolId, $request->class_id),
            $request->file('file')
        );

        return response()->json(['message' => 'Students imported successfully.']);
    }
}
