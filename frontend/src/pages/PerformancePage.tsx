import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { useScoresByStudent } from "@/hooks/useScores";

const gradeColor = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return "bg-success/15 text-success";
  if (pct >= 80) return "bg-primary/10 text-primary";
  if (pct >= 70) return "bg-blue-100 text-blue-700";
  if (pct >= 50) return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
};

const PerformancePage = () => {
  const { data: studentsData } = useStudents();
  const students = studentsData?.data ?? [];
  const firstStudent = students[0];

  const { data: scoresRaw = [], isLoading } = useScoresByStudent(firstStudent?.id ?? 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 animate-fade-in">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!firstStudent || scoresRaw.length === 0) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="rounded-2xl bg-card p-5 shadow-card text-center">
          <p className="text-sm text-muted-foreground">No performance data yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Scores will appear here once entered by teachers.</p>
        </div>
      </div>
    );
  }

  const avg = Math.round(
    scoresRaw.reduce((s, x) => s + ((x.score / x.max_score) * 100), 0) / scoresRaw.length
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary */}
      <div className="rounded-2xl bg-card p-5 shadow-card text-center">
        <p className="text-sm text-muted-foreground">{firstStudent.name} — Overall Average</p>
        <p className="text-4xl font-extrabold text-primary">{avg}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {scoresRaw.length} Subject{scoresRaw.length !== 1 ? "s" : ""} · {scoresRaw[0]?.term} Term {scoresRaw[0]?.year}
        </p>
      </div>

      {/* Subject List */}
      <div className="space-y-3">
        {scoresRaw.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 shadow-soft">
            <div>
              <p className="font-bold text-card-foreground">{s.subject_name}</p>
              <p className="text-xs text-muted-foreground">{s.score}/{s.max_score}</p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${gradeColor(s.score, s.max_score)}`}
            >
              {s.grade}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformancePage;
