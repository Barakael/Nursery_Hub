import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { useOverviewReport, useClassReport } from "@/hooks/useReports";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, GraduationCap, TrendingUp, Wallet, BookOpen } from "lucide-react";

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
  const [view, setView] = useState<"overview" | "class">("overview");
  const [classId, setClassId] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: mySubjects = [] } = useSubjects();

  const { data: overview, isLoading: loadingOverview } = useOverviewReport();
  const { data: classes = [] } = useClasses();

  const { data: classReport, isLoading: loadingClass } = useClassReport(Number(classId));

  // ── Teacher view ──────────────────────────────────────────────────────────
  if (user?.role === "teacher") {
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
  }
  // ── End teacher view ──────────────────────────────────────────────────────

  const pieData = overview
    ? [
        { name: "Collected", value: overview.total_collected },
        { name: "Pending", value: overview.total_fees - overview.total_collected },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* View Switcher */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <div className="mt-3 flex gap-1 rounded-2xl bg-card p-1.5 shadow-soft">
          {(["overview", "class"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all capitalize ${
                view === v
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
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

    </div>
  );
};

export default ReportsPage;
