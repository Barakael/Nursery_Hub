<?php

namespace App\Http\Controllers;

use App\Models\FeeStructure;
use App\Http\Requests\StoreFeeStructureRequest;
use App\Http\Resources\FeeStructureResource;
use Illuminate\Http\Request;

class FeeStructureController extends Controller
{
    private function schoolId(Request $request): int
    {
        $user = $request->user();
        return $user->isAdmin()
            ? (int) ($request->query('school_id', $user->school_id))
            : (int) $user->school_id;
    }

    public function index(Request $request)
    {
        $structures = FeeStructure::with('schoolClass')
            ->where('school_id', $this->schoolId($request))
            ->orderByDesc('created_at')
            ->get();

        return FeeStructureResource::collection($structures);
    }

    public function show(FeeStructure $feeStructure)
    {
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
        $feeStructure->update($request->validated());
        return new FeeStructureResource($feeStructure->load('schoolClass'));
    }

    public function destroy(FeeStructure $feeStructure)
    {
        $feeStructure->delete();
        return response()->json(['message' => 'Fee structure deleted.']);
    }
}
