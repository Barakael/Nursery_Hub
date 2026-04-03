<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private function schoolId(Request $request): int
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            $id = $request->query('school_id', $user->school_id);
            return $id ? (int) $id : \App\Models\School::value('id');
        }
        return (int) $user->school_id;
    }

    public function index(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $role     = $request->query('role'); // teacher | parent

        $query = User::where('school_id', $schoolId);
        if ($role) {
            $query->where('role', $role);
        } else {
            $query->whereIn('role', ['teacher', 'parent']);
        }

        return UserResource::collection($query->orderBy('name')->get());
    }

    public function show(User $user)
    {
        return new UserResource($user);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', Rule::in(['teacher', 'parent'])],
            'phone'    => ['nullable', 'string', 'max:20'],
        ]);

        $data['school_id'] = $this->schoolId($request);
        $data['password']  = Hash::make($data['password']);

        $user = User::create($data);
        return new UserResource($user);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'phone'    => ['nullable', 'string', 'max:20'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return new UserResource($user);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }
}
