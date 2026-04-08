<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Http\Requests\StoreInventoryItemRequest;
use App\Http\Requests\UpdateInventoryItemRequest;
use App\Http\Resources\InventoryItemResource;
use Illuminate\Http\Request;
use App\Models\School;

class InventoryItemController extends Controller
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
        $schoolId = $this->schoolId($request);

        $query = InventoryItem::where('school_id', $schoolId)
            ->orderBy('name');

        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        return InventoryItemResource::collection(
            $query->paginate($request->integer('per_page', 50))
        );
    }

    public function store(StoreInventoryItemRequest $request)
    {
        $data              = $request->validated();
        $data['school_id'] = $this->schoolId($request);

        $item = InventoryItem::create($data);
        return new InventoryItemResource($item);
    }

    public function update(UpdateInventoryItemRequest $request, InventoryItem $item)
    {
        $item->update($request->validated());
        return new InventoryItemResource($item);
    }

    public function destroy(InventoryItem $item)
    {
        $item->delete();
        return response()->json(['message' => 'Item deleted.']);
    }
}
