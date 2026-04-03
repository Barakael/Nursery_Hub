import { useState } from "react";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from "@/hooks/useFeeStructures";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const TERMS = ["First", "Second", "Third"];
const YEAR = new Date().getFullYear();
const EMPTY = { name: "", amount: "", term: "First", year: String(YEAR) };

const fmt = (n: number) => `₦${n?.toLocaleString() ?? 0}`;

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | { id: number } & typeof EMPTY>(null);
  const [form, setForm] = useState(EMPTY);

  const { data: fees = [], isLoading } = useFeeStructures();
  const createFee = useCreateFeeStructure();
  const updateFee = useUpdateFeeStructure();
  const deleteFee = useDeleteFeeStructure();

  const canManage = user?.role === "admin" || user?.role === "school";

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (f: typeof fees[0]) => {
    setEditing({ id: f.id, ...EMPTY });
    setForm({ name: f.name, amount: String(f.amount), term: f.term, year: String(f.year) });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, amount: Number(form.amount), year: Number(form.year) };
    try {
      if (editing) {
        await updateFee.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Fee updated" });
      } else {
        await createFee.mutateAsync(payload);
        toast({ title: "Fee structure created" });
      }
      setOpen(false);
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this fee structure?")) return;
    await deleteFee.mutateAsync(id);
    toast({ title: "Fee structure deleted" });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      {/* Fee Structures Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Fee Structures</h2>
            <p className="text-sm text-muted-foreground">Manage school fees by term</p>
          </div>
          {canManage && (
            <Button size="sm" onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Fee
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : fees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground rounded-2xl bg-card shadow-soft">
            <Settings className="h-10 w-10 opacity-30" />
            <p>No fee structures yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fees.map((f) => {
              const pct = f.collection_percent ?? 0;
              return (
                <div key={f.id} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.term} Term · {f.year}</p>
                    </div>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(f.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xl font-bold text-foreground">{fmt(f.amount)}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Collected: {fmt(f.collected ?? 0)}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Fee Structure" : "New Fee Structure"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fee Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tuition Fee"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Amount (₦) *</label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 120000"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Term</label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.amount || createFee.isPending || updateFee.isPending}
            >
              {createFee.isPending || updateFee.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
