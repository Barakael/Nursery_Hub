<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Resources\StudentResource;
use App\Imports\StudentImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{
    // Resolve or create a parent user from inline form fields
    private function resolveParent(array $data, int $schoolId): ?int
    {
        if (!empty($data['parent_id'])) {
            return (int) $data['parent_id'];
        }

        if (empty($data['parent_name'])) {
            return null;
        }

        $email = !empty($data['parent_email'])
            ? $data['parent_email']
            : 'parent.' . Str::slug($data['parent_name']) . '.' . rand(100, 999) . '@portal.local';

        // Ensure email is unique — append extra digits if needed
        $baseEmail = $email;
        $i = 1;
        while (User::where('email', $email)->where('school_id', '!=', $schoolId)->exists()) {
            $email = rtrim($baseEmail, '.local') . $i . '.local';
            $i++;
        }

        $parent = User::firstOrCreate(
            ['email' => $email],
            [
                'name'      => $data['parent_name'],
                'phone'     => $data['parent_phone'] ?? null,
                'phone2'    => $data['parent_phone2'] ?? null,
                'role'      => 'parent',
                'school_id' => $schoolId,
                'password'  => Hash::make('Parent123'),
            ]
        );

        // Update phone if parent already exists and phone changed
        if (!$parent->wasRecentlyCreated && !empty($data['parent_phone'])) {
            $parent->update([
                'phone'  => $data['parent_phone'],
                'phone2' => $data['parent_phone2'] ?? $parent->phone2,
            ]);
        }

        return $parent->id;
    }

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

        // Auto-generate admission number if not provided
        if (empty($data['admission_number'])) {
            $year = now()->year;
            $next = Student::where('school_id', $data['school_id'])->count() + 1;
            $data['admission_number'] = 'ADM-' . $year . '-' . str_pad($next, 4, '0', STR_PAD_LEFT);
            while (Student::where('school_id', $data['school_id'])->where('admission_number', $data['admission_number'])->exists()) {
                $next++;
                $data['admission_number'] = 'ADM-' . $year . '-' . str_pad($next, 4, '0', STR_PAD_LEFT);
            }
        }

        // Resolve/create parent
        $data['parent_id'] = $this->resolveParent($data, $data['school_id']);

        // Remove inline parent fields before creating student
        unset($data['parent_name'], $data['parent_phone'], $data['parent_phone2'], $data['parent_email']);

        $student = Student::create($data);
        return new StudentResource($student->load('schoolClass', 'parent'));
    }

    public function update(StoreStudentRequest $request, Student $student)
    {
        $data = $request->validated();

        // Resolve/create parent from inline fields
        $resolved = $this->resolveParent($data, $student->school_id);
        if ($resolved !== null) {
            $data['parent_id'] = $resolved;
        }

        unset($data['parent_name'], $data['parent_phone'], $data['parent_phone2'], $data['parent_email']);

        $student->update($data);
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
