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
    private function schoolId(Request $request): int
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            $id = $request->query('school_id', $user->school_id);
            return $id ? (int) $id : School::value('id');
        }
        return (int) $user->school_id;
    }

    public function overview(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $feeStructureFilter = $request->integer('fee_structure_id');

        $totalStudents = Student::where('school_id', $schoolId)->count();
        $totalClasses  = SchoolClass::where('school_id', $schoolId)->count();
        $totalTeachers = User::where('school_id', $schoolId)->where('role', 'teacher')->count();
        $totalParents  = User::where('school_id', $schoolId)->where('role', 'parent')->count();

        // ── Fee stats ─────────────────────────────────────────────────────────
        $totalFees        = 0;
        $totalCollected   = 0;
        $collectionPct    = 0;
        $paidFull = $paidPartial = $unpaid = 0;
        $studentPayments  = [];

        $studentsQ = Student::with('schoolClass')
            ->where('school_id', $schoolId)->get();

        foreach ($studentsQ as $s) {
            $feeStructuresForStudent = FeeStructure::where('school_id', $schoolId)
                ->where('is_active', true)
                ->where(function ($q) use ($s) {
                    $q->where('class_id', $s->class_id)
                      ->orWhereNull('class_id');
                });

            if ($feeStructureFilter) {
                $feeStructuresForStudent->where('id', $feeStructureFilter);
            }

            $feeStructuresForStudent = $feeStructuresForStudent
                ->get();

            if ($feeStructuresForStudent->isEmpty()) continue;

            $studentTotal = 0;
            $studentPaid  = 0;

            foreach ($feeStructuresForStudent as $fs) {
                $paid = (float) Payment::where('student_id', $s->id)
                    ->where('fee_structure_id', $fs->id)
                    ->sum('amount_paid');

                $studentTotal += $fs->total_amount;
                $studentPaid  += $paid;
            }

            $totalFees      += $studentTotal;
            $totalCollected += $studentPaid;

            if ($studentPaid <= 0) {
                $unpaid++;
            } elseif ($studentPaid >= $studentTotal - 0.01) {
                $paidFull++;
            } else {
                $paidPartial++;
            }

            $studentPayments[] = [
                'id'         => $s->id,
                'name'       => $s->name,
                'class_name' => $s->schoolClass?->name ?? '—',
                'total_fees' => $studentTotal,
                'total_paid' => $studentPaid,
                'remaining'  => max(0, $studentTotal - $studentPaid),
            ];
        }

        $collectionPct = $totalFees > 0
            ? round(($totalCollected / $totalFees) * 100, 1)
            : 0;

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

    public function feeStructureOverview(FeeStructure $feeStructure, Request $request)
    {
        $schoolId = $this->schoolId($request);
        if ((int) $feeStructure->school_id !== $schoolId) {
            abort(403, 'You cannot access this fee structure report.');
        }

        $students = Student::with('schoolClass')
            ->where('school_id', $schoolId)
            ->when($feeStructure->class_id, fn ($q) => $q->where('class_id', $feeStructure->class_id))
            ->orderBy('name')
            ->get();

        $rows = [];
        $expected = 0;
        $collected = 0;

        foreach ($students as $student) {
            $paid = (float) Payment::where('student_id', $student->id)
                ->where('fee_structure_id', $feeStructure->id)
                ->sum('amount_paid');

            $expected += (float) $feeStructure->total_amount;
            $collected += $paid;

            $rows[] = [
                'id' => $student->id,
                'name' => $student->name,
                'class_name' => $student->schoolClass?->name ?? '—',
                'total_fees' => (float) $feeStructure->total_amount,
                'total_paid' => $paid,
                'remaining' => max(0, (float) $feeStructure->total_amount - $paid),
            ];
        }

        $remaining = max(0, $expected - $collected);
        $pct = $expected > 0 ? round(($collected / $expected) * 100, 1) : 0;

        return response()->json([
            'fee_structure' => [
                'id' => $feeStructure->id,
                'name' => $feeStructure->name,
                'term' => $feeStructure->term,
                'academic_year' => $feeStructure->academic_year,
                'class_id' => $feeStructure->class_id,
                'class_name' => $feeStructure->schoolClass?->name,
            ],
            'total_students' => $students->count(),
            'total_fees' => $expected,
            'total_collected' => $collected,
            'remaining' => $remaining,
            'collection_percent' => $pct,
            'students' => $rows,
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

    public function classStudentScores(SchoolClass $schoolClass, Request $request)
    {
        $term          = $request->query('term');
        $academicYear  = $request->query('academic_year');

        $subjects = $schoolClass->subjects()->orderBy('name')->get();
        $students = Student::where('class_id', $schoolClass->id)->orderBy('name')->get();

        $scoresQuery = Score::with('subject')
            ->whereIn('student_id', $students->pluck('id'))
            ->whereIn('subject_id', $subjects->pluck('id'));

        if ($term)         $scoresQuery->where('term', $term);
        if ($academicYear) $scoresQuery->where('academic_year', $academicYear);

        $allScores = $scoresQuery->get()->groupBy('student_id');

        $studentRows = $students->map(function ($student) use ($allScores, $subjects) {
            $studentScores = $allScores->get($student->id, collect());

            $subjectScores = $subjects->map(function ($subject) use ($studentScores) {
                $sc = $studentScores->firstWhere('subject_id', $subject->id);
                return [
                    'subject_id'   => $subject->id,
                    'subject_name' => $subject->name,
                    'score'        => $sc?->score,
                    'max_score'    => $sc?->max_score ?? 100,
                    'grade'        => $sc?->grade,
                    'percent'      => $sc?->percentage,
                ];
            });

            $scored = $subjectScores->filter(fn($s) => $s['score'] !== null);
            $avg = $scored->count() > 0 ? round($scored->avg('percent'), 1) : null;

            return [
                'id'               => $student->id,
                'name'             => $student->name,
                'admission_number' => $student->admission_number,
                'subjects'         => $subjectScores->values(),
                'avg_percent'      => $avg,
            ];
        });

        return response()->json([
            'class_id'   => $schoolClass->id,
            'class_name' => $schoolClass->name,
            'subjects'   => $subjects->map(fn($s) => ['id' => $s->id, 'name' => $s->name])->values(),
            'students'   => $studentRows->values(),
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
