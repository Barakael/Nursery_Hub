<?php

namespace App\Http\Controllers;

use App\Http\Resources\SchoolSubscriptionResource;
use App\Models\School;
use App\Models\SchoolSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = SchoolSubscription::with(['plan', 'school', 'activator'])
            ->latest();

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->integer('school_id'));
        }

        return SchoolSubscriptionResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'subscription_plan_id' => ['required', 'exists:subscription_plans,id'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'status' => ['nullable', 'in:active,inactive,expired,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        $subscription = DB::transaction(function () use ($data, $request) {
            if (($data['status'] ?? 'active') === 'active') {
                SchoolSubscription::where('school_id', $data['school_id'])
                    ->where('status', 'active')
                    ->update(['status' => 'inactive']);
            }

            $subscription = SchoolSubscription::create([
                ...$data,
                'status' => $data['status'] ?? 'active',
                'activated_by' => $request->user()->id,
            ]);

            if ($subscription->status === 'active') {
                School::where('id', $subscription->school_id)->update(['is_active' => true]);
            }

            return $subscription;
        });

        return new SchoolSubscriptionResource($subscription->load(['plan', 'activator']));
    }

    public function update(Request $request, SchoolSubscription $schoolSubscription)
    {
        $data = $request->validate([
            'subscription_plan_id' => ['sometimes', 'exists:subscription_plans,id'],
            'starts_on' => ['sometimes', 'date'],
            'ends_on' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:active,inactive,expired,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data, $schoolSubscription) {
            $schoolSubscription->update($data);

            if (array_key_exists('status', $data)) {
                School::where('id', $schoolSubscription->school_id)->update([
                    'is_active' => $data['status'] === 'active',
                ]);
            }
        });

        return new SchoolSubscriptionResource($schoolSubscription->fresh()->load(['plan', 'activator']));
    }

    public function destroy(SchoolSubscription $schoolSubscription)
    {
        $schoolSubscription->delete();
        return response()->json(['message' => 'School subscription deleted.']);
    }

    public function activate(SchoolSubscription $schoolSubscription, Request $request)
    {
        DB::transaction(function () use ($schoolSubscription, $request) {
            SchoolSubscription::where('school_id', $schoolSubscription->school_id)
                ->where('id', '!=', $schoolSubscription->id)
                ->where('status', 'active')
                ->update(['status' => 'inactive']);

            $schoolSubscription->update([
                'status' => 'active',
                'activated_by' => $request->user()->id,
            ]);

            School::where('id', $schoolSubscription->school_id)->update(['is_active' => true]);
        });

        return new SchoolSubscriptionResource($schoolSubscription->fresh()->load(['plan', 'activator']));
    }

    public function deactivate(SchoolSubscription $schoolSubscription)
    {
        DB::transaction(function () use ($schoolSubscription) {
            $schoolSubscription->update(['status' => 'inactive']);
            School::where('id', $schoolSubscription->school_id)->update(['is_active' => false]);
        });

        return new SchoolSubscriptionResource($schoolSubscription->fresh()->load(['plan', 'activator']));
    }

    public function mySubscription(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $subscription = SchoolSubscription::with(['plan', 'activator'])
            ->where('school_id', $schoolId)
            ->latest()
            ->first();

        if (!$subscription) {
            return response()->json(['data' => null]);
        }

        return new SchoolSubscriptionResource($subscription);
    }
}
