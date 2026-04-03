<?php

namespace App\Http\Controllers;

use App\Models\TimetableSlot;
use App\Http\Resources\TimetableSlotResource;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = TimetableSlot::with('schoolClass');

        if ($user->isParent()) {
            // Show timetable for parent's children's classes
            $classIds = $user->children()->pluck('class_id');
            $query->whereIn('class_id', $classIds)
                  ->orWhere(fn($q) => $q->where('school_id', $user->school_id)->whereNull('class_id'));
        } elseif (!$user->isAdmin()) {
            $query->where('school_id', $user->school_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $days  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $order = array_flip($days);

        $slots = $query->get()->sortBy(fn($s) => $order[$s->day_of_week] ?? 99);

        return TimetableSlotResource::collection($slots->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'        => ['required', 'in:subject,meal'],
            'day_of_week' => ['required', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'title'       => ['required', 'string', 'max:255'],
            'class_id'    => ['nullable', 'exists:classes,id'],
            'time_start'  => ['nullable', 'date_format:H:i'],
            'time_end'    => ['nullable', 'date_format:H:i'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $data['school_id'] = $request->user()->isAdmin()
            ? ($request->school_id ?? $request->user()->school_id)
            : $request->user()->school_id;

        $slot = TimetableSlot::create($data);
        return new TimetableSlotResource($slot->load('schoolClass'));
    }

    public function update(Request $request, TimetableSlot $slot)
    {
        $data = $request->validate([
            'type'        => ['in:subject,meal'],
            'day_of_week' => ['in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'title'       => ['string', 'max:255'],
            'class_id'    => ['nullable', 'exists:classes,id'],
            'time_start'  => ['nullable', 'date_format:H:i'],
            'time_end'    => ['nullable', 'date_format:H:i'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $slot->update($data);
        return new TimetableSlotResource($slot->load('schoolClass'));
    }

    public function destroy(TimetableSlot $slot)
    {
        $slot->delete();
        return response()->json(['message' => 'Timetable slot deleted.']);
    }
}
