import { BarChart3, CreditCard, Calendar, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { useStudentBalance } from "@/hooks/usePayments";
import { useScoresByStudent } from "@/hooks/useScores";

const quickActions = [
  { icon: BarChart3, label: "Grades", path: "/performance", color: "bg-primary/10 text-primary" },
  { icon: CreditCard, label: "Payments", path: "/payments", color: "bg-success/15 text-success" },
  { icon: Calendar, label: "Timetable", path: "/timetable", color: "bg-secondary/10 text-secondary" },
  { icon: BookOpen, label: "Scores", path: "/performance", color: "bg-warning/15 text-warning" },
];

const ParentDashboard = () => {
  const { user } = useAuth();

  const { data: studentsData } = useStudents();
  const students = studentsData?.data ?? [];
  const child = students[0];

  const { data: balance } = useStudentBalance(child?.id ?? 0);
  const { data: scores = [] } = useScoresByStudent(child?.id ?? 0);

  const avg = scores.length
    ? Math.round(scores.reduce((s, x) => s + (x.score / x.max_score) * 100, 0) / scores.length)
    : null;

  const totalPaid = balance?.total_paid ?? 0;
  const totalFee = balance?.total_fees ?? 0;
  const remaining = balance?.remaining ?? 0;
  const pct = balance?.percent_paid ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Child Info Card */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
            👧
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">{child?.name ?? user?.childName ?? "—"}</h2>
            <p className="text-sm text-muted-foreground">Class: {child?.class_name ?? "—"}</p>
          </div>
        </div>
        {avg !== null && (
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-xl bg-success/10 px-3 py-2 text-center">
              <p className="text-lg font-bold text-success">{avg}%</p>
              <p className="text-xs text-muted-foreground">Average</p>
            </div>
            <div className="flex-1 rounded-xl bg-primary/10 px-3 py-2 text-center">
              <p className="text-lg font-bold text-primary">{scores.length}</p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
            <div className="flex-1 rounded-xl bg-secondary/10 px-3 py-2 text-center">
              <p className="text-lg font-bold text-secondary">{pct}%</p>
              <p className="text-xs text-muted-foreground">Fees Paid</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 shadow-soft transition-all active:scale-95"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-card-foreground">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Payment Status */}
      {totalFee > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-card-foreground">Fee Status</h3>
            <Link to="/payments" className="text-xs font-semibold text-primary">View All</Link>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Fees</span>
            <span className="font-bold text-card-foreground">₦{totalFee.toLocaleString()}</span>
          </div>
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-success">Paid: ₦{totalPaid.toLocaleString()}</span>
            <span className="font-semibold text-destructive">Balance: ₦{remaining.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Recent Grades */}
      {scores.length > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-card-foreground">Recent Grades</h3>
            <Link to="/performance" className="text-xs font-semibold text-primary">See All</Link>
          </div>
          <div className="space-y-3">
            {scores.slice(0, 4).map((g) => {
              const pctScore = Math.round((g.score / g.max_score) * 100);
              return (
                <div key={g.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{g.subject_name}</p>
                    <p className="text-xs text-muted-foreground">{g.score}/{g.max_score}</p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm ${
                    pctScore >= 90 ? "bg-success/15 text-success" :
                    pctScore >= 80 ? "bg-primary/10 text-primary" :
                    "bg-warning/15 text-warning"
                  }`}>
                    {g.grade}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
