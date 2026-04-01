const subjects = [
  { name: "Mathematics", score: 85, total: 100, grade: "A", teacher: "Ms. Sarah" },
  { name: "English Language", score: 78, total: 100, grade: "B+", teacher: "Mr. James" },
  { name: "Science", score: 92, total: 100, grade: "A+", teacher: "Ms. Ada" },
  { name: "Social Studies", score: 70, total: 100, grade: "B", teacher: "Mr. Emeka" },
  { name: "Creative Arts", score: 88, total: 100, grade: "A", teacher: "Ms. Joy" },
  { name: "Physical Education", score: 95, total: 100, grade: "A+", teacher: "Mr. Bayo" },
];

const gradeColor = (score: number) => {
  if (score >= 90) return "bg-success/15 text-success";
  if (score >= 80) return "bg-secondary/15 text-secondary";
  if (score >= 70) return "bg-primary/10 text-primary";
  return "bg-warning/15 text-warning";
};

const PerformancePage = () => {
  const avg = Math.round(subjects.reduce((s, x) => s + x.score, 0) / subjects.length);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary */}
      <div className="rounded-2xl bg-card p-5 shadow-card text-center">
        <p className="text-sm text-muted-foreground">Overall Average</p>
        <p className="text-4xl font-extrabold text-secondary">{avg}%</p>
        <p className="text-xs text-muted-foreground mt-1">{subjects.length} Subjects • Term 1</p>
      </div>

      {/* Subject List */}
      <div className="space-y-3">
        {subjects.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 shadow-soft">
            <div>
              <p className="font-bold text-card-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.teacher} • {s.score}/{s.total}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${gradeColor(s.score)}`}>
              {s.grade}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformancePage;
