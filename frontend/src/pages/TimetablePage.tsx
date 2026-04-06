import { useState } from "react";
import { BookOpen, Utensils, Plus, Pencil, Trash2 } from "lucide-react";
import { useTimetable, useCreateSlot, useUpdateSlot, useDeleteSlot, TimetableSlot } from "@/hooks/useTimetable";
import { useClasses } from "@/hooks/useClasses";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const EMPTY_FORM = {
  type: "subject" as "subject" | "meal",
  day_of_week: "Monday",
  title: "",
  class_id: "" as string,
  time_start: "",
  time_end: "",
};

const TimetablePage = () => {
  const { user } = useAuth();
  const canEdit = user?.role !== "parent";

  const [tab, setTab] = useState<"subjects" | "meals">("subjects");
  const { data: slots = [], isLoading } = useTimetable();
  const { data: classes = [] } = useClasses();

  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();

  const [open, setOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditSlot(null);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  };

  const openEdit = (s: TimetableSlot) => {
    setEditSlot(s);
    setForm({
      type: s.type,
      day_of_week: s.day_of_week,
      title: s.title,
      class_id: s.class_id ? String(s.class_id) : "",
      time_start: s.time_start ?? "",
      time_end: s.time_end ?? "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this timetable slot?")) return;
    await deleteSlot.mutateAsync(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      type: form.type,
      day_of_week: form.day_of_week,
      title: form.title.trim(),
      class_id: form.class_id ? Number(form.class_id) : null,
      time_start: form.time_start || null,
      time_end: form.time_end || null,
    };
    try {
      if (editSlot) {
        await updateSlot.mutateAsync({ id: editSlot.id, ...payload });
      } else {
        await createSlot.mutateAsync(payload);
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Group by day, filtered by active tab type
  const tabType = tab === "subjects" ? "subject" : "meal";
  const byDay = DAYS.map((day) => ({
    day,
    slots: slots.filter((s) => s.day_of_week === day && s.type === tabType),
  })).filter((d) => d.slots.length > 0 || canEdit);

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

      {/* Add Slot button (staff/admin/school only) */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Slot
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {byDay.map(({ day, slots: daySlots }) => (
            <div key={day} className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="mb-3 text-sm font-bold text-primary">{day}</p>
              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No slots added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
                    >
                      <span title={`${s.time_start ?? ""}${s.time_start && s.time_end ? "–" : ""}${s.time_end ?? ""}${s.class ? " · " + s.class.name : ""}`}>
                        {s.title}
                        {s.time_start && (
                          <span className="ml-1 font-normal opacity-70">{s.time_start}</span>
                        )}
                      </span>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEdit(s)}
                            className="ml-1 rounded p-0.5 opacity-0 transition hover:bg-accent-foreground/10 group-hover:opacity-100"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="rounded p-0.5 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {byDay.every((d) => d.slots.length === 0) && !canEdit && (
            <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
              {tab === "subjects" ? (
                <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-30" />
              ) : (
                <Utensils className="mx-auto mb-2 h-8 w-8 opacity-30" />
              )}
              <p>No {tab === "subjects" ? "timetable" : "meal schedule"} set up yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editSlot ? "Edit Slot" : "Add Timetable Slot"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Type *</label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as "subject" | "meal" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject">Subject / Lesson</SelectItem>
                    <SelectItem value="meal">Meal / Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Day *</label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Mathematics, Lunch"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Class (optional)</label>
              <Select value={form.class_id || "__all__"} onValueChange={(v) => setForm((f) => ({ ...f, class_id: v === "__all__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All classes</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Start Time</label>
                <input
                  type="time"
                  value={form.time_start}
                  onChange={(e) => setForm((f) => ({ ...f, time_start: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">End Time</label>
                <input
                  type="time"
                  value={form.time_end}
                  onChange={(e) => setForm((f) => ({ ...f, time_end: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : editSlot ? "Save Changes" : "Add Slot"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimetablePage;

