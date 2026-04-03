import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { useOverviewReport, useClassReport, useStudentReport } from "@/hooks/useReports";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, GraduationCap, TrendingUp, Wallet, UserCheck, UserX, Clock } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const fmt = (n: number) => `₦${n?.toLocaleString() ?? 0}`;

const StatCard = ({
  icon: Icon, label, value, sub, color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <div className="rounded-2xl bg-card p-5 shadow-card">
    <div className="flex items-start justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
    <p className="mt-3 text-2xl font-extrabold text-foreground">{value}</p>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
  </div>
);

const ReportsPage = () => {
  const [view, setView] = useState<"overview" | "class" | "student">("overview");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");

  const { data: overview, isLoading: loadingOverview } = useOverviewReport();
  const { data: classes = [] } = useClasses();
  const { data: studentsData } = useStudents();
  const students = studentsData?.data ?? [];

  const { data: classReport, isLoading: loadingClass } = useClassReport(Number(classId));
  const { data: studentReport, isLoading: loadingStudent } = useStudentReport(Number(studentId));

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
          {(["overview", "class", "student"] as const).map((v) => (
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
                <StatCard icon={GraduationCap} label="Classes" value={overview.total_classes} />
                <StatCard icon={TrendingUp} label="Teachers" value={overview.total_teachers} />
                <StatCard icon={Wallet} label="Collection" value={`${overview.collection_percent ?? 0}%`} sub={fmt(overview.total_collected)} color="text-success" />
              </div>

              {/* Fee Collection Pie */}
              {overview.total_fees > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Fee Collection</h3>
                  <div className="flex flex-col items-center gap-2 md:flex-row">
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
                            <Cell key={i} fill={i === 0 ? "#10b981" : "#ef4444"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 md:w-56">
                      <div className="rounded-xl bg-success/10 p-3">
                        <p className="text-xs text-muted-foreground">Collected</p>
                        <p className="text-lg font-bold text-success">{fmt(overview.total_collected)}</p>
                      </div>
                      <div className="rounded-xl bg-destructive/10 p-3">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-lg font-bold text-destructive">{fmt(overview.total_fees - overview.total_collected)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Per-student */}
              {overview.students?.length > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Student Fee Status</h3>
                  <div className="space-y-3">
                    {overview.students.map((s) => {
                      const pct = s.total_fees > 0 ? Math.round((s.total_paid / s.total_fees) * 100) : 0;
                      return (
                        <div key={s.id}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-foreground">{s.name}</span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-accent">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-destructive"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {fmt(s.total_paid)} of {fmt(s.total_fees)} · {s.class_name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Payment Status Breakdown ── */}
              {(overview.paid_full + overview.paid_partial + overview.unpaid) > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Payment Status Breakdown</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-success/10 p-4 text-center">
                      <UserCheck className="mx-auto mb-1 h-6 w-6 text-success" />
                      <p className="text-2xl font-extrabold text-success">{overview.paid_full}</p>
                      <p className="text-xs font-medium text-muted-foreground">Fully Paid</p>
                    </div>
                    <div className="rounded-xl bg-warning/10 p-4 text-center">
                      <Clock className="mx-auto mb-1 h-6 w-6 text-warning" />
                      <p className="text-2xl font-extrabold text-warning">{overview.paid_partial}</p>
                      <p className="text-xs font-medium text-muted-foreground">Part Paid</p>
                    </div>
                    <div className="rounded-xl bg-destructive/10 p-4 text-center">
                      <UserX className="mx-auto mb-1 h-6 w-6 text-destructive" />
                      <p className="text-2xl font-extrabold text-destructive">{overview.unpaid}</p>
                      <p className="text-xs font-medium text-muted-foreground">Not Paid</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Enrollment by Class ── */}
              {(overview.enrollment_by_class?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Enrolled Students by Class</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={overview.enrollment_by_class}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="class_name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="student_count" name="Students" radius={[6, 6, 0, 0]}>
                        {overview.enrollment_by_class.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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

              {/* ── Recent Admissions ── */}
              {(overview.recent_admissions?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <h3 className="mb-4 font-bold text-foreground">Recent Admissions</h3>
                  <div className="space-y-2">
                    {overview.recent_admissions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.class_name} · {s.admission_number}</p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{s.enrolled_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={classReport.subjects} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="subject_name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                      {classReport.subjects.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No scores recorded yet.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── STUDENT REPORT ── */}
      {view === "student" && (
        <>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student…" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loadingStudent && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {studentReport && !loadingStudent && (
            <div className="space-y-4">
              {/* Scores */}
              <div className="rounded-2xl bg-card p-5 shadow-card">
                <h3 className="mb-3 font-bold text-foreground">
                  {studentReport.student.name} — {studentReport.student.class_name}
                </h3>
                {studentReport.scores?.length > 0 ? (
                  <div className="space-y-2">
                    {studentReport.scores.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-2.5">
                        <span className="text-sm font-medium text-foreground">{sc.subject}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{sc.score}/{sc.max_score}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            sc.grade === "A+" || sc.grade === "A" ? "bg-success/15 text-success" :
                            sc.grade === "B+" || sc.grade === "B" ? "bg-blue-100 text-blue-700" :
                            sc.grade === "C" ? "bg-yellow-100 text-yellow-700" :
                            "bg-destructive/15 text-destructive"
                          }`}>{sc.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">No scores recorded.</p>
                )}
              </div>

              {/* Balance */}
              {studentReport.balance && (
                <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-card">
                  <p className="text-sm font-medium opacity-80">Fee Balance</p>
                  <p className="text-3xl font-extrabold">{fmt(studentReport.balance.remaining)}</p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary-foreground/20">
                    <div
                      className="h-full rounded-full bg-primary-foreground"
                      style={{ width: `${studentReport.balance.percent_paid ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs opacity-80">
                    <span>Paid: {fmt(studentReport.balance.total_paid)}</span>
                    <span>{studentReport.balance.percent_paid ?? 0}% paid</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
