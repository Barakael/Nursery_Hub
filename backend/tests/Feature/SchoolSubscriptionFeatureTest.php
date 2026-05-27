<?php

namespace Tests\Feature;

use App\Models\FeeStructure;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SchoolSubscriptionFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_school_with_manager_and_assign_subscription(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'school_id' => null]);
        Sanctum::actingAs($admin);

        $createSchool = $this->postJson('/api/v1/schools', [
            'name' => 'Test School',
            'manager' => [
                'name' => 'Manager One',
                'email' => 'manager1@example.com',
                'password' => 'password123',
            ],
        ]);

        $createSchool->assertOk();
        $schoolId = $createSchool->json('data.id');
        $this->assertDatabaseHas('users', [
            'email' => 'manager1@example.com',
            'role' => 'school',
            'school_id' => $schoolId,
        ]);

        $plan = SubscriptionPlan::create([
            'name' => 'Starter',
            'price' => 1000,
            'billing_cycle' => 'monthly',
            'is_active' => true,
        ]);

        $assign = $this->postJson('/api/v1/school-subscriptions', [
            'school_id' => $schoolId,
            'subscription_plan_id' => $plan->id,
            'starts_on' => now()->toDateString(),
            'status' => 'active',
        ]);

        $assign->assertOk();
        $this->assertDatabaseHas('school_subscriptions', [
            'school_id' => $schoolId,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('schools', [
            'id' => $schoolId,
            'is_active' => 1,
        ]);
    }

    public function test_school_manager_can_only_view_own_subscription(): void
    {
        $school = School::create(['name' => 'A', 'is_active' => true]);
        $school2 = School::create(['name' => 'B', 'is_active' => true]);

        $manager = User::factory()->create(['role' => 'school', 'school_id' => $school->id]);
        $admin = User::factory()->create(['role' => 'admin', 'school_id' => null]);

        $plan = SubscriptionPlan::create([
            'name' => 'Plan',
            'price' => 1000,
            'billing_cycle' => 'monthly',
            'is_active' => true,
        ]);
        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/school-subscriptions', [
            'school_id' => $school->id,
            'subscription_plan_id' => $plan->id,
            'starts_on' => now()->toDateString(),
            'status' => 'active',
        ])->assertOk();
        $this->postJson('/api/v1/school-subscriptions', [
            'school_id' => $school2->id,
            'subscription_plan_id' => $plan->id,
            'starts_on' => now()->toDateString(),
            'status' => 'active',
        ])->assertOk();

        Sanctum::actingAs($manager);
        $this->getJson('/api/v1/school-subscriptions/me')
            ->assertOk()
            ->assertJsonPath('data.school_id', $school->id);

        $this->getJson('/api/v1/school-subscriptions')
            ->assertForbidden();
    }

    public function test_overview_can_filter_by_fee_structure(): void
    {
        $school = School::create(['name' => 'A', 'is_active' => true]);
        $class = SchoolClass::create(['school_id' => $school->id, 'name' => 'Nursery 1']);
        $admin = User::factory()->create(['role' => 'admin', 'school_id' => null]);
        $student = Student::create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'name' => 'Student A',
            'admission_number' => 'ADM-100',
        ]);

        $fee1 = FeeStructure::create([
            'school_id' => $school->id,
            'name' => 'Tuition',
            'total_amount' => 100,
            'is_active' => true,
        ]);
        FeeStructure::create([
            'school_id' => $school->id,
            'name' => 'Trip',
            'total_amount' => 200,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);
        $this->getJson("/api/v1/reports/overview?school_id={$school->id}&fee_structure_id={$fee1->id}")
            ->assertOk()
            ->assertJsonPath('total_fees', 100.0);

        $this->getJson("/api/v1/reports/fee-structure/{$fee1->id}?school_id={$school->id}")
            ->assertOk()
            ->assertJsonPath('fee_structure.id', $fee1->id)
            ->assertJsonPath('total_students', 1);
    }
}
