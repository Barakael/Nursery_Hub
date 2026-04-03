import { useState } from "react";
import { BookOpen, Utensils } from "lucide-react";
import { useTimetable, TimetableSlot } from "@/hooks/useTimetable";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TimetablePage = () => {
  const [tab, setTab] = useState<"subjects" | "meals">("subjects");
  const { data: slots = [], isLoading } = useTimetable();

  // Group by day
  const byDay = (type: "lesson" | "meal" | "break" | "activity") =>
    DAYS.map((day) => ({
      day,
      slots: slots.filter((s) =>
        s.day.toLowerCase() === day.toLowerCase() &&
        (type === "lesson" ? s.type === "lesson" : s.type === "meal" || s.type === "break")
      ),
    })).filter((d) => d.slots.length > 0);

  const lessonDays = byDay("lesson");
  const mealDays = byDay("meal");

  // Fallback: show all slots grouped by day and type
  const allByDay = DAYS.map((day) => ({
    day,
    lessons: slots.filter((s) => s.day.toLowerCase() === day.toLowerCase() && s.type === "lesson"),
    meals: slots.filter((s) => s.day.toLowerCase() === day.toLowerCase() && (s.type === "meal" || s.type === "break")),
  })).filter((d) => d.lessons.length > 0 || d.meals.length > 0);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 rounded-2xl bg-card p-1.5 shadow-soft">
        {[
          { key: "subjects" as const, icon: BookOpen, label: "Subjects" },
          { key: "meals" as const, icon: Utensils, label: "Meals" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
          <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p>No timetable set up yet.</p>
        </div>
      ) : (
        <>
          {/* Subject Timetable */}
          {tab === "subjects" && (
            <div className="space-y-3">
              {allByDay.map(({ day, lessons }) =>
                lessons.length > 0 ? (
                  <div key={day} className="rounded-2xl bg-card p-4 shadow-soft">
                    <p className="mb-2 text-sm font-bold text-primary">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {lessons.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
                          title={`${s.start_time} – ${s.end_time}${s.teacher_name ? " · " + s.teacher_name : ""}`}
                        >
                          {s.subject ?? s.type}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Meal Timetable */}
          {tab === "meals" && (
            <div className="space-y-3">
              {allByDay.map(({ day, meals }) =>
                meals.length > 0 ? (
                  <div key={day} className="rounded-2xl bg-card p-4 shadow-soft">
                    <p className="mb-3 text-sm font-bold text-primary">{day}</p>
                    <div className="space-y-2 text-sm">
                      {meals.map((m) => (
                        <div key={m.id} className="flex items-center justify-between">
                          <span className="text-muted-foreground capitalize">
                            {m.type === "meal" ? "🍽️ Meal" : "☕ Break"} {m.start_time}
                          </span>
                          <span className="font-semibold text-card-foreground">
                            {m.subject ?? m.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
              {allByDay.every((d) => d.meals.length === 0) && (
                <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
                  <Utensils className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p>No meal schedule found.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimetablePage;
