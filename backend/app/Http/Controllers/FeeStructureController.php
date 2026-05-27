<?php

namespace App\Http\Controllers;

use App\Models\FeeStructure;
use App\Http\Requests\StoreFeeStructureRequest;
use App\Http\Resources\FeeStructureResource;
use App\Models\School;
use Illuminate\Http\Request;

class FeeStructureController extends Controller
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

    public function index(Request $request)
    {
        $query = FeeStructure::with('schoolClass')
            ->where('school_id', $this->schoolId($request))
            ->orderByDesc('created_at');

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $structures = $query->get();

        return FeeStructureResource::collection($structures);
    }

    public function show(FeeStructure $feeStructure, Request $request)
    {
        $this->assertSchoolScope($feeStructure, $request);
        return new FeeStructureResource($feeStructure);
    }

    public function store(StoreFeeStructureRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $this->schoolId($request);

        $structure = FeeStructure::create($data);
        return new FeeStructureResource($structure->load('schoolClass'));
    }

    public function update(StoreFeeStructureRequest $request, FeeStructure $feeStructure)
    {
        $this->assertSchoolScope($feeStructure, $request);
        $feeStructure->update($request->validated());
        return new FeeStructureResource($feeStructure->load('schoolClass'));
    }

    public function destroy(FeeStructure $feeStructure, Request $request)
    {
        $this->assertSchoolScope($feeStructure, $request);
        $feeStructure->delete();
        return response()->json(['message' => 'Fee structure deleted.']);
    }

    private function assertSchoolScope(FeeStructure $feeStructure, Request $request): void
    {
        if ((int) $feeStructure->school_id !== $this->schoolId($request)) {
            abort(403, 'You cannot access this fee structure.');
        }
    }
}
