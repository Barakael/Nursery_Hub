<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\FeeStructureController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TimetableController;
use App\Http\Controllers\ReportController;

Route::prefix('v1')->group(function () {

    // ─── Auth (public) ───────────────────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login']);

    // ─── Protected ───────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',     [AuthController::class, 'me']);
        Route::put('/auth/me',     [AuthController::class, 'updateMe']);

        // Schools (admin only)
        Route::apiResource('schools', SchoolController::class)
            ->middleware('role:admin');

        // Classes — teachers can read; admin/school can write
        Route::get('classes',          [ClassController::class, 'index'])->middleware('role:admin,school,teacher');
        Route::get('classes/{class}',  [ClassController::class, 'show'])->middleware('role:admin,school,teacher');
        Route::middleware('role:admin,school')->group(function () {
            Route::post('classes',            [ClassController::class, 'store']);
            Route::put('classes/{class}',     [ClassController::class, 'update']);
            Route::delete('classes/{class}',  [ClassController::class, 'destroy']);
        });

        // Students — teachers can read; admin/school can write
        Route::get('students',        [StudentController::class, 'index'])->middleware('role:admin,school,teacher');
        Route::get('students/{student}', [StudentController::class, 'show'])->middleware('role:admin,school,teacher');
        Route::middleware('role:admin,school')->group(function () {
            Route::post('students',            [StudentController::class, 'store']);
            Route::put('students/{student}',   [StudentController::class, 'update']);
            Route::delete('students/{student}',[StudentController::class, 'destroy']);
            Route::post('students/import',     [StudentController::class, 'import']);
        });

        // Users — manage teachers & parents (admin, school)
        Route::middleware('role:admin,school')->group(function () {
            Route::get('users',            [UserController::class, 'index']);
            Route::post('users',           [UserController::class, 'store']);
            Route::get('users/{user}',     [UserController::class, 'show']);
            Route::put('users/{user}',     [UserController::class, 'update']);
            Route::delete('users/{user}',  [UserController::class, 'destroy']);
        });

        // Subjects (admin, school, teacher read)
        Route::get('subjects',             [SubjectController::class, 'index']);
        Route::get('subjects/{subject}',   [SubjectController::class, 'show']);
        Route::middleware('role:admin,school')->group(function () {
            Route::post('subjects',            [SubjectController::class, 'store']);
            Route::put('subjects/{subject}',   [SubjectController::class, 'update']);
            Route::delete('subjects/{subject}',[SubjectController::class, 'destroy']);
        });

        // Scores — all authenticated roles can read; only staff can write
        Route::get('scores/student/{student}', [ScoreController::class, 'byStudent']);
        Route::get('scores/subject/{subject}', [ScoreController::class, 'bySubject'])->middleware('role:teacher,admin,school');
        Route::middleware('role:teacher,admin,school')->group(function () {
            Route::post('scores',          [ScoreController::class, 'upsert']);
            Route::delete('scores/{score}',[ScoreController::class, 'destroy']);
        });

        // Fee Structures (admin, school)
        Route::middleware('role:admin,school')->group(function () {
            Route::apiResource('fee-structures', FeeStructureController::class);
        });

        // Payments
        Route::get('payments/student/{student}/balance', [PaymentController::class, 'studentBalance']);
        Route::get('payments/student/{student}',         [PaymentController::class, 'byStudent']);
        Route::middleware('role:admin,school')->group(function () {
            Route::get('payments',           [PaymentController::class, 'index']);
            Route::post('payments',          [PaymentController::class, 'store']);
            Route::delete('payments/{payment}', [PaymentController::class, 'destroy']);
        });

        // Timetable
        Route::get('timetable',                [TimetableController::class, 'index']);
        Route::middleware('role:admin,school,teacher')->group(function () {
            Route::post('timetable',           [TimetableController::class, 'store']);
            Route::put('timetable/{slot}',     [TimetableController::class, 'update']);
            Route::delete('timetable/{slot}',  [TimetableController::class, 'destroy']);
        });

        // Reports (read-only)
        Route::get('reports/overview',              [ReportController::class, 'overview'])
            ->middleware('role:admin,school');
        Route::get('reports/class/{schoolClass}',   [ReportController::class, 'classPerformance'])
            ->middleware('role:admin,school,teacher');
        Route::get('reports/student/{student}',     [ReportController::class, 'studentReport']);
    });
});
