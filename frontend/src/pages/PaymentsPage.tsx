import { useState, useMemo } from "react";
import { CheckCircle, AlertCircle, PlusCircle, Loader2, Download, FileSpreadsheet, FileText, X } from "lucide-react";
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

  const [lookupId, setLookupId] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const { data: lookupBalance } = useStudentBalance(Number(lookupId) || 0);
  const { data: lookupPayments = [] } = useStudentPayments(Number(lookupId) || 0);

  const [showDownload, setShowDownload] = useState(false);

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

  const downloadCSV = () => {
    if (!overview?.students?.length) return;
    // Group students by class, sorted alphabetically
    const groups: Record<string, typeof overview.students> = {};
    overview.students.forEach((s) => {
      if (!groups[s.class_name]) groups[s.class_name] = [];
      groups[s.class_name].push(s);
    });
    const header = ["Name", "Class", "Total Fees (TSh)", "Paid (TSh)", "Pending (TSh)"];
    const lines: string[] = [header.join(",")];
    Object.keys(groups).sort().forEach((className) => {
      lines.push(""); // blank separator
      lines.push(`"── ${className} ──","","","",""`);
      groups[className].forEach((s) => {
        lines.push([`"${s.name}"`, `"${s.class_name}"`, s.total_fees, s.total_paid, s.remaining].join(","));
      });
      // Class subtotal
      const total = groups[className].reduce((acc, s) => acc + s.total_fees, 0);
      const paid  = groups[className].reduce((acc, s) => acc + s.total_paid, 0);
      const rem   = groups[className].reduce((acc, s) => acc + s.remaining, 0);
      lines.push([`"Subtotal (${className})"`, `""`, total, paid, rem].join(","));
    });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" })),
      download: "student-payments-by-class.csv",
    });
    a.click();
    setShowDownload(false);
  };

  const downloadPDF = () => {
    if (!overview?.students?.length) return;
    // Group students by class, sorted alphabetically
    const groups: Record<string, typeof overview.students> = {};
    overview.students.forEach((s) => {
      if (!groups[s.class_name]) groups[s.class_name] = [];
      groups[s.class_name].push(s);
    });
    const classTables = Object.keys(groups).sort().map((className) => {
      const classStudents = groups[className];
      const total = classStudents.reduce((acc, s) => acc + s.total_fees, 0);
      const paid  = classStudents.reduce((acc, s) => acc + s.total_paid, 0);
      const rem   = classStudents.reduce((acc, s) => acc + s.remaining, 0);
      const studentRows = classStudents
        .map((s) => `<tr><td>${s.name}</td><td>TSh ${s.total_fees.toLocaleString()}</td><td>TSh ${s.total_paid.toLocaleString()}</td><td>TSh ${s.remaining.toLocaleString()}</td></tr>`)
        .join("");
      return `
        <div class="class-section">
          <h2>${className}</h2>
          <table>
            <thead><tr><th>Name</th><th>Total Fees</th><th>Paid</th><th>Pending</th></tr></thead>
            <tbody>
              ${studentRows}
              <tr class="subtotal">
                <td><strong>Subtotal</strong></td>
                <td><strong>TSh ${total.toLocaleString()}</strong></td>
                <td><strong>TSh ${paid.toLocaleString()}</strong></td>
                <td><strong>TSh ${rem.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>`;
    }).join("");
    const html = `<html><head><title>Student Payments by Class</title><style>
      body{font-family:sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin-bottom:4px}
      .subtitle{font-size:11px;color:#666;margin-bottom:20px}
      .class-section{margin-bottom:28px;page-break-inside:avoid}
      h2{font-size:13px;font-weight:700;margin:0 0 6px;padding:6px 10px;background:#f0f4ff;border-left:4px solid #020884;border-radius:4px}
      table{border-collapse:collapse;width:100%;margin-bottom:4px}
      th,td{border:1px solid #ddd;padding:6px 10px;font-size:11px;text-align:left}
      th{background:#f5f5f5;font-weight:600}
      tr:nth-child(even){background:#fafafa}
      tr.subtotal td{background:#f0f4ff;font-size:11px}
      @media print{.class-section{page-break-inside:avoid}}
    </style></head><body>
      <h1>Student Payment Report</h1>
      <p class="subtitle">Generated ${new Date().toLocaleDateString()} &mdash; ${overview.students.length} students</p>
      ${classTables}
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
    setShowDownload(false);
  };

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
                  {lookupBalance.structure && (
                    <p className="text-xs opacity-60 mt-0.5">{lookupBalance.structure.name}</p>
                  )}
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

            {/* Payment history */}
            {lookupPayments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment History</p>
                {lookupPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{fmt(p.amount_paid)}</p>
                      <p className="text-xs text-muted-foreground">
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

  

      {/* Class Payment Summary */}
      <div className="hidden md:block rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-4 font-bold text-card-foreground">Summary by Class</h3>
        {!classSummary.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No fee data available.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {classSummary.map((c) => {
              const pct = c.total > 0 ? Math.round((c.paid / c.total) * 100) : 0;
              return (
                <div key={c.class_name} className="rounded-2xl border border-border p-3 flex flex-col gap-2">
                  <div>
                    <p className="text-sm font-bold text-card-foreground truncate">{c.class_name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.count} student{c.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: "#15803d" }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{pct}%</p>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(21,128,61,0.1)" }}>
                      <p className="text-xs font-extrabold" style={{ color: "#15803d" }}>{c.paid_full}</p>
                      <p className="text-[9px] text-muted-foreground">Paid</p>
                    </div>
                    <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(239,200,58,0.15)" }}>
                      <p className="text-xs font-extrabold" style={{ color: "#ca8a04" }}>{c.partial}</p>
                      <p className="text-[9px] text-muted-foreground">Part</p>
                    </div>
                    <div className="rounded-lg py-1.5" style={{ backgroundColor: "rgba(2,8,132,0.1)" }}>
                      <p className="text-xs font-extrabold" style={{ color: "#020884" }}>{c.unpaid}</p>
                      <p className="text-[9px] text-muted-foreground">None</p>
                    </div>
                  </div>
                  <div className="text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collected</span>
                      <span className="font-semibold" style={{ color: "#15803d" }}>{fmt(c.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-destructive">{fmt(c.remaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* ── Floating Download FAB ── */}
      {overview?.students?.length ? (
        <div className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-8 flex flex-col items-end gap-2">
          {showDownload && (
            <div className="flex flex-col gap-2 mb-1">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-2.5 text-sm font-semibold shadow-lg hover:bg-accent transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" style={{ color: "#15803d" }} />
                Excel (.csv)
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-2.5 text-sm font-semibold shadow-lg hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4" style={{ color: "#020884" }} />
                PDF (print)
              </button>
            </div>
          )}
          <button
            onClick={() => setShowDownload((v) => !v)}
            className="flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity p-3.5"
            title="Download student payments"
          >
            {showDownload ? <X className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </button>
        </div>
      ) : null}
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
