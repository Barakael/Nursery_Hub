import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchools } from "@/hooks/useSchools";
import { useStudents } from "@/hooks/useStudents";
import { usePayments, useStudentBalance, useStudentPayments, useRecordPayment } from "@/hooks/usePayments";
import { useFeeStructureReport, useOverviewReport } from "@/hooks/useReports";
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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: schools = [] } = useSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(user?.school_id);
  const effectiveSchoolId = isAdmin ? selectedSchoolId : undefined;

  const [activeTab, setActiveTab] = useState<"general" | number>("general");

  const { data: overview } = useOverviewReport({
    school_id: effectiveSchoolId,
    fee_structure_id: activeTab === "general" ? undefined : activeTab,
  });
  const { data: structureReport } = useFeeStructureReport(
    activeTab === "general" ? undefined : activeTab,
    { school_id: effectiveSchoolId }
  );
  const { data: payments = [], isLoading } = usePayments({
    school_id: effectiveSchoolId,
    fee_structure_id: activeTab === "general" ? undefined : activeTab,
  });
  const { data: studentsData } = useStudents(
    effectiveSchoolId ? { school_id: effectiveSchoolId } : undefined
  );
  const { data: feeStructures = [] } = useFeeStructures({
    school_id: effectiveSchoolId,
    is_active: true,
  });
  const recordPayment = useRecordPayment();

  const [lookupId, setLookupId] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const { data: lookupBalance } = useStudentBalance(Number(lookupId) || 0, { school_id: effectiveSchoolId });
  const { data: lookupPayments = [] } = useStudentPayments(Number(lookupId) || 0, { school_id: effectiveSchoolId });

  const classSummary = useMemo(() => {
    if (!overview?.students?.length) return [];
    const map: Record<string, {
      class_name: string; count: number;
      total: number; paid: number; remaining: number;
      paid_full: number; partial: number; unpaid: number;
    }> = {};
    overview.students.forEach((s) => {
      if (!map[s.class_name]) map[s.class_name] = { class_name: s.class_name, count: 0, total: 0, paid: 0, remaining: 0, paid_full: 0, partial: 0, unpaid: 0 };
      const m = map[s.class_name];
      m.count++; m.total += s.total_fees; m.paid += s.total_paid; m.remaining += s.remaining;
      if (s.total_paid >= s.total_fees - 0.01) m.paid_full++;
      else if (s.total_paid <= 0) m.unpaid++;
      else m.partial++;
    });
    return Object.values(map).sort((a, b) => a.class_name.localeCompare(b.class_name));
  }, [overview?.students]);

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

  const students = (studentsData?.data ?? []).filter((s) => {
    if (!effectiveSchoolId) return true;
    return s.school_id === effectiveSchoolId;
  });

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

  const collected = structureReport?.total_collected ?? overview?.total_collected ?? 0;
  const totalFees = structureReport?.total_fees ?? overview?.total_fees ?? 0;
  const pct = structureReport?.collection_percent ?? overview?.collection_percent ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      {isAdmin && (
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">School</label>
          <Select
            value={selectedSchoolId ? String(selectedSchoolId) : ""}
            onValueChange={(v) => {
              setSelectedSchoolId(Number(v));
              setActiveTab("general");
            }}
          >
            <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.id} value={String(school.id)}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-card p-1.5 shadow-soft">
        <button
          onClick={() => setActiveTab("general")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "general"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          General
        </button>
        {feeStructures.map((fs) => (
          <button
            key={fs.id}
            onClick={() => setActiveTab(fs.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === fs.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {fs.name}
          </button>
        ))}
      </div>

      {/* Summary Banner */}
      <div className="rounded-2xl bg-primary p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">Total Fee Collection</p>
            <p className="text-3xl font-extrabold text-primary-foreground">{fmt(collected)}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/60">
              of {fmt(totalFees)} target {activeTab === "general" ? "(all structures)" : "(selected structure)"}
            </p>
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

      {/* Student Payment Lookup */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Student Payment Lookup</h3>
        <div className="relative">
          <input
            type="text"
            value={lookupSearch}
            onChange={(e) => {
              setLookupSearch(e.target.value);
              setLookupId("");
              setLookupOpen(true);
            }}
            onFocus={() => setLookupOpen(true)}
            placeholder="Type a student name…"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {lookupOpen && lookupSearch.length > 0 && (() => {
            const matches = students.filter((s) =>
              s.name.toLowerCase().includes(lookupSearch.toLowerCase())
            );
            return matches.length > 0 ? (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {matches.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => {
                      setLookupId(String(s.id));
                      setLookupSearch(s.name + (s.class?.name ? ` — ${s.class.name}` : ""));
                      setLookupOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent transition-colors"
                  >
                    <span className="font-semibold text-card-foreground">{s.name}</span>
                    {s.class?.name && <span className="ml-2 text-xs text-muted-foreground">{s.class.name}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
                No students found.
              </div>
            );
          })()}
        </div>

        {lookupId && lookupBalance && (
          <div className="mt-4 space-y-3">
            {/* Balance card */}
            <div className="rounded-xl bg-primary p-4 text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium opacity-70">Total Fees</p>
                  <p className="text-2xl font-extrabold">{fmt(lookupBalance.total ?? 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium opacity-70">Balance Due</p>
                  <p className="text-lg font-bold">{fmt(lookupBalance.remaining ?? 0)}</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all"
                  style={{ width: `${Math.min(lookupBalance.percent ?? 0, 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs opacity-70">
                <span>Paid: {fmt(lookupBalance.paid ?? 0)}</span>
                <span>{lookupBalance.percent ?? 0}%</span>
              </div>
            </div>

            {/* Per-Fee-Structure Breakdown */}
            {(lookupBalance.structures?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fee Breakdown</p>
                {lookupBalance.structures!.map((fs) => (
                  <div key={fs.id} className="rounded-xl bg-accent/50 px-4 py-2.5 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">{fs.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {[fs.term, fs.academic_year].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-card-foreground">{fmt(fs.total)}</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(fs.percent, 100)}%`,
                          backgroundColor: fs.percent >= 100 ? "#15803d" : fs.percent > 0 ? "#ca8a04" : "#020884",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Paid: <span className="font-semibold" style={{ color: "#15803d" }}>{fmt(fs.paid)}</span></span>
                      <span className="text-muted-foreground">Due: <span className="font-semibold text-destructive">{fmt(fs.remaining)}</span></span>
                      <span className="font-semibold text-muted-foreground">{fs.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment history */}
            {lookupPayments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment History</p>
                {lookupPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{fmt(p.amount_paid)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.fee_structure?.name ? <span className="font-medium">{p.fee_structure.name} · </span> : null}
                        {methodLabel[p.method ?? ""] ?? p.method ?? "—"}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.payment_date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-sm text-muted-foreground">No payments for this student yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats — 3 columns with brand colors */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 text-center shadow-soft" style={{ backgroundColor: "rgba(21,128,61,0.1)" }}>
          <p className="text-2xl font-extrabold" style={{ color: "#15803d" }}>{overview?.paid_full ?? 0}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#15803d" }}>Fully Paid</p>
        </div>
        <div className="rounded-2xl p-4 text-center shadow-soft" style={{ backgroundColor: "rgba(239,200,58,0.15)" }}>
          <p className="text-2xl font-extrabold" style={{ color: "#ca8a04" }}>{overview?.paid_partial ?? 0}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#ca8a04" }}>Part Paid</p>
        </div>
        <div className="rounded-2xl p-4 text-center shadow-soft" style={{ backgroundColor: "rgba(2,8,132,0.1)" }}>
          <p className="text-2xl font-extrabold" style={{ color: "#020884" }}>{overview?.unpaid ?? 0}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#020884" }}>Not Paid</p>
        </div>
      </div>

      {/* General page shows class summary, structure tabs show student rows */}
      {activeTab === "general" ? (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">Class Finance Summary</h3>
          {classSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No class data yet.</p>
          ) : (
            <div className="space-y-3">
              {classSummary.map((row) => (
                <div key={row.class_name} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-card-foreground">{row.class_name}</p>
                    <p className="text-xs text-muted-foreground">{row.count} students</p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>Expected: <span className="font-semibold">{fmt(row.total)}</span></div>
                    <div>Collected: <span className="font-semibold">{fmt(row.paid)}</span></div>
                    <div>Pending: <span className="font-semibold">{fmt(row.remaining)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-4 font-bold text-card-foreground">
            {structureReport?.fee_structure.name ?? "Fee structure"} Report
          </h3>
          {!structureReport ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {structureReport.students.map((student) => (
                <div key={student.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-card-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.class_name}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p>Paid: <span className="font-semibold">{fmt(student.total_paid)}</span></p>
                      <p>Due: <span className="font-semibold">{fmt(student.remaining)}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                      {p.fee_structure?.name ? <span className="font-medium">{p.fee_structure.name} · </span> : null}
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
              <Select value={form.student_id} onValueChange={(v) => setForm((f) => ({ ...f, student_id: v, fee_structure_id: "" }))}>
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
                  {feeStructures
                    .filter((f) => {
                      const selectedStudent = students.find((s) => String(s.id) === form.student_id);
                      if (!selectedStudent) return true;
                      return !f.class_id || f.class_id === selectedStudent.class_id;
                    })
                    .map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      <div className="flex flex-col">
                        <span>{f.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {[f.term, f.academic_year, f.class_name].filter(Boolean).join(" · ")}
                          {" — "}
                          {fmt(f.total_amount)}
                          {typeof f.collected === "number" ? ` (collected: ${fmt(f.collected)})` : ""}
                        </span>
                      </div>
                    </SelectItem>
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
  const { user } = useAuth();
  const children = user?.children ?? [];
  const [selectedChildId, setSelectedChildId] = useState<number>(children[0]?.id ?? 0);
  const child = children.find((c) => c.id === selectedChildId) ?? children[0];

  const { data: balance } = useStudentBalance(child?.id ?? 0);
  const { data: payments = [] } = useStudentPayments(child?.id ?? 0);

  const totalFee = balance?.total ?? 0;
  const totalPaid = balance?.paid ?? 0;
  const remaining = balance?.remaining ?? 0;
  const percent = balance?.percent ?? 0;

  if (!child) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground animate-fade-in">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p>No student data available</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Child selector */}
      {children.length > 1 && (
        <div className="rounded-2xl bg-card p-4 shadow-card space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Select Child</label>
          <Select value={String(selectedChildId)} onValueChange={(v) => setSelectedChildId(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-2xl bg-primary p-5 shadow-card">
        <p className="text-sm font-medium text-primary-foreground/70">
          {child.name} — Total Fees
        </p>
        <p className="text-3xl font-extrabold text-primary-foreground">{fmt(totalFee)}</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-primary-foreground/70">
          <span>Paid: {fmt(totalPaid)}</span>
          <span>{percent}% Complete</span>
        </div>
      </div>

      {/* Per-Fee-Structure Breakdown */}
      {(balance?.structures?.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-3 font-bold text-card-foreground">Fee Breakdown</h3>
          <div className="space-y-3">
            {balance!.structures!.map((fs) => {
              const pctFs = fs.percent ?? 0;
              return (
                <div key={fs.id} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{fs.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {[fs.term, fs.academic_year].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-card-foreground">{fmt(fs.total)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pctFs, 100)}%`,
                        backgroundColor: pctFs >= 100 ? "#15803d" : pctFs > 0 ? "#ca8a04" : "#020884",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Paid: <span className="font-semibold" style={{ color: "#15803d" }}>{fmt(fs.paid)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Due: <span className="font-semibold text-destructive">{fmt(fs.remaining)}</span>
                    </span>
                    <span className="font-semibold text-muted-foreground">{pctFs}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                      {p.fee_structure?.name ? <span className="font-medium">{p.fee_structure.name} · </span> : null}
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
