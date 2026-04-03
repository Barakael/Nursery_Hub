import { useState } from "react";
import { Plus, Trash2, Pencil, GraduationCap } from "lucide-react";
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from "@/hooks/useClasses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ClassesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [name, setName] = useState("");

  const { data: classes = [], isLoading } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const canManage = user?.role === "admin" || user?.role === "school";

  const openNew = () => { setEditing(null); setName(""); setOpen(true); };
  const openEdit = (c: { id: number; name: string }) => { setEditing(c); setName(c.name); setOpen(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateClass.mutateAsync({ id: editing.id, name });
        toast({ title: "Class updated" });
      } else {
        await createClass.mutateAsync({ name });
        toast({ title: "Class created" });
      }
      setOpen(false);
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, className: string) => {
    if (!confirm(`Delete class "${className}"? All students in this class must be moved first.`)) return;
    try {
      await deleteClass.mutateAsync(id);
      toast({ title: "Class deleted" });
    } catch {
      toast({ title: "Cannot delete — class may have students", variant: "destructive" });
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground">{classes.length} classes</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" /> New Class
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <GraduationCap className="h-12 w-12 opacity-30" />
          <p>No classes yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(c.id, c.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">{c.name}</p>
              <p className="text-sm text-muted-foreground">
                {c.students_count ?? 0} student{c.students_count !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Class" : "New Class"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1 block text-sm font-medium">Class Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nursery 1"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || createClass.isPending || updateClass.isPending}
            >
              {createClass.isPending || updateClass.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesPage;
