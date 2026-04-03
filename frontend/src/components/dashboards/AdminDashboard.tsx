import { Users, GraduationCap, CreditCard, TrendingUp } from "lucide-react";
import { useOverviewReport } from "@/hooks/useReports";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { data: overview, isLoading } = useOverviewReport();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 animate-fade-in">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const collected = overview?.total_collected ?? 0;
  const total = overview?.total_fees ?? 0;
  const pct = overview?.collection_percent ?? 0;

  const stats = [
    { icon: Users, label: "Students", value: overview?.total_students ?? 0, color: "bg-primary/10 text-primary" },
    { icon: GraduationCap, label: "Classes", value: overview?.total_classes ?? 0, color: "bg-secondary/10 text-secondary" },
    { icon: CreditCard, label: "Collected", value: `₦${collected.toLocaleString()}`, color: "bg-success/15 text-success" },
    { icon: TrendingUp, label: "Teachers", value: overview?.total_teachers ?? 0, color: "bg-warning/15 text-warning" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Fee Collection Overview */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-card-foreground">Fee Collection</h3>
          <Link to="/reports" className="text-xs font-semibold text-primary">Full Report</Link>
        </div>
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Target: ₦{total.toLocaleString()}</span>
          <span className="font-bold text-card-foreground">₦{collected.toLocaleString()} ({pct}%)</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Student Payment Status */}
      {(overview?.students?.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-card-foreground">Student Payments</h3>
            <Link to="/reports" className="text-xs font-semibold text-primary">View All</Link>
          </div>
          <div className="space-y-3">
            {overview!.students.slice(0, 4).map((s) => {
              const p = s.total_fees > 0 ? Math.round((s.total_paid / s.total_fees) * 100) : 0;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.class_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-card-foreground">₦{s.total_paid.toLocaleString()}</p>
                    <span className={`text-xs font-semibold ${p >= 100 ? "text-success" : p > 0 ? "text-warning" : "text-destructive"}`}>
                      {p >= 100 ? "✓ Complete" : p > 0 ? `◐ ${p}%` : "✗ Unpaid"}
                    </span>
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

export default AdminDashboard;
