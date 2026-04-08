<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventorySale;
use App\Http\Requests\StoreInventorySaleRequest;
use App\Http\Resources\InventorySaleResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\School;

class InventorySaleController extends Controller
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

        $query = InventorySale::with(['item', 'student', 'recorder'])
            ->where('school_id', $schoolId)
            ->orderByDesc('created_at');

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->integer('item_id'));
        }

        return InventorySaleResource::collection(
            $query->paginate($request->integer('per_page', 20))
        );
    }

    public function store(StoreInventorySaleRequest $request)
    {
        $data     = $request->validated();
        $schoolId = $this->schoolId($request);

        return DB::transaction(function () use ($data, $schoolId, $request) {
            $item = InventoryItem::where('id', $data['item_id'])
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($item->stock_quantity < $data['quantity']) {
                abort(422, "Insufficient stock. Available: {$item->stock_quantity}");
            }

            $item->decrement('stock_quantity', $data['quantity']);

            $sale = InventorySale::create([
                'school_id'      => $schoolId,
                'item_id'        => $item->id,
                'quantity'       => $data['quantity'],
                'unit_price'     => $item->price,
                'recipient_type' => $data['recipient_type'],
                'student_id'     => $data['student_id'] ?? null,
                'recipient_name' => $data['recipient_name'] ?? null,
                'recorded_by'    => $request->user()->id,
                'notes'          => $data['notes'] ?? null,
            ]);

            return new InventorySaleResource($sale->load('item', 'student', 'recorder'));
        });
    }

    public function summary(Request $request)
    {
        $schoolId = $this->schoolId($request);

        $todayRevenue = InventorySale::where('school_id', $schoolId)
            ->whereDate('created_at', today())
            ->get()
            ->sum(fn ($s) => $s->total_price);

        $monthRevenue = InventorySale::where('school_id', $schoolId)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->get()
            ->sum(fn ($s) => $s->total_price);

        $lowStockCount = InventoryItem::where('school_id', $schoolId)
            ->lowStock()
            ->count();

        $totalItemsSold = InventorySale::where('school_id', $schoolId)
            ->sum('quantity');

        return response()->json([
            'today_revenue'    => round($todayRevenue, 2),
            'month_revenue'    => round($monthRevenue, 2),
            'low_stock_count'  => $lowStockCount,
            'total_items_sold' => (int) $totalItemsSold,
        ]);
    }

    public function export(Request $request)
    {
        $schoolId = $this->schoolId($request);

        $sales = InventorySale::with(['item', 'student', 'recorder'])
            ->where('school_id', $schoolId)
            ->orderByDesc('created_at')
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="inventory_sales.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($sales) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Item', 'Quantity', 'Unit Price', 'Total', 'Recipient Type', 'Recipient', 'Recorded By', 'Notes']);

            foreach ($sales as $sale) {
                $recipient = $sale->recipient_type === 'student'
                    ? ($sale->student?->name ?? 'Unknown Student')
                    : ($sale->recipient_name ?? '-');

                fputcsv($handle, [
                    $sale->created_at?->toDateTimeString(),
                    $sale->item?->name ?? '-',
                    $sale->quantity,
                    number_format($sale->unit_price, 2),
                    number_format($sale->total_price, 2),
                    ucfirst($sale->recipient_type),
                    $recipient,
                    $sale->recorder?->name ?? '-',
                    $sale->notes ?? '',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
