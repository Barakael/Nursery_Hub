import { useState } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { useScoresBySubject, useUpsertScore } from "@/hooks/useScores";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const TERMS = ["First", "Second", "Third"];
const YEAR = new Date().getFullYear();

const ScoresPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subjects = [] } = useSubjects();
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("First");
  const [year] = useState(YEAR);

  const { data: existingScores = [] } = useScoresBySubject(Number(subjectId));

  // Get students for the selected subject's class
  const selectedSubject = subjects.find((s) => String(s.id) === subjectId);
  const { data: studentsData } = useStudents({ class_id: selectedSubject?.class_id });
  const students = studentsData?.data ?? [];

  // Local score state
  const [localScores, setLocalScores] = useState<Record<number, number>>({});

  const getScore = (studentId: number) => {
    if (localScores[studentId] !== undefined) return localScores[studentId];
    const existing = existingScores.find(
      (s) => s.student_id === studentId && s.term === term && s.year === year
    );
    return existing?.score ?? "";
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
            year,
          })
        )
      );
      setLocalScores({});
      toast({ title: `${entries.length} score${entries.length !== 1 ? "s" : ""} saved` });
    } catch {
      toast({ title: "Failed to save scores", variant: "destructive" });
    }
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
            <label className="text-xs font-medium text-muted-foreground">Year</label>
            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
              {year}
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
              const val = getScore(s.id);
              return (
                <div key={s.id} className="rounded-2xl bg-card px-5 py-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-card-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.class_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={localScores[s.id] !== undefined ? localScores[s.id] : (typeof val === "number" ? val : "")}
                        onChange={(e) => setLocalScores((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                        className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
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

          <Button
            className="w-full py-6 text-base font-bold"
            onClick={handleSave}
            disabled={upsert.isPending || Object.keys(localScores).length === 0}
          >
            <Save className="mr-2 h-5 w-5" />
            {upsert.isPending ? "Saving…" : "Save All Scores"}
          </Button>
        </>
      )}
    </div>
  );
};

export default ScoresPage;
