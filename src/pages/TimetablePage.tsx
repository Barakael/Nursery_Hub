import { useState } from "react";
import { BookOpen, Utensils } from "lucide-react";

const subjectTimetable = [
  { day: "Monday", subjects: ["Mathematics", "English", "Science", "Creative Arts"] },
  { day: "Tuesday", subjects: ["English", "Social Studies", "Mathematics", "P.E."] },
  { day: "Wednesday", subjects: ["Science", "Creative Arts", "English", "Mathematics"] },
  { day: "Thursday", subjects: ["Social Studies", "Mathematics", "P.E.", "Science"] },
  { day: "Friday", subjects: ["English", "Creative Arts", "Social Studies", "Free Play"] },
];

const mealTimetable = [
  { day: "Monday", breakfast: "Oat Porridge", lunch: "Jollof Rice & Chicken", snack: "Fruit Salad" },
  { day: "Tuesday", breakfast: "Bread & Eggs", lunch: "Fried Rice & Fish", snack: "Biscuits" },
  { day: "Wednesday", breakfast: "Cereal & Milk", lunch: "Yam & Egg Sauce", snack: "Banana" },
  { day: "Thursday", breakfast: "Pancakes", lunch: "Beans & Plantain", snack: "Cookies" },
  { day: "Friday", breakfast: "Toast & Tea", lunch: "Spaghetti & Meatballs", snack: "Yoghurt" },
];

const TimetablePage = () => {
  const [tab, setTab] = useState<"subjects" | "meals">("subjects");

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

      {/* Subject Timetable */}
      {tab === "subjects" && (
        <div className="space-y-3">
          {subjectTimetable.map((day) => (
            <div key={day.day} className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="mb-2 text-sm font-bold text-secondary">{day.day}</p>
              <div className="flex flex-wrap gap-2">
                {day.subjects.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal Timetable */}
      {tab === "meals" && (
        <div className="space-y-3">
          {mealTimetable.map((day) => (
            <div key={day.day} className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="mb-3 text-sm font-bold text-secondary">{day.day}</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "🌅 Breakfast", value: day.breakfast },
                  { label: "🍽️ Lunch", value: day.lunch },
                  { label: "🍪 Snack", value: day.snack },
                ].map((meal) => (
                  <div key={meal.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{meal.label}</span>
                    <span className="font-semibold text-card-foreground">{meal.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
