<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Payment;
use App\Models\FeeStructure;
use App\Models\Score;
use App\Models\User;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function overview(Request $request)
    {
        $user     = $request->user();
        $schoolId = $user->isAdmin()
            ? ($request->query('school_id') ?? $user->school_id)
            : $user->school_id;

        $totalStudents = Student::where('school_id', $schoolId)->count();
        $totalClasses  = SchoolClass::where('school_id', $schoolId)->count();
        $totalTeachers = User::where('school_id', $schoolId)->where('role', 'teacher')->count();
        $totalParents  = User::where('school_id', $schoolId)->where('role', 'parent')->count();

        // ── Fee stats ─────────────────────────────────────────────────────────
        $feeStructure = FeeStructure::where('school_id', $schoolId)
            ->where('is_active', true)->latest()->first();

        $totalFees        = 0;
        $totalCollected   = 0;
        $collectionPct    = 0;
        $paidFull = $paidPartial = $unpaid = 0;
        $studentPayments  = [];

        if ($feeStructure) {
            $studentsQ = Student::with('schoolClass')
                ->where('school_id', $schoolId)->get();

            $totalFees = $feeStructure->total_amount * $studentsQ->count();

            foreach ($studentsQ as $s) {
                $paid = (float) Payment::where('student_id', $s->id)
                    ->where('fee_structure_id', $feeStructure->id)
                    ->sum('amount_paid');

                $totalCollected += $paid;

                if ($paid <= 0) {
                    $unpaid++;
                } elseif ($paid >= $feeStructure->total_amount - 0.01) {
                    $paidFull++;
                } else {
                    $paidPartial++;
                }

                $studentPayments[] = [
                    'id'         => $s->id,
                    'name'       => $s->name,
                    'class_name' => $s->schoolClass?->name ?? '—',
                    'total_fees' => $feeStructure->total_amount,
                    'total_paid' => $paid,
                    'remaining'  => max(0, $feeStructure->total_amount - $paid),
                ];
            }

            $collectionPct = $totalFees > 0
                ? round(($totalCollected / $totalFees) * 100, 1)
                : 0;
        }

        // ── Enrollment by class ───────────────────────────────────────────────
        $enrollmentByClass = SchoolClass::withCount('students')
            ->where('school_id', $schoolId)
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'class_name'     => $c->name,
                'student_count'  => $c->students_count,
            ]);

        // ── Recent admissions (last 10) ───────────────────────────────────────
        $recentAdmissions = Student::with('schoolClass')
            ->where('school_id', $schoolId)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($s) => [
                'id'               => $s->id,
                'name'             => $s->name,
                'admission_number' => $s->admission_number,
                'class_name'       => $s->schoolClass?->name ?? '—',
                'enrolled_at'      => $s->created_at->format('d M Y'),
            ]);

        return response()->json([
            'total_students'     => $totalStudents,
            'total_classes'      => $totalClasses,
            'total_teachers'     => $totalTeachers,
            'total_parents'      => $totalParents,
            'total_fees'         => $totalFees,
            'total_collected'    => $totalCollected,
            'collection_percent' => $collectionPct,
            'paid_full'          => $paidFull,
            'paid_partial'       => $paidPartial,
            'unpaid'             => $unpaid,
            'students'           => $studentPayments,
            'enrollment_by_class'=> $enrollmentByClass,
            'recent_admissions'  => $recentAdmissions,
        ]);
    }

    public function classPerformance(SchoolClass $schoolClass)
    {
        $subjects = $schoolClass->subjects()->with('scores')->get();

        $data = $subjects->map(function ($subject) {
            $scores = $subject->scores;
            $avg    = $scores->isNotEmpty()
                ? round($scores->avg('score'), 1)
                : null;

            return [
                'subject_id'   => $subject->id,
                'subject_name' => $subject->name,
                'avg_score'    => $avg,
                'count'        => $scores->count(),
            ];
        });

        $overallAvg = $data->whereNotNull('avg_score')->avg('avg_score');

        return response()->json([
            'class_id'    => $schoolClass->id,
            'class_name'  => $schoolClass->name,
            'overall_avg' => $overallAvg ? round($overallAvg, 1) : null,
            'subjects'    => $data->values(),
        ]);
    }

    public function studentReport(Student $student)
    {
        $scores = Score::with('subject')
            ->where('student_id', $student->id)
            ->get();

        $avgScore = $scores->isNotEmpty()
            ? round($scores->avg(fn($s) => $s->max_score > 0 ? ($s->score / $s->max_score) * 100 : 0), 1)
            : null;

        $balance = app(PaymentController::class)
            ->studentBalance($student, request());

        return response()->json([
            'student' => [
                'id'    => $student->id,
                'name'  => $student->name,
                'class' => $student->schoolClass?->name,
            ],
            'performance' => [
                'avg_percent'   => $avgScore,
                'subject_count' => $scores->count(),
                'scores'        => $scores->map(fn($s) => [
                    'subject'  => $s->subject?->name,
                    'score'    => $s->score,
                    'max'      => $s->max_score,
                    'grade'    => $s->grade,
                    'percent'  => $s->percentage,
                ]),
            ],
            'payments' => $balance->getData(true),
        ]);
    }
}
