<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Http\Resources\SchoolResource;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function index()
    {
        return SchoolResource::collection(School::all());
    }

    public function show(School $school)
    {
        return new SchoolResource($school);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'address'  => ['nullable', 'string'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'email'    => ['nullable', 'email'],
            'settings' => ['nullable', 'array'],
        ]);

        $school = School::create($data);
        return new SchoolResource($school);
    }

    public function update(Request $request, School $school)
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'address'  => ['nullable', 'string'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'email'    => ['nullable', 'email'],
            'settings' => ['nullable', 'array'],
        ]);

        $school->update($data);
        return new SchoolResource($school);
    }

    public function destroy(School $school)
    {
        $school->delete();
        return response()->json(['message' => 'School deleted.']);
    }
}
