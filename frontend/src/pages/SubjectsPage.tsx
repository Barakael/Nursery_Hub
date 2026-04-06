import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, UserCircle } from "lucide-react";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  Subject,
} from "@/hooks/useSubjects";
import { useClasses } from "@/hooks/useClasses";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EMPTY = { name: "", class_id: "", teacher_id: "", description: "" };

const SubjectsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === "admin" || user?.role === "school";

  const { data: subjects = [], isLoading } = useSubjects();
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useUsers({ role: "teacher" });

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      name: s.name,
      class_id: String(s.class_id),
      teacher_id: s.teacher_id ? String(s.teacher_id) : "none",
      description: (s as any).description ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      class_id: Number(form.class_id),
      teacher_id: form.teacher_id && form.teacher_id !== "none" ? Number(form.teacher_id) : null,
      description: form.description.trim() || null,
    };
    try {
      if (editing) {
        await updateSubject.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Subject updated" });
      } else {
        await createSubject.mutateAsync(payload);
        toast({ title: "Subject added" });
      }
      setOpen(false);
    } catch {
      toast({ title: "Failed to save subject", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this subject? All associated scores will also be deleted.")) return;
    try {
      await deleteSubject.mutateAsync(id);
      toast({ title: "Subject deleted" });
    } catch {
      toast({ title: "Failed to delete subject", variant: "destructive" });
    }
  };

  const isPending = createSubject.isPending || updateSubject.isPending;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Subjects</h1>
          <p className="text-sm text-muted-foreground">
            Manage subjects and assign teachers
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Subject
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 opacity-30" />
          <p>No subjects yet</p>
          {canManage && (
            <p className="text-xs">Click "Add Subject" to create the first one</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft"
            >
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{s.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {s.class_name && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {s.class_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    {s.teacher_name ?? "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Subject Name *</label>
              <Input
                placeholder="e.g. Mathematics"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Class */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Class *</label>
              <Select
                value={form.class_id}
                onValueChange={(v) => setForm({ ...form, class_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class…" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Assign Teacher</label>
              <Select
                value={form.teacher_id}
                onValueChange={(v) => setForm({ ...form, teacher_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="none">— Unassigned —</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.class_id || isPending}
            >
              {isPending ? "Saving…" : editing ? "Save Changes" : "Add Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectsPage;
