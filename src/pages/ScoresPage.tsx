import { useState } from "react";

const students = [
  { id: 1, name: "Emma Doe", class: "Nursery 2", scores: { Mathematics: 85, English: 78 } },
  { id: 2, name: "Liam Smith", class: "Nursery 2", scores: { Mathematics: 72, English: 90 } },
  { id: 3, name: "Kachi Obi", class: "Nursery 1", scores: { Mathematics: 65, English: 82 } },
  { id: 4, name: "Zara Ahmed", class: "Nursery 2", scores: { Mathematics: 91, English: 85 } },
  { id: 5, name: "Tunde Bello", class: "Nursery 1", scores: { Mathematics: 78, English: 74 } },
];

const ScoresPage = () => {
  const [editing, setEditing] = useState<number | null>(null);
  const [scores, setScores] = useState(students);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-1 font-bold text-card-foreground">Enter Scores</h3>
        <p className="text-xs text-muted-foreground">Nursery 2 • Mathematics • Term 1</p>
      </div>

      <div className="space-y-3">
        {scores.map((s) => (
          <div key={s.id} className="rounded-2xl bg-card px-5 py-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-card-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.class}</p>
              </div>
              {editing === s.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={s.scores.Mathematics}
                    className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-bold"
                    min={0}
                    max={100}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setScores((prev) =>
                        prev.map((st) =>
                          st.id === s.id ? { ...st, scores: { ...st.scores, Mathematics: val } } : st
                        )
                      );
                      setEditing(null);
                    }}
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(s.id)}
                  className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-all active:scale-95"
                >
                  {s.scores.Mathematics}/100
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full rounded-2xl bg-primary py-4 text-center font-bold text-primary-foreground shadow-card transition-all active:scale-[0.98]">
        Save All Scores
      </button>
    </div>
  );
};

export default ScoresPage;
