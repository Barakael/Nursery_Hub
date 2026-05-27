<?php

namespace App\Http\Controllers;

use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function index(Request $request)
    {
        $query = SubscriptionPlan::query()->orderBy('name');
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return SubscriptionPlanResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $plan = SubscriptionPlan::create($data);
        return new SubscriptionPlanResource($plan);
    }

    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return new SubscriptionPlanResource($subscriptionPlan);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'billing_cycle' => ['sometimes', 'in:monthly,yearly'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $subscriptionPlan->update($data);
        return new SubscriptionPlanResource($subscriptionPlan);
    }

    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->delete();
        return response()->json(['message' => 'Subscription plan deleted.']);
    }
}
