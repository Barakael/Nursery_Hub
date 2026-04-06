import { useState } from "react";
import { Plus, Pencil, Trash2, User, BookOpen, DollarSign, Loader2 } from "lucide-react";
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from "@/hooks/useFeeStructures";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/useClasses";
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
import api from "@/services/api";
import type { AuthUser } from "@/contexts/AuthContext";

const TERMS = ["First", "Second", "Third"];
const YEAR = new Date().getFullYear();
const EMPTY_FEE = { name: "", amount: "", term: "First", year: String(YEAR), class_ids: [] as string[] };
const fmt = (n: number) => `TSh ${(n ?? 0).toLocaleString()}`;

// ─── Profile Tab ─────────────────────────────────────────────────────────────
const ProfileTab = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password && form.password !== form.password_confirmation) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
      };
      if (form.password) {
        payload.current_password = form.current_password;
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      const res = await api.put("/v1/auth/me", payload);
      const updated: AuthUser = res.data?.data ?? res.data;
      updateUser(updated);
      setForm((f) => ({ ...f, current_password: "", password: "", password_confirmation: "" }));
      toast({ title: "Profile updated" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</div>
      )}

      <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
        <h3 className="font-semibold text-foreground">Account Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
            <Input value={form.name} onChange={set("name")} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Email</label>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Phone</label>
            <Input value={form.phone} onChange={set("phone")} placeholder="+255 700 000 000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Role</label>
            <Input value={user?.role ?? ""} disabled className="capitalize opacity-60" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
        <h3 className="font-semibold text-foreground">Change Password <span className="text-xs font-normal text-muted-foreground">(leave blank to keep current)</span></h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
            <Input type="password" value={form.current_password} onChange={set("current_password")} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">New Password</label>
            <Input type="password" value={form.password} onChange={set("password")} placeholder="min 8 chars" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
            <Input type="password" value={form.password_confirmation} onChange={set("password_confirmation")} placeholder="repeat new password" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </form>
  );
};

