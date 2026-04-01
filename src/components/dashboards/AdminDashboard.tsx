import { Users, GraduationCap, CreditCard, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, label: "Students", value: "142", change: "+12", color: "bg-primary/10 text-primary" },
  { icon: GraduationCap, label: "Classes", value: "6", change: "", color: "bg-secondary/15 text-secondary" },
  { icon: CreditCard, label: "Collected", value: "₦4.2M", change: "+₦800K", color: "bg-success/15 text-success" },
  { icon: TrendingUp, label: "Avg Score", value: "78%", change: "+3%", color: "bg-warning/15 text-warning" },
];

const recentPayments = [
  { parent: "John Doe", child: "Emma Doe", amount: "₦50,000", date: "Mar 28", status: "partial" },
  { parent: "Jane Smith", child: "Liam Smith", amount: "₦120,000", date: "Mar 25", status: "complete" },
  { parent: "Amara Obi", child: "Kachi Obi", amount: "₦30,000", date: "Mar 22", status: "partial" },
];

const AdminDashboard = () => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              {s.change && <span className="text-xs font-semibold text-success">{s.change}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Fee Collection Overview */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Fee Collection</h3>
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Target: ₦17M</span>
          <span className="font-bold text-card-foreground">₦4.2M (25%)</span>
        </div>
        <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[25%] rounded-full bg-secondary" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-success/10 py-2">
            <p className="font-bold text-success">38</p>
            <p className="text-muted-foreground">Paid</p>
          </div>
          <div className="rounded-xl bg-warning/10 py-2">
            <p className="font-bold text-warning">67</p>
            <p className="text-muted-foreground">Partial</p>
          </div>
          <div className="rounded-xl bg-destructive/10 py-2">
            <p className="font-bold text-destructive">37</p>
            <p className="text-muted-foreground">Unpaid</p>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Recent Payments</h3>
        <div className="space-y-3">
          {recentPayments.map((p) => (
            <div key={p.parent} className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-card-foreground">{p.child}</p>
                <p className="text-xs text-muted-foreground">{p.parent} • {p.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-card-foreground">{p.amount}</p>
                <span className={`text-xs font-semibold ${p.status === "complete" ? "text-success" : "text-warning"}`}>
                  {p.status === "complete" ? "✓ Complete" : "◐ Partial"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
