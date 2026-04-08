import { useState } from "react";
import {
  Package, PlusCircle, Pencil, Trash2, Download, AlertTriangle, TrendingUp,
  ShoppingCart, BarChart3, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useInventoryItems, useInventorySales, useInventorySummary,
  useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem,
  useCreateInventorySale, exportInventoryCSV,
  InventoryItem,
} from "@/hooks/useInventory";
import { useStudents } from "@/hooks/useStudents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `TSh ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ── Stockkeeper view ──────────────────────────────────────────────────────────

const StockkeeperView = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [saleOpen, setSaleOpen] = useState(false);

  const { data: salesData, isLoading: salesLoading } = useInventorySales({ page, per_page: 20 });
  const sales = salesData?.data ?? [];
  const meta  = salesData?.meta;

  // Sale form state
  const { data: itemsData } = useInventoryItems({ per_page: 100 });
  const items = itemsData?.data ?? [];
  const { data: studentsData } = useStudents({ per_page: 500 });
  const students = studentsData?.data ?? [];

  const [saleItemId, setSaleItemId]           = useState("");
  const [saleQty, setSaleQty]                 = useState("1");
  const [saleRecipientType, setSaleRecipientType] = useState<"student" | "other">("student");
  const [saleStudentId, setSaleStudentId]     = useState("");
  const [saleRecipientName, setSaleRecipientName] = useState("");
  const [saleNotes, setSaleNotes]             = useState("");

  const createSale = useCreateInventorySale();

  const resetSaleForm = () => {
    setSaleItemId(""); setSaleQty("1"); setSaleRecipientType("student");
    setSaleStudentId(""); setSaleRecipientName(""); setSaleNotes("");
  };

  const handleRecordSale = async () => {
    if (!saleItemId || !saleQty) return;
    if (saleRecipientType === "student" && !saleStudentId) {
      toast({ title: "Please select a student.", variant: "destructive" });
      return;
    }
    if (saleRecipientType === "other" && !saleRecipientName.trim()) {
      toast({ title: "Please enter a recipient name.", variant: "destructive" });
      return;
    }
    try {
      await createSale.mutateAsync({
        item_id:        Number(saleItemId),
        quantity:       Number(saleQty),
        recipient_type: saleRecipientType,
        student_id:     saleRecipientType === "student" ? Number(saleStudentId) : null,
        recipient_name: saleRecipientType === "other" ? saleRecipientName.trim() : undefined,
        notes:          saleNotes.trim() || undefined,
      });
      toast({ title: "Sale recorded successfully." });
      setSaleOpen(false);
      resetSaleForm();
    } catch (err: any) {
      toast({
        title: err?.response?.data?.message ?? "Failed to record sale.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Inventory Sales</h1>
          <p className="text-sm text-muted-foreground">Record and track item distributions</p>
        </div>
        <Button onClick={() => setSaleOpen(true)} className="shrink-0 gap-2">
          <ShoppingCart className="h-4 w-4" />
          Record Sale
        </Button>
      </div>

      {/* Sales list */}
      {salesLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Package className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">No sales recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale: any) => {
            const recipient =
              sale.recipient_type === "student"
                ? sale.student?.name ?? "Unknown Student"
                : sale.recipient_name ?? "-";
            return (
              <div
                key={sale.id}
                className="rounded-2xl bg-card shadow-soft px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{sale.item?.name ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.recipient_type === "student" ? "Student" : "Other"}: {recipient}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(sale.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">{fmt(sale.total_price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.quantity} × {fmt(sale.unit_price)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Record Sale Dialog */}
      <Dialog open={saleOpen} onOpenChange={(o) => { setSaleOpen(o); if (!o) resetSaleForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Item */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Item</label>
              <Select value={saleItemId} onValueChange={setSaleItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item: InventoryItem) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name} — {fmt(item.price)} (stock: {item.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Quantity</label>
              <Input
                type="number"
                min={1}
                value={saleQty}
                onChange={(e) => setSaleQty(e.target.value)}
                placeholder="1"
              />
            </div>

            {/* Recipient type */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Given To</label>
              <div className="flex gap-2">
                {(["student", "other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSaleRecipientType(type)}
                    className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors border ${
                      saleRecipientType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {type === "student" ? "Student" : "Other"}
                  </button>
                ))}
              </div>
            </div>

            {/* Student select */}
            {saleRecipientType === "student" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Student</label>
                <Select value={saleStudentId} onValueChange={setSaleStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                        {s.class?.name ? ` — ${s.class.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Other recipient name */}
            {saleRecipientType === "other" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Recipient Name</label>
                <Input
                  value={saleRecipientName}
                  onChange={(e) => setSaleRecipientName(e.target.value)}
                  placeholder="e.g. John Doe (visitor)"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Notes (optional)</label>
              <Input
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaleOpen(false); resetSaleForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleRecordSale} disabled={createSale.isPending}>
              {createSale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Admin / School view ───────────────────────────────────────────────────────

const AdminInventoryView = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"sales" | "items">("sales");
  const [salesPage, setSalesPage]   = useState(1);
  const [itemsPage, setItemsPage]   = useState(1);

  const { data: summaryData, isLoading: summaryLoading } = useInventorySummary();
  const { data: salesData,   isLoading: salesLoading }   = useInventorySales({ page: salesPage, per_page: 20 });
  const { data: itemsData,   isLoading: itemsLoading }   = useInventoryItems({ page: itemsPage, per_page: 20 });

  const sales = salesData?.data ?? [];
  const items = itemsData?.data ?? [];
  const salesMeta = salesData?.meta;
  const itemsMeta = itemsData?.meta;

  const createItem  = useCreateInventoryItem();
  const updateItem  = useUpdateInventoryItem();
  const deleteItem  = useDeleteInventoryItem();

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem]       = useState<InventoryItem | null>(null);
  const [itemName, setItemName]             = useState("");
  const [itemDesc, setItemDesc]             = useState("");
  const [itemPrice, setItemPrice]           = useState("");
  const [itemStock, setItemStock]           = useState("");
  const [itemThreshold, setItemThreshold]   = useState("10");

  const openAddItem = () => {
    setEditingItem(null);
    setItemName(""); setItemDesc(""); setItemPrice(""); setItemStock(""); setItemThreshold("10");
    setItemDialogOpen(true);
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description ?? "");
    setItemPrice(String(item.price));
    setItemStock(String(item.stock_quantity));
    setItemThreshold(String(item.low_stock_threshold));
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim() || !itemPrice || !itemStock) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          name: itemName.trim(),
          description: itemDesc.trim() || undefined,
          price: Number(itemPrice),
          stock_quantity: Number(itemStock),
          low_stock_threshold: Number(itemThreshold) || 10,
        });
        toast({ title: "Item updated." });
      } else {
        await createItem.mutateAsync({
          name: itemName.trim(),
          description: itemDesc.trim() || undefined,
          price: Number(itemPrice),
          stock_quantity: Number(itemStock),
          low_stock_threshold: Number(itemThreshold) || 10,
        });
        toast({ title: "Item added." });
      }
      setItemDialogOpen(false);
    } catch (err: any) {
      toast({ title: err?.response?.data?.message ?? "Failed to save item.", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast({ title: "Item deleted." });
    } catch {
      toast({ title: "Failed to delete item.", variant: "destructive" });
    }
  };

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try { await exportInventoryCSV(); }
    catch { toast({ title: "Export failed.", variant: "destructive" }); }
    finally { setExporting(false); }
  };

  const summaryCards = [
    {
      label: "Today's Revenue",
      value: fmt(summaryData?.today_revenue ?? 0),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "This Month",
      value: fmt(summaryData?.month_revenue ?? 0),
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Low Stock Items",
      value: String(summaryData?.low_stock_count ?? 0),
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Units Sold",
      value: String(summaryData?.total_items_sold ?? 0),
      icon: ShoppingCart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock management and sales overview</p>
      </div>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card shadow-soft h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-card shadow-soft px-4 py-4 flex flex-col gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="text-lg font-extrabold text-foreground leading-tight">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-2xl bg-card p-1 flex gap-1 w-fit shadow-soft">
        {(["sales", "items"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "sales" ? "Sales" : "Items"}
          </button>
        ))}
      </div>

      {/* Sales tab */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
              {exporting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
          </div>
          {salesLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Package className="h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">No sales recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Item</th>
                      <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                      <th className="px-4 py-3 text-right font-semibold">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                      <th className="px-4 py-3 text-left font-semibold">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale: any) => {
                      const recipient =
                        sale.recipient_type === "student"
                          ? sale.student?.name ?? "Unknown Student"
                          : sale.recipient_name ?? "-";
                      return (
                        <tr key={sale.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(sale.created_at)}
                          </td>
                          <td className="px-4 py-3 font-medium">{sale.item?.name ?? "-"}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground mr-1">
                              {sale.recipient_type === "student" ? "Student:" : "Other:"}
                            </span>
                            {recipient}
                          </td>
                          <td className="px-4 py-3 text-right">{sale.quantity}</td>
                          <td className="px-4 py-3 text-right">{fmt(sale.unit_price)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(sale.total_price)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{sale.recorder?.name ?? "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {salesMeta && salesMeta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={salesPage <= 1} onClick={() => setSalesPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {salesMeta.current_page} of {salesMeta.last_page}
                  </span>
                  <Button variant="outline" size="sm" disabled={salesPage >= salesMeta.last_page} onClick={() => setSalesPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Items tab */}
      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddItem} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Item
            </Button>
          </div>
          {itemsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Package className="h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">No inventory items added yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item: InventoryItem) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-card shadow-soft px-5 py-4 flex items-center gap-4"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      item.is_low_stock ? "bg-amber-50" : "bg-primary/10"
                    }`}>
                      {item.is_low_stock
                        ? <AlertTriangle className="h-5 w-5 text-amber-500" />
                        : <Package className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        {item.is_low_stock && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Stock: <span className="font-semibold">{item.stock_quantity}</span>
                        {" · "}Threshold: {item.low_stock_threshold}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">{fmt(item.price)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {itemsMeta && itemsMeta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={itemsPage <= 1} onClick={() => setItemsPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {itemsMeta.current_page} of {itemsMeta.last_page}
                  </span>
                  <Button variant="outline" size="sm" disabled={itemsPage >= itemsMeta.last_page} onClick={() => setItemsPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add / Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Item Name *</label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. School Uniform" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Description</label>
              <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Price (TSh) *</label>
                <Input
                  type="number"
                  min={0}
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Stock Quantity *</label>
                <Input
                  type="number"
                  min={0}
                  value={itemStock}
                  onChange={(e) => setItemStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Low Stock Threshold</label>
              <Input
                type="number"
                min={1}
                value={itemThreshold}
                onChange={(e) => setItemThreshold(e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">Alert when stock falls to this level or below.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={createItem.isPending || updateItem.isPending}>
              {(createItem.isPending || updateItem.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const InventoryPage = () => {
  const { user } = useAuth();

  if (user?.role === "stockkeeper") return <StockkeeperView />;
  return <AdminInventoryView />;
};

export default InventoryPage;
