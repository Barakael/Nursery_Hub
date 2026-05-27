<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->isAdmin()) {
            return $next($request);
        }

        if (!$user->school_id) {
            return response()->json(['message' => 'Your account is not attached to a school.'], 403);
        }

        $isActive = School::where('id', $user->school_id)->value('is_active');
        if (!$isActive) {
            return response()->json(['message' => 'Your school account is currently inactive.'], 403);
        }

        return $next($request);
    }
}