// ─── Classes Tab ─────────────────────────────────────────────────────────────
const ClassesTab = () => {
  const { toast } = useToast();
  const { data: classes = [], isLoading } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; capacity: string } | null>(null);
  const [form, setForm] = useState({ name: "", capacity: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", capacity: "" }); setOpen(true); };
  const openEdit = (c: typeof classes[0]) => {
    setEditing({ id: c.id, name: c.name, capacity: "" });
    setForm({ name: c.name, capacity: "" });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await updateClass.mutateAsync({ id: editing.id, name: form.name });
        toast({ title: "Class updated" });
      } else {
        await createClass.mutateAsync({ name: form.name });
        toast({ title: "Class created" });
      }
      setOpen(false);
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete class "${name}"? This cannot be undone.`)) return;
    try {
      await deleteClass.mutateAsync(id);
      toast({ title: "Class deleted" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: msg ?? "Cannot delete class", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Classes</h3>
          <p className="text-sm text-muted-foreground">Create and manage school classes</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Class
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground rounded-2xl bg-card shadow-soft">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p>No classes yet</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.students_count ?? 0} {c.students_count === 1 ? "student" : "students"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c.id, c.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Class" : "New Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Class Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Nursery 1"
                autoFocus
              />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="e.g. 25"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createClass.isPending || updateClass.isPending}
            >
              {createClass.isPending || updateClass.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Fee Structures Tab ───────────────────────────────────────────────────────
const FeesTab = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | { id: number }>(null);
  const [form, setForm] = useState(EMPTY_FEE);

  const { data: fees = [], isLoading } = useFeeStructures();
  const { data: classes = [] } = useClasses();
  const createFee = useCreateFeeStructure();
  const updateFee = useUpdateFeeStructure();
  const deleteFee = useDeleteFeeStructure();

  const openNew = () => { setEditing(null); setForm(EMPTY_FEE); setOpen(true); };
  const openEdit = (f: typeof fees[0]) => {
    setEditing({ id: f.id });
    setForm({
      name: f.name,
      amount: String(f.total_amount ?? f.amount),
      term: f.term,
      year: f.academic_year ?? String(f.year),
      class_ids: f.class_id ? [String(f.class_id)] : ["__all__"],
    });
    setOpen(true);
  };

  const toggleClass = (id: string) => {
    setForm((f) => {
      if (id === "__all__") return { ...f, class_ids: ["__all__"] };
      const withoutAll = f.class_ids.filter((x) => x !== "__all__");
      const has = withoutAll.includes(id);
      return { ...f, class_ids: has ? withoutAll.filter((x) => x !== id) : [...withoutAll, id] };
    });
  };

  const isAllClasses = form.class_ids.length === 0 || form.class_ids.includes("__all__");

  const handleSave = async () => {
    const base = { name: form.name, total_amount: Number(form.amount), term: form.term, academic_year: form.year };
    try {
      if (editing) {
        // editing: one class only (first selected, or null for all)
        const classId = isAllClasses ? null : Number(form.class_ids[0]);
        await updateFee.mutateAsync({ id: editing.id, ...base, class_id: classId });
        toast({ title: "Fee updated" });
      } else {
        if (isAllClasses) {
          await createFee.mutateAsync({ ...base, class_id: null });
        } else {
          await Promise.all(
            form.class_ids.map((cid) => createFee.mutateAsync({ ...base, class_id: Number(cid) }))
          );
        }
        const count = isAllClasses ? 1 : form.class_ids.length;
        toast({ title: count > 1 ? `${count} fee structures created` : "Fee structure created" });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Fee Structures</h3>
          <p className="text-sm text-muted-foreground">Set fees per class, per term</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Fee
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : fees.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground rounded-2xl bg-card shadow-soft">
          <DollarSign className="h-10 w-10 opacity-30" />
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
                    <p className="text-xs text-muted-foreground">{f.term} Term · {f.academic_year ?? f.year}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      f.class_name
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {f.class_name ?? "All Classes"}
                    </span>
                  </div>
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
                </div>
                <p className="mt-2 text-xl font-bold text-foreground">{fmt(f.total_amount ?? f.amount)}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Fee Structure" : "New Fee Structure"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fee Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Term 1 School Fees"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (TSh) *</label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 120000"
              />
            </div>

            {/* Class multi-select chips */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Apply to {!editing && "("}Class{!editing && "es)"} *
              </label>
              <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-background p-2.5">
                {/* All Classes chip */}
                <button
                  type="button"
                  onClick={() => toggleClass("__all__")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    isAllClasses
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-accent text-accent-foreground hover:bg-accent/80"
                  }`}
                >
                  All Classes
                </button>
                {/* Class chips */}
                {classes.map((c) => {
                  const active = form.class_ids.includes(String(c.id));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleClass(String(c.id))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-accent text-accent-foreground hover:bg-accent/80"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {!editing && !isAllClasses && form.class_ids.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {form.class_ids.length} separate fee structures will be created
                </p>
              )}
              {editing && !isAllClasses && form.class_ids.length > 1 && (
                <p className="text-xs text-amber-600">
                  When editing, only the first selected class applies
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Term</label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
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

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "profile" | "classes" | "fees";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "classes", label: "Classes", icon: BookOpen },
  { id: "fees", label: "Fee Structures", icon: DollarSign },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const isSchoolOrAdmin = user?.role === "admin" || user?.role === "school";
  const [tab, setTab] = useState<Tab>("profile");

  const visibleTabs = isSchoolOrAdmin ? TABS : TABS.filter((t) => t.id === "profile");

  return (
    <div className="animate-fade-in space-y-5">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-2xl bg-card p-1.5 shadow-soft">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              tab === id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "classes" && isSchoolOrAdmin && <ClassesTab />}
      {tab === "fees" && isSchoolOrAdmin && <FeesTab />}
    </div>
  );
};

export default SettingsPage;

