<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\School;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->isAdmin() && $user->school_id) {
            $schoolActive = School::where('id', $user->school_id)->value('is_active');
            if (!$schoolActive) {
                return response()->json(['message' => 'Your school account is inactive. Contact system admin.'], 403);
            }
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $relations = $user->role === 'parent' ? ['school', 'children.schoolClass'] : ['school', 'school.currentSubscription.plan'];

        return response()->json([
            'token' => $token,
            'user'  => new UserResource($user->load($relations)),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $relations = $user->role === 'parent' ? ['school', 'children.schoolClass'] : ['school', 'school.currentSubscription.plan'];
        return new UserResource($user->load($relations));
    }

    public function updateMe(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'             => ['sometimes', 'string', 'max:255'],
            'email'            => ['sometimes', 'email', \Illuminate\Validation\Rule::unique('users')->ignore($user->id)],
            'phone'            => ['nullable', 'string', 'max:20'],
            'current_password' => ['required_with:password', 'string'],
            'password'         => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (isset($data['current_password'])) {
            if (!Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        unset($data['current_password']);

        $user->update($data);

        return new UserResource($user->load('school'));
    }
}
