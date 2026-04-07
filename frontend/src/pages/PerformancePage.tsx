import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useScoresByStudent, Score } from "@/hooks/useScores";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BarChart3, BookOpen } from "lucide-react";

const TERMS = ["First", "Second", "Third"];

function gradeColor(pct: number) {
  if (pct >= 90) return "bg-green-100 text-green-700";
  if (pct >= 80) return "bg-primary/10 text-primary";
  if (pct >= 70) return "bg-blue-100 text-blue-700";
  if (pct >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-destructive/15 text-destructive";
}

const ScoresSection = ({
  studentId,
  studentName,
  term,
}: {
  studentId: number;
  studentName: string;
  term: string;
}) => {
  const { data: scores = [], isLoading } = useScoresByStudent(studentId, { term });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-card">
        <BarChart3 className="mx-auto h-10 w-10 opacity-20 mb-3" />
        <p className="text-sm text-muted-foreground">No scores recorded for this term yet</p>
      </div>
    );
  }

  const avg = Math.round(
    scores.reduce((sum, x) => sum + (x.score / x.max_score) * 100, 0) / scores.length
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl bg-card p-5 shadow-card text-center">
        <p className="text-sm text-muted-foreground">{studentName}</p>
        <p className="text-4xl font-extrabold text-primary mt-1">{avg}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {scores.length} subject{scores.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Score rows */}
      <div className="space-y-2">
        {scores.map((s) => {
          const pct = Math.round((s.score / s.max_score) * 100);
          return (
            <div key={s.id} className="rounded-xl bg-card px-4 py-3.5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {s.subject?.name ?? "Subject"}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {s.score}/{s.max_score}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-accent overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${gradeColor(pct)}`}
                >
                  {s.grade}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PerformancePage = () => {
  const { user } = useAuth();
  const [term, setTerm] = useState("First");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const isParent = user?.role === "parent";
  const children = user?.children ?? [];

  // For admin/school: class selector then student selector
  const { data: classesData } = useClasses();
  const classes = classesData ?? [];
  const { data: studentsData } = useStudents(
    selectedClassId ? { class_id: selectedClassId } : undefined,
    { enabled: !isParent && !!selectedClassId }
  );
  const students = studentsData?.data ?? [];

  // Effective student
  const effectiveId = isParent
    ? (selectedChildId ?? children[0]?.id ?? 0)
    : (selectedStudentId ?? 0);

  const effectiveName = isParent
    ? (children.find((c) => c.id === effectiveId)?.name ?? children[0]?.name ?? "")
    : (students.find((s) => s.id === effectiveId)?.name ?? "");

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Grades</h1>
        <p className="text-sm text-muted-foreground">Academic performance by term</p>
      </div>

      {/* Selectors card */}
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
        {/* Parent: child selector if multiple children */}
        {isParent && children.length > 1 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Student</label>
            <Select
              value={String(selectedChildId ?? children[0]?.id ?? "")}
              onValueChange={(v) => setSelectedChildId(Number(v))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Admin / school: class → student selectors */}
        {!isParent && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Class</label>
              <Select
                value={selectedClassId}
                onValueChange={(v) => { setSelectedClassId(v); setSelectedStudentId(null); }}
              >
                <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Student</label>
              <Select
                value={selectedStudentId ? String(selectedStudentId) : ""}
                onValueChange={(v) => setSelectedStudentId(Number(v))}
                disabled={!selectedClassId || students.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Select student…" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Term selector */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Term</label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TERMS.map((t) => (
                <SelectItem key={t} value={t}>{t} Term</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scores display */}
      {isParent && children.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <p className="text-sm text-muted-foreground">No students linked to your account.</p>
        </div>
      ) : !isParent && !selectedStudentId ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <BarChart3 className="mx-auto h-10 w-10 opacity-20 mb-3" />
          <p className="text-sm text-muted-foreground">Select a class and student to view grades</p>
        </div>
      ) : effectiveId ? (
        <ScoresSection studentId={effectiveId} studentName={effectiveName} term={term} />
      ) : null}
    </div>
  );
};

export default PerformancePage;

