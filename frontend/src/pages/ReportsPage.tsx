import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { useOverviewReport, useClassReport, useClassStudentScores } from "@/hooks/useReports";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useAuth } from "@/contexts/AuthContext";
import { useScoresByStudent } from "@/hooks/useScores";
import { useTimetable } from "@/hooks/useTimetable";
import { useStudentPayments, useStudentBalance } from "@/hooks/usePayments";
import { useInventorySummary, useInventorySales } from "@/hooks/useInventory";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, GraduationCap, TrendingUp, Wallet, BookOpen, Calendar, CreditCard, CheckCircle2, Clock, AlertCircle, FileDown, Package, ShoppingCart } from "lucide-react";

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

// ── helpers ──────────────────────────────────────────────────────────────────
const TERMS = ["First", "Second", "Third"];
const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function gradeColor(pct: number) {
  if (pct >= 90) return "bg-green-100 text-green-700";
  if (pct >= 80) return "bg-primary/10 text-primary";
  if (pct >= 70) return "bg-blue-100 text-blue-700";
  if (pct >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-destructive/15 text-destructive";
}

// ── Stockkeeper Dashboard ────────────────────────────────────────────────────
const StockkeeperDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useInventorySummary();
  const { data: recentData } = useInventorySales({ per_page: 5 });
  const recentSales = (recentData?.data ?? []) as any[];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const cards = [
    { label: "Today's Revenue",  value: fmt(summary?.today_revenue ?? 0),    icon: TrendingUp,    color: "text-green-600",  bg: "bg-green-50" },
    { label: "This Month",       value: fmt(summary?.month_revenue ?? 0),    icon: Wallet,        color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Low Stock Items",  value: String(summary?.low_stock_count ?? 0), icon: AlertCircle, color: "text-amber-600",  bg: "bg-amber-50" },
    { label: "Total Units Sold", value: String(summary?.total_items_sold ?? 0), icon: Package,    color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Welcome, {user?.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Your inventory overview</p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card shadow-card h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-card shadow-card px-4 py-4 flex flex-col gap-2">
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

      <button
        onClick={() => navigate("/inventory")}
        className="w-full flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground font-bold transition hover:opacity-90"
      >
        <span>Record a Sale</span>
        <ShoppingCart className="h-5 w-5" />
      </button>

      {recentSales.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Transactions</p>
          {recentSales.map((sale: any) => {
            const recipient = sale.recipient_type === "student"
              ? sale.student?.name ?? "Unknown"
              : sale.recipient_name ?? "-";
            return (
              <div key={sale.id} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-card">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{sale.item?.name ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">{recipient} · {fmtDate(sale.created_at)}</p>
                </div>
                <p className="font-bold text-sm text-foreground shrink-0">{fmt(sale.total_price)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Parent Dashboard ─────────────────────────────────────────────────────────
const ParentDashboard = () => {
  const { user } = useAuth();
  const children = user?.children ?? [];

  const todayName = DAYS[new Date().getDay() - 1] ?? "Monday"; // Sun=0 → index -1 falls back
  const [selectedChildId, setSelectedChildId] = useState<number>(children[0]?.id ?? 0);
  const [term, setTerm]     = useState("First");
  const [day,  setDay]      = useState(todayName.startsWith("S") ? "Monday" : todayName);

  const child = children.find((c) => c.id === selectedChildId) ?? children[0];

  const { data: scores = [],   isLoading: loadingScores }   = useScoresByStudent(child?.id ?? 0, { term });
  const { data: slots  = [],   isLoading: loadingSlots }    = useTimetable({ class_id: child?.class_id });
  const { data: payments = [],  isLoading: loadingPayments } = useStudentPayments(child?.id ?? 0);
  const { data: balance }                                    = useStudentBalance(child?.id ?? 0);

  const daySlots = slots.filter((s) => s.day_of_week === day).sort((a, b) =>
    (a.time_start ?? "").localeCompare(b.time_start ?? "")
  );

  const avg = scores.length
    ? Math.round(scores.reduce((sum, x) => sum + (x.score / x.max_score) * 100, 0) / scores.length)
    : null;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">My Child's Report</h1>
        <p className="text-sm text-muted-foreground">Academic, schedule & payment overview</p>
      </div>

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

      {/* ── ACADEMICS ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">Academics</p>
              <p className="text-xs text-muted-foreground">{child?.name}</p>
            </div>
          </div>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TERMS.map((t) => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loadingScores ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : scores.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No scores recorded for this term yet.</p>
        ) : (
          <>
            {avg !== null && (
              <div className="rounded-xl bg-primary/5 p-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Overall Average</p>
                <span className={`rounded-lg px-3 py-1 text-sm font-extrabold ${gradeColor(avg)}`}>{avg}%</span>
              </div>
            )}
            <div className="space-y-2">
              {scores.map((s) => {
                const pct = Math.round((s.score / s.max_score) * 100);
                return (
                  <div key={s.id} className="rounded-xl bg-accent/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-foreground truncate">{s.subject?.name ?? "Subject"}</p>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">{s.score}/{s.max_score}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${gradeColor(pct)}`}>
                        {s.grade ?? `${pct}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── TIMETABLE ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">Timetable</p>
              <p className="text-xs text-muted-foreground">{child?.class_name ?? "Class schedule"}</p>
            </div>
          </div>
        </div>

        {/* Day selector */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                day === d ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {loadingSlots ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : daySlots.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No slots for {day}.</p>
        ) : (
          <div className="space-y-2">
            {daySlots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3 rounded-xl bg-accent/40 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${slot.type === "meal" ? "bg-yellow-100" : "bg-primary/10"}`}>
                  {slot.type === "meal"
                    ? <span className="text-base">🍽️</span>
                    : <BookOpen className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{slot.title}</p>
                  {(slot.time_start || slot.time_end) && (
                    <p className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      {slot.time_start}{slot.time_end ? ` – ${slot.time_end}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PAYMENTS ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight">Payments</p>
            <p className="text-xs text-muted-foreground">{child?.name}</p>
          </div>
        </div>

        {/* Balance bar */}
        {balance && balance.total > 0 && (
          <div className="rounded-xl bg-accent/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">{balance.structure?.name ?? "Fee Structure"}</span>
              <span className={balance.remaining === 0 ? "text-green-600 font-bold" : "text-destructive font-bold"}>
                {balance.remaining === 0 ? "Fully Paid ✓" : `${fmt(balance.remaining)} remaining`}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-background overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${balance.percent >= 100 ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${Math.min(balance.percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Paid: <span className="font-semibold text-foreground">{fmt(balance.paid)}</span></span>
              <span>Total: <span className="font-semibold text-foreground">{fmt(balance.total)}</span></span>
            </div>
          </div>
        )}

        {loadingPayments ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-accent/40 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{fmt(p.amount_paid)}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.fee_structure?.name ?? "Fee"} · {p.payment_date}
                    {p.method ? ` · ${p.method}` : ""}
                  </p>
                  {p.reference && <p className="text-xs text-muted-foreground">Ref: {p.reference}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


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

// ── Teacher view ────────────────────────────────────────────────────────────
const TeacherReportsView = () => {
  const navigate = useNavigate();
  const { data: mySubjects = [] } = useSubjects();
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your assigned subjects</p>
      </div>
      {mySubjects.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-20 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">No subjects assigned yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Ask the school manager to assign subjects to you.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mySubjects.map((s) => (
            <div key={s.id} className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{s.name}</p>
                  {s.class_name && (
                    <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {s.class_name}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/scores?subject=${s.id}`)}
                className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Enter Scores →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Admin / School Reports view ───────────────────────────────────────────────
const TERMS_LIST = ["First", "Second", "Third"];

function gradeColorStaff(pct: number | null) {
  if (pct === null) return "text-muted-foreground";
  if (pct >= 90) return "text-green-600";
  if (pct >= 70) return "text-primary";
  if (pct >= 50) return "text-yellow-600";
  return "text-destructive";
}

const StaffReportsView = () => {
  const [searchParams] = useSearchParams();
  const isAcademics = searchParams.get("tab") === "academics";
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");
  const { data: overview, isLoading: loadingOverview } = useOverviewReport();
  const { data: classes = [] } = useClasses();
  const { data: classReport, isLoading: loadingClass } = useClassReport(Number(classId));
  const { data: classScores, isLoading: loadingScores } = useClassStudentScores(
    Number(classId),
    term ? { term } : undefined,
  );

  const pieData = overview
    ? [
        { name: "Collected", value: overview.total_collected },
        { name: "Pending", value: overview.total_fees - overview.total_collected },
      ]
    : [];

  const handleExportPDF = () => {
    if (!classScores) return;
    const subjects = classScores.subjects;
    const headerCells = subjects.map((s) => `<th>${s.name}</th>`).join("");
    const rows = classScores.students.map((st) => {
      const cells = subjects.map((s) => {
        const sc = st.subjects.find((x) => x.subject_id === s.id);
        return `<td>${sc?.score != null ? `${sc.score}/${sc.max_score}` : "—"}</td>`;
      }).join("");
      const avgCell = st.avg_percent != null ? `${st.avg_percent}%` : "—";
      return `<tr><td>${st.name}</td><td>${st.admission_number ?? ""}</td>${cells}<td><b>${avgCell}</b></td></tr>`;
    }).join("");
    const termLabel = term ? `${term} Term · ` : "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${classScores.class_name} – Academics</title>
<style>body{font-family:sans-serif;padding:20px}h1{font-size:17px;margin-bottom:4px}p{color:#555;margin:0 0 14px;font-size:13px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f0f4ff;font-weight:600}tr:nth-child(even){background:#fafafa}</style>
</head><body>
<h1>${classScores.class_name} — Student Score Sheet</h1>
<p>${termLabel}${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
<table><thead><tr><th>Student</th><th>Adm #</th>${headerCells}<th>Avg %</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      {/* ── OVERVIEW ── */}
      {!isAcademics && (
        <>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(overview.enrollment_by_class?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Enrolled Students by Class</h3>
                  <div className="mx-auto max-w-xs">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overview.enrollment_by_class} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
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
                      <span key={c.class_name} className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                        {c.class_name}: {c.student_count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {overview.total_fees > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Fee Collection</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
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
            </>
          ) : null}
        </>
      )}

      {/* ── ACADEMICS ── */}
      {isAcademics && (
        <div className="space-y-4">
          {/* Class cards + Term pills */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select a class</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {classes.map((c, i) => {
                const selected = classId === String(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setClassId(String(c.id))}
                    className={`relative rounded-2xl p-4 text-left transition-all shadow-card ${
                      selected
                        ? "ring-2 ring-primary bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:ring-2 hover:ring-primary/40"
                    }`}
                  >
                    <div
                      className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: selected ? "rgba(255,255,255,0.2)" : `${COLORS[i % COLORS.length]}22`, color: selected ? "#fff" : COLORS[i % COLORS.length] }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold leading-tight">{c.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Term pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(["all", ...TERMS_LIST] as const).map((t) => {
                const active = t === "all" ? term === "" : term === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTerm(t === "all" ? "" : t)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-card text-muted-foreground hover:text-foreground shadow-card"
                    }`}
                  >
                    {t === "all" ? "All Terms" : `${t} Term`}
                  </button>
                );
              })}
            </div>
          </div>

          {!classId && (
            <div className="rounded-2xl bg-card p-10 text-center shadow-card">
              <GraduationCap className="mx-auto h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm text-muted-foreground">Select a class to view academic performance</p>
            </div>
          )}

          {classId && (loadingClass || loadingScores) && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {/* Subject averages */}
          {classReport && !loadingClass && (
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">{classReport.class_name} — Subject Averages</h3>
                {classReport.overall_avg != null && (
                  <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    Overall {classReport.overall_avg}%
                  </span>
                )}
              </div>
              {classReport.subjects?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {classReport.subjects.map((s, i) => (
                    <div
                      key={s.subject_name}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: `${COLORS[i % COLORS.length]}18` }}
                    >
                      <p className="text-xs font-medium text-muted-foreground truncate">{s.subject_name}</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                        {s.avg_score != null ? `${s.avg_score}%` : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No scores recorded yet.</p>
              )}
            </div>
          )}

          {/* Per-student performance */}
          {classScores && !loadingScores && classScores.students.length > 0 && (
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <h3 className="mb-4 font-bold text-foreground">Student Performance</h3>
              <div className="space-y-2">
                {classScores.students.map((s) => (
                  <div key={s.id} className="rounded-xl bg-accent/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-foreground truncate">{s.name}</p>
                          <span className={`ml-2 shrink-0 text-sm font-bold ${gradeColorStaff(s.avg_percent)}`}>
                            {s.avg_percent != null ? `${s.avg_percent}%` : "—"}
                          </span>
                        </div>
                        {s.avg_percent != null && (
                          <div className="mt-1 h-1.5 w-full rounded-full bg-background overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${s.avg_percent}%` }} />
                          </div>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {s.subjects.filter((x) => x.score != null).map((x) => (
                            <span key={x.subject_id} className="rounded-md bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {x.subject_name}: {x.score}/{x.max_score}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PDF download FAB ── only visible in Academics tab with a class selected */}
      {isAcademics && !!classId && !!classScores && (
        <button
          onClick={handleExportPDF}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-elevated transition hover:opacity-90 active:scale-95 md:bottom-6"
          title="Download PDF"
        >
          <FileDown className="h-5 w-5" />
          <span>Export PDF</span>
        </button>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const { user } = useAuth();
  if (user?.role === "parent")      return <ParentDashboard />;
  if (user?.role === "teacher")     return <TeacherReportsView />;
  if (user?.role === "stockkeeper") return <StockkeeperDashboard />;
  return <StaffReportsView />;
};

export default ReportsPage;
