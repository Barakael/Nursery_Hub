<?php

namespace Database\Seeders;

use App\Models\FeeStructure;
use App\Models\Payment;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ── School ────────────────────────────────────────────────────────────
        $school = School::create([
            'name'    => 'Sunshine Nursery School',
            'address' => '12 Palm Avenue, Lagos',
            'phone'   => '+234 801 234 5678',
            'email'   => 'info@sunshinenursery.edu',
        ]);

        // ── Admin (system-wide) ───────────────────────────────────────────────
        User::create([
            'name'     => 'System Admin',
            'email'    => 'admin@nurseryhub.demo',
            'password' => Hash::make('demo1234'),
            'role'     => 'admin',
        ]);

        // ── School Manager ────────────────────────────────────────────────────
        User::create([
            'name'      => 'School Manager',
            'email'     => 'school@nurseryhub.demo',
            'password'  => Hash::make('demo1234'),
            'role'      => 'school',
            'school_id' => $school->id,
        ]);

        // ── Teachers ──────────────────────────────────────────────────────────
        $teacher1 = User::create([
            'name'      => 'Ms. Sarah Okafor',
            'email'     => 'teacher@nurseryhub.demo',
            'password'  => Hash::make('demo1234'),
            'role'      => 'teacher',
            'school_id' => $school->id,
        ]);

        $teacher2 = User::create([
            'name'      => 'Mr. James Adeyemi',
            'email'     => 'james@nurseryhub.demo',
            'password'  => Hash::make('demo1234'),
            'role'      => 'teacher',
            'school_id' => $school->id,
        ]);

        // ── Parents ───────────────────────────────────────────────────────────
        $parent1 = User::create([
            'name'      => 'John Doe',
            'email'     => 'parent@nurseryhub.demo',
            'password'  => Hash::make('demo1234'),
            'role'      => 'parent',
            'school_id' => $school->id,
            'phone'     => '+234 802 111 2222',
        ]);

        $parent2 = User::create([
            'name'      => 'Amara Obi',
            'email'     => 'amara@nurseryhub.demo',
            'password'  => Hash::make('demo1234'),
            'role'      => 'parent',
            'school_id' => $school->id,
            'phone'     => '+234 803 333 4444',
        ]);

        // ── Classes ───────────────────────────────────────────────────────────
        $nursery1 = SchoolClass::create(['school_id' => $school->id, 'name' => 'Nursery 1', 'capacity' => 20]);
        $nursery2 = SchoolClass::create(['school_id' => $school->id, 'name' => 'Nursery 2', 'capacity' => 20]);
        $kg1      = SchoolClass::create(['school_id' => $school->id, 'name' => 'KG 1',      'capacity' => 25]);

        // ── Students ──────────────────────────────────────────────────────────
        $emma = Student::create(['school_id' => $school->id, 'class_id' => $nursery2->id, 'parent_id' => $parent1->id, 'name' => 'Emma Doe',   'dob' => '2021-03-15', 'admission_number' => 'ADM-001']);
        $liam = Student::create(['school_id' => $school->id, 'class_id' => $nursery2->id, 'parent_id' => $parent2->id, 'name' => 'Liam Smith',  'dob' => '2021-07-20', 'admission_number' => 'ADM-002']);
        $kachi= Student::create(['school_id' => $school->id, 'class_id' => $nursery1->id, 'parent_id' => $parent2->id, 'name' => 'Kachi Obi',   'dob' => '2022-01-10', 'admission_number' => 'ADM-003']);
        $zara = Student::create(['school_id' => $school->id, 'class_id' => $nursery2->id, 'parent_id' => null, 'name' => 'Zara Ahmed',  'dob' => '2021-05-03', 'admission_number' => 'ADM-004']);
        $tunde= Student::create(['school_id' => $school->id, 'class_id' => $nursery1->id, 'parent_id' => null, 'name' => 'Tunde Bello',  'dob' => '2022-09-22', 'admission_number' => 'ADM-005']);

        // ── Subjects ──────────────────────────────────────────────────────────
        $subjects1 = [];
        foreach (['Mathematics', 'English Language', 'Science', 'Creative Arts'] as $s) {
            $subjects1[] = Subject::create(['class_id' => $nursery1->id, 'teacher_id' => $teacher1->id, 'name' => $s]);
        }

        $subjects2 = [];
        foreach (['Mathematics', 'English Language', 'Science', 'Physical Education', 'Social Studies'] as $s) {
            $subjects2[] = Subject::create(['class_id' => $nursery2->id, 'teacher_id' => $teacher1->id, 'name' => $s]);
        }

        // ── Scores ────────────────────────────────────────────────────────────
        $scoreMap = [$emma->id => [85, 78, 92, 88, 70], $liam->id => [72, 90, 76, 80, 65], $zara->id => [91, 85, 95, 88, 78]];
        foreach ($scoreMap as $studentId => $scores) {
            foreach ($subjects2 as $i => $subject) {
                Score::create(['student_id' => $studentId, 'subject_id' => $subject->id, 'recorded_by' => $teacher1->id, 'score' => $scores[$i] ?? 75, 'max_score' => 100, 'term' => 'Term 1']);
            }
        }

        // ── Fee Structure ─────────────────────────────────────────────────────
        $fee = FeeStructure::create(['school_id' => $school->id, 'name' => 'Term 1 School Fees 2025/2026', 'total_amount' => 120000, 'term' => 'Term 1', 'academic_year' => '2025/2026', 'due_date' => '2026-02-28', 'is_active' => true]);

        // ── Payments ──────────────────────────────────────────────────────────
        Payment::create(['student_id' => $emma->id, 'fee_structure_id' => $fee->id, 'recorded_by' => $parent1->id, 'amount_paid' => 50000, 'payment_date' => '2026-03-28', 'method' => 'bank_transfer', 'reference' => 'PAY-001']);
        Payment::create(['student_id' => $emma->id, 'fee_structure_id' => $fee->id, 'recorded_by' => $parent1->id, 'amount_paid' => 30000, 'payment_date' => '2026-02-15', 'method' => 'cash', 'reference' => 'PAY-002']);
        Payment::create(['student_id' => $liam->id, 'fee_structure_id' => $fee->id, 'recorded_by' => $parent2->id, 'amount_paid' => 120000,'payment_date' => '2026-03-25', 'method' => 'bank_transfer', 'reference' => 'PAY-003']);
        Payment::create(['student_id' => $kachi->id,'fee_structure_id' => $fee->id, 'recorded_by' => $parent2->id, 'amount_paid' => 30000, 'payment_date' => '2026-03-22', 'method' => 'cash', 'reference' => 'PAY-004']);

        // ── Timetable ─────────────────────────────────────────────────────────
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $subjectSlots = [
            ['Mathematics', '08:00', '09:00'],
            ['English Language', '09:00', '10:00'],
            ['Science', '10:30', '11:30'],
            ['Creative Arts', '11:30', '12:30'],
            ['Physical Education', '09:00', '10:00'],
        ];
        foreach ($days as $i => $day) {
            $slot = $subjectSlots[$i] ?? $subjectSlots[0];
            TimetableSlot::create(['school_id' => $school->id, 'class_id' => $nursery2->id, 'type' => 'subject', 'day_of_week' => $day, 'time_start' => $slot[1], 'time_end' => $slot[2], 'title' => $slot[0]]);
        }

        $meals = [
            'Monday'    => ['Oat Porridge', 'Jollof Rice & Chicken', 'Fruit Salad'],
            'Tuesday'   => ['Bread & Eggs', 'Fried Rice & Fish', 'Biscuits'],
            'Wednesday' => ['Cereal & Milk', 'Yam & Egg Sauce', 'Banana'],
            'Thursday'  => ['Pancakes', 'Beans & Plantain', 'Cookies'],
            'Friday'    => ['Toast & Tea', 'Spaghetti & Meatballs', 'Yoghurt'],
        ];
        foreach ($meals as $day => $menu) {
            TimetableSlot::create(['school_id' => $school->id, 'class_id' => null, 'type' => 'meal', 'day_of_week' => $day, 'title' => implode(' | ', $menu), 'description' => "Breakfast: {$menu[0]}, Lunch: {$menu[1]}, Snack: {$menu[2]}"]);
        }
    }
}
