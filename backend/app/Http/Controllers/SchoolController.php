<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Http\Resources\SchoolResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::with([
            'users',
            'currentSubscription.plan',
        ])
            ->withCount(['students', 'classes'])
            ->orderBy('name')
            ->get();

        return SchoolResource::collection($schools);
    }

    public function show(School $school)
    {
        return new SchoolResource($school->load(['users', 'currentSubscription.plan']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'address'  => ['nullable', 'string'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'email'    => ['nullable', 'email'],
            'logo'     => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
            'settings' => ['nullable', 'array'],
            'manager.name' => ['required', 'string', 'max:255'],
            'manager.email' => ['required', 'email', 'unique:users,email'],
            'manager.password' => ['required', 'string', 'min:8'],
            'manager.phone' => ['nullable', 'string', 'max:20'],
        ]);

        $school = DB::transaction(function () use ($data) {
            $managerData = $data['manager'];
            unset($data['manager']);

            $school = School::create($data);

            $school->users()->create([
                'name' => $managerData['name'],
                'email' => $managerData['email'],
                'password' => Hash::make($managerData['password']),
                'phone' => $managerData['phone'] ?? null,
                'role' => 'school',
                'school_id' => $school->id,
            ]);

            return $school;
        });

        return new SchoolResource($school->load(['users', 'currentSubscription.plan']));
    }

    public function update(Request $request, School $school)
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'address'  => ['nullable', 'string'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'email'    => ['nullable', 'email'],
            'logo'     => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'settings' => ['nullable', 'array'],
        ]);

        $school->update($data);
        return new SchoolResource($school->load(['users', 'currentSubscription.plan']));
    }

    public function destroy(School $school)
    {
        $school->delete();
        return response()->json(['message' => 'School deleted.']);
    }
}
