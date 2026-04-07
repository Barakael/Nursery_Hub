import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSubjects } from "@/hooks/useSubjects";
import { useScoresBySubject, useUpsertScore } from "@/hooks/useScores";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, CheckCircle2, FileDown } from "lucide-react";

const TERMS = ["First", "Second", "Third"];

// Derive current academic year string e.g. "2025/2026"
function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() < 6 ? `${y - 1}/${y}` : `${y}/${y + 1}`;
}

const ScoresPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const { data: subjects = [] } = useSubjects();
  const [subjectId, setSubjectId] = useState(searchParams.get("subject") ?? "");
  const [term, setTerm] = useState("First");
  const academicYear = currentAcademicYear();

  const { data: existingScores = [] } = useScoresBySubject(
    Number(subjectId),
    { term, academic_year: academicYear },
  );

  // Get students for the selected subject's class
  const selectedSubject = subjects.find((s) => String(s.id) === subjectId);
  const { data: studentsData } = useStudents({ class_id: selectedSubject?.class_id });
  const students = studentsData?.data ?? [];

  // Local score state — cleared when subject or term changes
  const [localScores, setLocalScores] = useState<Record<number, number>>({});
  useEffect(() => { setLocalScores({}); }, [subjectId, term]);

  const getExisting = (studentId: number) =>
    existingScores.find((s) => s.student_id === studentId);

  const getDisplayValue = (studentId: number) => {
    if (localScores[studentId] !== undefined) return localScores[studentId];
    return getExisting(studentId)?.score ?? "";
  };

  const upsert = useUpsertScore();

  const handleSave = async () => {
    if (!subjectId) return;
    const entries = Object.entries(localScores);
    if (entries.length === 0) {
      toast({ title: "No changes to save" });
      return;
    }
    try {
      await Promise.all(
        entries.map(([studentId, score]) =>
          upsert.mutateAsync({
            student_id: Number(studentId),
            subject_id: Number(subjectId),
            score,
            max_score: 100,
            term,
            academic_year: academicYear,
          })
        )
      );
      setLocalScores({});
      toast({ title: `${entries.length} score${entries.length !== 1 ? "s" : ""} saved` });
    } catch {
      toast({ title: "Failed to save scores", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    if (!subjectId || students.length === 0) return;
    const subjectName = selectedSubject?.name ?? "Subject";
    const className = selectedSubject?.class_name ?? "";
    const rows = students
      .map((s) => {
        const existing = getExisting(s.id);
        const score = localScores[s.id] !== undefined ? localScores[s.id] : (existing?.score ?? "");
        const max = existing?.max_score ?? 100;
        const pct = typeof score === "number" && max > 0 ? Math.round((score / max) * 100) + "%" : "—";
        const grade = existing?.grade ?? "—";
        return `<tr><td>${s.name}</td><td>${s.admission_number ?? ""}</td><td>${score !== "" ? score : "—"}</td><td>${max}</td><td>${pct}</td><td>${grade}</td></tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subjectName} Scores</title>
<style>body{font-family:sans-serif;padding:24px}h1{font-size:18px;margin-bottom:4px}p{color:#555;margin:0 0 16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f0f4ff;font-weight:600}tr:nth-child(even){background:#fafafa}</style>
</head><body>
<h1>${subjectName} — Score Sheet</h1>
<p>${className ? className + " · " : ""}${term} Term · ${academicYear}</p>
<table><thead><tr><th>Student</th><th>Adm #</th><th>Score</th><th>Max</th><th>%</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Controls */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Enter Scores</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} {s.class_name ? `(${s.class_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Term</label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Academic Year</label>
            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              {academicYear}
            </div>
          </div>
        </div>
      </div>

      {subjectId && students.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No students in this class.
        </p>
      )}

      {students.length > 0 && (
        <>
          <div className="space-y-3">
            {students.map((s) => {
              const val = getDisplayValue(s.id);
              const existing = getExisting(s.id);
              const isDirty = localScores[s.id] !== undefined;
              return (
                <div key={s.id} className="rounded-2xl bg-card px-5 py-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-card-foreground truncate">{s.name}</p>
                      {existing && !isDirty && (
                        <span className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        value={val}
                        onChange={(e) =>
                          setLocalScores((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                        }
                        className={`w-16 rounded-lg border px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                          isDirty
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-input bg-background"
                        }`}
                        min={0}
                        max={100}
                        placeholder="—"
                      />
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 py-6 text-base font-bold"
              onClick={handleSave}
              disabled={upsert.isPending || Object.keys(localScores).length === 0}
            >
              <Save className="mr-2 h-5 w-5" />
              {upsert.isPending ? "Saving…" : "Save All Scores"}
            </Button>
            <Button
              variant="outline"
              className="py-6 px-5 font-bold"
              onClick={handleExportPDF}
              title="Export scores as PDF"
            >
              <FileDown className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ScoresPage;
