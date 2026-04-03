import { Users, BookOpen, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudents } from "@/hooks/useStudents";

const TeacherDashboard = () => {
  const { data: subjects = [] } = useSubjects();
  const { data: studentsData } = useStudents();
  const studentCount = studentsData?.data?.length ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Students", value: studentCount, color: "bg-primary/10 text-primary" },
          { icon: BookOpen, label: "Subjects", value: subjects.length, color: "bg-secondary/10 text-secondary" },
          { icon: ClipboardCheck, label: "Classes", value: [...new Set(subjects.map((s) => s.class_id))].length, color: "bg-warning/15 text-warning" },
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

      {/* My Subjects */}
      {subjects.length > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-3 font-bold text-card-foreground">My Subjects</h3>
          <div className="space-y-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                to="/scores"
                className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3 transition-all active:scale-[0.98]"
              >
                <div>
                  <p className="font-semibold text-card-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.class_name}</p>
                </div>
                <div className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  Enter Scores
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {subjects.length === 0 && (
        <div className="rounded-2xl bg-card p-8 text-center shadow-soft">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
