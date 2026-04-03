import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { useOverviewReport, useClassReport } from "@/hooks/useReports";
import { useClasses } from "@/hooks/useClasses";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, GraduationCap, TrendingUp, Wallet, Download, FileSpreadsheet, FileText, X } from "lucide-react";

const COLORS = [
  "#020884ef", // blue
  "#efc83a", // yellow
  "#15803d", // dark green
  "#f97316", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#ef4444", // red
  "#a16207", // amber-dark
];

const fmt = (n: number) => `TSh ${(n ?? 0).toLocaleString()}`;

const StatCard = ({
  icon: Icon, label, value, sub, color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <div className="rounded-xl md:rounded-2xl bg-card p-3 md:p-4 shadow-card">
    <div className="hidden md:flex items-start justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
    <p className="mt-0 md:mt-3 text-xl md:text-2xl font-extrabold text-foreground leading-tight">{value}</p>
    <p className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">{label}</p>
    {sub && <p className="mt-0.5 text-[10px] md:text-xs text-muted-foreground">{sub}</p>}
  </div>
);

const ReportsPage = () => {
  const [view, setView] = useState<"overview" | "class" | "payments">("overview");
  const [classId, setClassId] = useState("");
  const [showDownload, setShowDownload] = useState(false);

  const { data: overview, isLoading: loadingOverview } = useOverviewReport();
  const { data: classes = [] } = useClasses();

  const { data: classReport, isLoading: loadingClass } = useClassReport(Number(classId));

  // Build per-class payment summary from overview.students
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

  const pieData = overview
    ? [
        { name: "Collected", value: overview.total_collected },
        { name: "Pending", value: overview.total_fees - overview.total_collected },
      ]
    : [];

  const downloadCSV = () => {
    if (!overview?.students?.length) return;
    const header = ["Name", "Class", "Total Fees (TSh)", "Paid (TSh)", "Pending (TSh)"];
    const rows = overview.students.map((s) => [
      `"${s.name}"`, `"${s.class_name}"`, s.total_fees, s.total_paid, s.remaining,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: "student-payments.csv",
    });
    a.click();
    setShowDownload(false);
  };

  const downloadPDF = () => {
    if (!overview?.students?.length) return;
    const rows = overview.students
      .map((s) => `<tr><td>${s.name}</td><td>${s.class_name}</td><td>TSh ${s.total_fees.toLocaleString()}</td><td>TSh ${s.total_paid.toLocaleString()}</td><td>TSh ${s.remaining.toLocaleString()}</td></tr>`)
      .join("");
    const html = `<html><head><title>Student Payments</title><style>
      body{font-family:sans-serif;padding:24px}h1{font-size:16px;margin-bottom:12px}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:7px 10px;font-size:12px;text-align:left}
      th{background:#f0f0f0;font-weight:600}tr:nth-child(even){background:#fafafa}
    </style></head><body>
      <h1>Student Payment Report</h1>
      <table><thead><tr><th>Name</th><th>Class</th><th>Total Fees</th><th>Paid</th><th>Pending</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
    setShowDownload(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* View Switcher */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <div className="mt-3 flex gap-1 rounded-2xl bg-card p-1.5 shadow-soft">
          {(["overview", "class", "payments"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all capitalize ${
                view === v
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "payments" ? "Payments" : v}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {view === "overview" && (
        <>
          {loadingOverview ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard icon={Users} label="Total Students" value={overview.total_students} />
                <StatCard icon={Wallet} label="Collection" value={`${overview.collection_percent ?? 0}%`} sub={fmt(overview.total_collected)} color="text-success" />
                <div className="hidden lg:block">
                  <StatCard icon={GraduationCap} label="Classes" value={overview.total_classes} />
                </div>
                <div className="hidden lg:block">
                  <StatCard icon={TrendingUp} label="Teachers" value={overview.total_teachers} />
                </div>
              </div>

              {/* ── Enrollment by Class + Fee Collection (side by side) ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Enrolled Students by Class */}
              {(overview.enrollment_by_class?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Enrolled Students by Class</h3>
                  <div className="mx-auto max-w-xs">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={overview.enrollment_by_class}
                      margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <XAxis dataKey="class_name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="student_count" name="Students" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {overview.enrollment_by_class.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {overview.enrollment_by_class.map((c, i) => (
                      <span
                        key={c.class_name}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      >
                        {c.class_name}: {c.student_count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fee Collection */}
              {overview.total_fees > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Fee Collection</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#15803d" : "#eab308"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#15803d1a" }}>
                      <p className="text-xs text-muted-foreground">Collected</p>
                      <p className="text-lg font-bold" style={{ color: "#15803d" }}>{fmt(overview.total_collected)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#eab3081a" }}>
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold" style={{ color: "#ca8a04" }}>{fmt(overview.total_fees - overview.total_collected)}</p>
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Per-student
              {overview.students?.length > 0 && ()} */}

              {/* ── Payment Status Breakdown ── (commented) */}

            </>
          ) : null}
        </>
      )}

      {/* ── CLASS REPORT ── */}
      {view === "class" && (
        <>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class…" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loadingClass && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {classReport && !loadingClass && (
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <h3 className="mb-4 font-bold text-foreground">{classReport.class_name} — Subject Averages</h3>
              {classReport.subjects?.length > 0 ? (
                <div className="mx-auto max-w-sm">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={classReport.subjects} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                    <XAxis dataKey="subject_name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avg_score" name="Average" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {classReport.subjects.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No scores recorded yet.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── PAYMENTS TAB — Class payment summaries ── */}
      {view === "payments" && (
        <>
          {!overview?.students?.length ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Wallet className="h-12 w-12 opacity-30" />
              <p>No fee data available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{classSummary.length} class{classSummary.length !== 1 ? "es" : ""} · {overview.students.length} students total</p>
              {classSummary.map((c) => {
                const pct = c.total > 0 ? Math.round((c.paid / c.total) * 100) : 0;
                return (
                  <div key={c.class_name} className="rounded-2xl bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-foreground">{c.class_name}</h3>
                      <span className="text-xs text-muted-foreground">{c.count} student{c.count !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2.5 overflow-hidden rounded-full bg-accent mb-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: "#15803d" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>{pct}% collected</span>
                      <span>{fmt(c.paid)} / {fmt(c.total)}</span>
                    </div>

                    {/* Status breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#15803d]/10 py-2">
                        <p className="text-base font-extrabold text-[#15803d]">{c.paid_full}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Paid</p>
                      </div>
                      <div className="rounded-xl bg-yellow-50 py-2">
                        <p className="text-base font-extrabold text-yellow-600">{c.partial}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Partial</p>
                      </div>
                      <div className="rounded-xl bg-destructive/10 py-2">
                        <p className="text-base font-extrabold text-destructive">{c.unpaid}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Unpaid</p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-semibold text-destructive">{fmt(c.remaining)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Floating Download FAB ── */}
      {overview?.students?.length ? (
        <div className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-8 flex flex-col items-end gap-2">
          {showDownload && (
            <div className="flex flex-col gap-2 mb-1">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-2.5 text-sm font-semibold shadow-lg hover:bg-accent transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#15803d]" />
                Excel (.csv)
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-2.5 text-sm font-semibold shadow-lg hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4 text-[#020884ef]" />
                PDF (print)
              </button>
            </div>
          )}
          <button
            onClick={() => setShowDownload((v) => !v)}
            className="flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity p-3.5"
            title="Download student payments"
          >
            {showDownload ? <X className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
