<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use App\Models\FeeStructure;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Payment::with(['student', 'feeStructure', 'recorder'])
            ->whereHas('student', fn($q) => $q->where('school_id', $user->school_id));

        if ($request->filled('fee_structure_id')) {
            $query->where('fee_structure_id', $request->fee_structure_id);
        }

        return PaymentResource::collection(
            $query->orderByDesc('payment_date')->paginate($request->integer('per_page', 20))
        );
    }

    public function byStudent(Student $student, Request $request)
    {
        $payments = Payment::with(['feeStructure', 'recorder'])
            ->where('student_id', $student->id)
            ->orderByDesc('payment_date')
            ->get();

        return PaymentResource::collection($payments);
    }

    public function studentBalance(Student $student, Request $request)
    {
        $schoolId = $student->school_id;

        // Fetch ALL active fee structures for this student's class + school-wide ones
        $feeStructures = FeeStructure::where('school_id', $schoolId)
            ->where('is_active', true)
            ->where(function ($q) use ($student) {
                $q->where('class_id', $student->class_id)
                  ->orWhereNull('class_id');
            })
            ->orderBy('academic_year')
            ->orderBy('term')
            ->get();

        if ($feeStructures->isEmpty()) {
            return response()->json([
                'total'      => 0,
                'paid'       => 0,
                'remaining'  => 0,
                'percent'    => 0,
                'structure'  => null,
                'structures' => [],
            ]);
        }

        $grandTotal = 0;
        $grandPaid  = 0;
        $structures = [];

        foreach ($feeStructures as $fs) {
            $paid = (float) Payment::where('student_id', $student->id)
                ->where('fee_structure_id', $fs->id)
                ->sum('amount_paid');

            $total     = $fs->total_amount;
            $remaining = max(0, $total - $paid);
            $percent   = $total > 0 ? round(($paid / $total) * 100, 1) : 0;

            $grandTotal += $total;
            $grandPaid  += $paid;

            $structures[] = [
                'id'            => $fs->id,
                'name'          => $fs->name,
                'term'          => $fs->term,
                'academic_year' => $fs->academic_year,
                'total'         => $total,
                'paid'          => $paid,
                'remaining'     => $remaining,
                'percent'       => $percent,
            ];
        }

        $grandRemaining = max(0, $grandTotal - $grandPaid);
        $grandPercent   = $grandTotal > 0 ? round(($grandPaid / $grandTotal) * 100, 1) : 0;

        return response()->json([
            'total'      => $grandTotal,
            'paid'       => $grandPaid,
            'remaining'  => $grandRemaining,
            'percent'    => $grandPercent,
            'structure'  => $structures[0] ?? null, // backward compat
            'structures' => $structures,
        ]);
    }

    public function store(StorePaymentRequest $request)
    {
        $data = $request->validated();
        $data['recorded_by'] = $request->user()->id;

        // Validate amount doesn't exceed remaining balance
        $feeStructure = FeeStructure::findOrFail($data['fee_structure_id']);
        $alreadyPaid  = Payment::where('student_id', $data['student_id'])
            ->where('fee_structure_id', $data['fee_structure_id'])
            ->sum('amount_paid');

        $remaining = $feeStructure->total_amount - (float) $alreadyPaid;

        if ($data['amount_paid'] > $remaining + 0.01) {
            return response()->json([
                'message' => 'Payment amount exceeds remaining balance of ' . number_format($remaining, 2),
            ], 422);
        }

        $payment = Payment::create($data);
        return new PaymentResource($payment->load('student', 'feeStructure', 'recorder'));
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->json(['message' => 'Payment deleted.']);
    }
}
