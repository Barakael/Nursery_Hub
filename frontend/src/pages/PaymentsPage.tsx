import { useState } from "react";
import { CheckCircle, AlertCircle, PlusCircle, Loader2, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { usePayments, useStudentBalance, useStudentPayments, useRecordPayment } from "@/hooks/usePayments";
import { useOverviewReport } from "@/hooks/useReports";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const fmt = (n: number) => `TSh ${(n ?? 0).toLocaleString()}`;

const methodLabel: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  mobile_money: "Mobile Money",
  cheque: "Cheque",
};

// ── Admin / School Manager view ──────────────────────────────────────────────
const StaffFinanceView = () => {
  const { data: overview } = useOverviewReport();
  const { data: payments = [], isLoading } = usePayments();
  const { data: studentsData } = useStudents();
  const { data: feeStructures = [] } = useFeeStructures();
  const recordPayment = useRecordPayment();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    fee_structure_id: "",
    amount_paid: "",
    payment_date: new Date().toISOString().slice(0, 10),
    method: "cash",
    reference: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  const students = studentsData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.student_id || !form.fee_structure_id || !form.amount_paid) {
      setFormError("Student, fee structure and amount are required.");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        student_id: Number(form.student_id),
        fee_structure_id: Number(form.fee_structure_id),
        amount_paid: Number(form.amount_paid),
        payment_date: form.payment_date,
        method: form.method || undefined,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      setOpen(false);
      setForm({ student_id: "", fee_structure_id: "", amount_paid: "", payment_date: new Date().toISOString().slice(0, 10), method: "cash", reference: "", notes: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? "Failed to record payment.");
    }
  };

  const collected = overview?.total_collected ?? 0;
  const totalFees = overview?.total_fees ?? 0;
  const pct = overview?.collection_percent ?? 0;
  const pending = totalFees - collected;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Banner */}
      <div className="rounded-2xl bg-primary p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">Total Fee Collection</p>
            <p className="text-3xl font-extrabold text-primary-foreground">{fmt(collected)}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/60">of {fmt(totalFees)} target</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary-foreground/15 px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/25 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Record
          </button>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-primary-foreground/60">{pct}% collected</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <p className="text-xs text-muted-foreground">Fully Paid</p>
          <p className="text-2xl font-extrabold text-success">{overview?.paid_full ?? 0}</p>
          <p className="text-xs text-muted-foreground">students</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <p className="text-xs text-muted-foreground">Part Paid</p>
          <p className="text-2xl font-extrabold text-warning">{overview?.paid_partial ?? 0}</p>
          <p className="text-xs text-muted-foreground">students</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <p className="text-xs text-muted-foreground">Not Paid</p>
          <p className="text-2xl font-extrabold text-destructive">{overview?.unpaid ?? 0}</p>
          <p className="text-xs text-muted-foreground">students</p>
        </div>
      </div>

      {/* Balance row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-success/10 p-4 shadow-soft">
          <CheckCircle className="mb-1 h-5 w-5 text-success" />
          <p className="text-lg font-bold text-success">{fmt(collected)}</p>
          <p className="text-xs text-muted-foreground">Collected</p>
        </div>
        <div className="rounded-2xl bg-destructive/10 p-4 shadow-soft">
          <AlertCircle className="mb-1 h-5 w-5 text-destructive" />
          <p className="text-lg font-bold text-destructive">{fmt(pending)}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-4 font-bold text-card-foreground">Recent Payments</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{p.student?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {methodLabel[p.method ?? ""] ?? p.method ?? "—"}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-card-foreground">{fmt(p.amount_paid)}</p>
                  <p className="text-xs text-muted-foreground">{p.payment_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            {formError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Student *</label>
              <Select value={form.student_id} onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student…" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Fee Structure *</label>
              <Select value={form.fee_structure_id} onValueChange={(v) => setForm((f) => ({ ...f, fee_structure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select fee structure…" /></SelectTrigger>
                <SelectContent>
                  {feeStructures.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Amount (TSh) *</label>
              <input
                type="number" min="1" value={form.amount_paid}
                onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))}
                placeholder="e.g. 50000"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Payment Date *</label>
              <input
                type="date" value={form.payment_date}
                onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Method</label>
              <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(methodLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Reference</label>
              <input
                type="text" value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="e.g. REC-001"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-input px-4 py-2 text-sm font-semibold hover:bg-accent">Cancel</button>
              <button
                type="submit"
                disabled={recordPayment.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {recordPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Parent view ──────────────────────────────────────────────────────────────
const ParentFinanceView = () => {
  const { data: studentsData } = useStudents();
  const students = studentsData?.data ?? [];
  const firstStudent = students[0];

  const { data: balance } = useStudentBalance(firstStudent?.id ?? 0);
  const { data: payments = [] } = useStudentPayments(firstStudent?.id ?? 0);

  const totalFee = balance?.total ?? 0;
  const totalPaid = balance?.paid ?? 0;
  const remaining = balance?.remaining ?? 0;
  const percent = balance?.percent ?? 0;

  if (!firstStudent) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground animate-fade-in">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p>No student data available</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-2xl bg-primary p-5 shadow-card">
        <p className="text-sm font-medium text-primary-foreground/70">
          {firstStudent.name} — Total Fees
        </p>
        <p className="text-3xl font-extrabold text-primary-foreground">{fmt(totalFee)}</p>
        {balance?.structure && (
          <p className="mt-0.5 text-xs text-primary-foreground/60">{balance.structure.name}</p>
        )}
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-primary-foreground/70">
          <span>Paid: {fmt(totalPaid)}</span>
          <span>{percent}% Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <CheckCircle className="mx-auto mb-1 h-6 w-6 text-success" />
          <p className="text-lg font-bold text-success">{fmt(totalPaid)}</p>
          <p className="text-xs text-muted-foreground">Amount Paid</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft text-center">
          <AlertCircle className="mx-auto mb-1 h-6 w-6 text-destructive" />
          <p className="text-lg font-bold text-destructive">{fmt(remaining)}</p>
          <p className="text-xs text-muted-foreground">Balance Due</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Payment History</h3>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{fmt(p.amount_paid)}</p>
                    <p className="text-xs text-muted-foreground">
                      {methodLabel[p.method ?? ""] ?? p.method ?? "—"}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{p.payment_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page entry point ─────────────────────────────────────────────────────────
const PaymentsPage = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "school";
  return isStaff ? <StaffFinanceView /> : <ParentFinanceView />;
};

export default PaymentsPage;
