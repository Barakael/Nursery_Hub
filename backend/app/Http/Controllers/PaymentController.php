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
        $schoolId    = $student->school_id;
        $feeStructure = FeeStructure::where('school_id', $schoolId)
            ->where('is_active', true)
            ->where('class_id', $student->class_id)
            ->latest()->first()
            ?? FeeStructure::where('school_id', $schoolId)
                ->where('is_active', true)
                ->whereNull('class_id')
                ->latest()->first();

        if (!$feeStructure) {
            return response()->json([
                'total'     => 0,
                'paid'      => 0,
                'remaining' => 0,
                'percent'   => 0,
                'structure' => null,
            ]);
        }

        $paid = Payment::where('student_id', $student->id)
            ->where('fee_structure_id', $feeStructure->id)
            ->sum('amount_paid');

        $paid      = (float) $paid;
        $total     = $feeStructure->total_amount;
        $remaining = max(0, $total - $paid);
        $percent   = $total > 0 ? round(($paid / $total) * 100, 1) : 0;

        return response()->json([
            'total'     => $total,
            'paid'      => $paid,
            'remaining' => $remaining,
            'percent'   => $percent,
            'structure' => [
                'id'   => $feeStructure->id,
                'name' => $feeStructure->name,
                'term' => $feeStructure->term,
            ],
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
