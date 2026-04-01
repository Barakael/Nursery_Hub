import { Users, BookOpen, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

const classes = [
  { name: "Nursery 1", students: 18, subject: "Mathematics" },
  { name: "Nursery 2", students: 22, subject: "English" },
];

const pendingScores = [
  { class: "Nursery 1", subject: "Mathematics", due: "Apr 5" },
  { class: "Nursery 2", subject: "English", due: "Apr 7" },
];

const TeacherDashboard = () => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Students", value: "40", color: "bg-primary/10 text-primary" },
          { icon: BookOpen, label: "Subjects", value: "2", color: "bg-secondary/15 text-secondary" },
          { icon: ClipboardCheck, label: "Pending", value: "2", color: "bg-warning/15 text-warning" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 text-center shadow-soft">
            <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* My Classes */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">My Classes</h3>
        <div className="space-y-3">
          {classes.map((c) => (
            <Link
              key={c.name}
              to="/scores"
              className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3 transition-all active:scale-[0.98]"
            >
              <div>
                <p className="font-semibold text-card-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.subject} • {c.students} students</p>
              </div>
              <div className="rounded-lg bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
                Enter Scores
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">⏳ Pending Score Entry</h3>
        <div className="space-y-2">
          {pendingScores.map((p) => (
            <div key={p.class + p.subject} className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-card-foreground">{p.class} — {p.subject}</p>
                <p className="text-xs text-muted-foreground">Due: {p.due}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
