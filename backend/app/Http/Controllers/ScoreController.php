<?php

namespace App\Http\Controllers;

use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use App\Http\Requests\StoreScoreRequest;
use App\Http\Resources\ScoreResource;
use Illuminate\Http\Request;

class ScoreController extends Controller
{
    public function byStudent(Student $student, Request $request)
    {
        $user = $request->user();

        // Parents may only view their own children's scores
        if ($user->role === 'parent' && $student->parent_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Score::with('subject')
            ->where('student_id', $student->id);

        if ($request->filled('term')) {
            $query->where('term', $request->term);
        }

        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        return ScoreResource::collection($query->orderBy('id')->get());
    }

    public function bySubject(Subject $subject, Request $request)
    {
        $scores = Score::with('student')
            ->where('subject_id', $subject->id)
            ->when($request->filled('term'),          fn($q) => $q->where('term',          $request->term))
            ->when($request->filled('academic_year'), fn($q) => $q->where('academic_year', $request->academic_year))
            ->orderBy('score', 'desc')
            ->get();

        return ScoreResource::collection($scores);
    }

    public function upsert(StoreScoreRequest $request)
    {
        $data = $request->validated();
        $data['recorded_by']    = $request->user()->id;
        $data['max_score']      = $data['max_score'] ?? 100;
        $data['term']           = $data['term'] ?? 'Term 1';
        $data['academic_year']  = $data['academic_year'] ?? '2025/2026';

        $score = Score::updateOrCreate(
            [
                'student_id'    => $data['student_id'],
                'subject_id'    => $data['subject_id'],
                'term'          => $data['term'],
                'academic_year' => $data['academic_year'],
            ],
            $data
        );

        return new ScoreResource($score->load('student', 'subject'));
    }

    public function destroy(Score $score)
    {
        $score->delete();
        return response()->json(['message' => 'Score deleted.']);
    }
}
