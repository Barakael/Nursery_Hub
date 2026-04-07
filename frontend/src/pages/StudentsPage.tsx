import { useState } from "react";
import { Search, Plus, Upload, Trash2, Pencil, ChevronLeft, ChevronRight, Users, User, BookOpen, Calendar, UserRound, Phone, ArrowLeft, ChevronRight as ArrowRight, GraduationCap } from "lucide-react";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useImportStudents, Student } from "@/hooks/useStudents";
import { useClasses, SchoolClass } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EMPTY = { name: "", admission_number: "", class_id: "", dob: "", gender: "", parent_name: "", parent_phone: "", parent_phone2: "", parent_email: "" };

const StudentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Class drill-down
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);

  // Add / Edit dialog
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  // View sheet
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const { data, isLoading } = useStudents({
    search: search || undefined,
    class_id: selectedClass ? String(selectedClass.id) : undefined,
    page,
  });
  const students = data?.data ?? [];
  const meta = data?.meta;
  const totalStudents = meta?.total ?? students.length;
  const lastPage = meta?.last_page ?? 1;

  const { data: classesData } = useClasses();
  const classes = classesData ?? [];

  // For teachers, only show classes they have subjects in
  const { data: mySubjects = [] } = useSubjects();
  const visibleClasses = user?.role === "teacher"
    ? classes.filter((c) => mySubjects.some((s) => s.class_id === c.id))
    : classes;

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const importStudents = useImportStudents();

  const canManage = user?.role === "admin" || user?.role === "school";

  const openAdd = () => {
    setEditStudent(null);
    setForm({ ...EMPTY, class_id: selectedClass ? String(selectedClass.id) : "" });
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      name: s.name,
      admission_number: s.admission_number,
      class_id: String(s.class_id),
      dob: s.dob ?? "",
      gender: s.gender ?? "",
      parent_name: s.parent?.name ?? "",
      parent_phone: s.parent?.phone ?? "",
      parent_phone2: s.parent?.phone2 ?? "",
      parent_email: s.parent?.email ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editStudent) {
        await updateStudent.mutateAsync({ id: editStudent.id, ...form, class_id: Number(form.class_id) });
        toast({ title: "Student updated" });
      } else {
        await createStudent.mutateAsync({ ...form, class_id: Number(form.class_id) });
        toast({ title: "Student added" });
      }
      setOpen(false);
      setForm(EMPTY);
      setEditStudent(null);
    } catch {
      toast({ title: editStudent ? "Failed to update student" : "Failed to add student", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return;
    await deleteStudent.mutateAsync(id);
    toast({ title: "Student removed" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importStudents.mutateAsync(file);
      toast({ title: "Students imported successfully" });
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleSelectClass = (c: SchoolClass) => {
    setSelectedClass(c);
    setSearch("");
    setPage(1);
  };

  const handleBack = () => {
    setSelectedClass(null);
    setSearch("");
    setPage(1);
  };

  // ── CLASS CARDS VIEW ─────────────────────────────────────────────────────────
  if (!selectedClass) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">Select a class to view its students</p>
        </div>

        {visibleClasses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Users className="h-12 w-12 opacity-30" />
            <p>No classes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectClass(c)}
                className="group relative overflow-hidden rounded-xl bg-card shadow-card text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Top bar */}
                <div className="h-1.5 w-full bg-primary" />

                <div className="flex items-center gap-3 px-3 py-3 mb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-md text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                      {c.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.student_count ?? 0} students
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── STUDENTS LIST VIEW ───────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedClass.name}</h1>
            <p className="text-sm text-muted-foreground">{totalStudents} students</p>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />
              <Button variant="outline" size="sm" className="pointer-events-none">
                <Upload className="mr-1.5 h-4 w-4" /> Import
              </Button>
            </label>
            <Button size="sm" onClick={openAdd}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students…"
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Users className="h-12 w-12 opacity-30" />
          <p>No students found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-accent/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Admission #</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Gender</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Parent Phones</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <button
                        className="text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                        onClick={() => setViewStudent(s)}
                      >
                        {s.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.admission_number}</td>
                    <td className="px-4 py-3 capitalize">{s.gender ?? "—"}</td>
                    <td className="px-4 py-3">
                      {s.parent?.phone || s.parent?.phone2 ? (
                        <div className="space-y-0.5">
                          {s.parent.phone && <p className="text-xs text-muted-foreground">{s.parent.phone}</p>}
                          {s.parent.phone2 && <p className="text-xs text-muted-foreground opacity-70">{s.parent.phone2}</p>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(s.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {students.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-card shadow-card overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setViewStudent(s)}
              >
                <div className="flex flex-col p-3.5 gap-2">
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate leading-tight">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{s.admission_number}</p>
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center justify-between gap-1">
                    {s.gender ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">
                        {s.gender}
                      </span>
                    ) : <span />}
                    {canManage && (
                      <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-7 w-7 text-muted-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-muted-foreground">
                Page {page} of {lastPage} &middot; {totalStudents} students
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Student Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditStudent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emma Johnson" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Admission Number</label>
              <Input value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} placeholder="Auto-generated if blank" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Class *</label>
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Gender</label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Parent / Guardian */}
            <div className="rounded-xl border border-dashed border-border p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent / Guardian</p>
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} placeholder="e.g. John Johnson" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone 1</label>
                  <Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} placeholder="e.g. +255712…" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone 2 <span className="text-muted-foreground font-normal">(emergency)</span></label>
                  <Input value={form.parent_phone2} onChange={(e) => setForm({ ...form, parent_phone2: e.target.value })} placeholder="e.g. +255756…" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input type="email" value={form.parent_email} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} placeholder="Email" />
              </div>
              <p className="text-[11px] text-muted-foreground">Portal login will be created automatically with password <strong>Parent123</strong>.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.class_id || createStudent.isPending || updateStudent.isPending}
            >
              {(createStudent.isPending || updateStudent.isPending) ? "Saving…" : editStudent ? "Save Changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Sheet */}
      <Sheet open={!!viewStudent} onOpenChange={(v) => { if (!v) setViewStudent(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {viewStudent && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                    {viewStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-lg">{viewStudent.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{viewStudent.admission_number}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <div className="rounded-xl bg-accent/40 p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Details</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Class</span>
                    <span className="ml-auto font-medium">{viewStudent.class?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Gender</span>
                    <span className="ml-auto font-medium capitalize">{viewStudent.gender ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="ml-auto font-medium">
                      {viewStudent.dob ? new Date(viewStudent.dob).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>

                {viewStudent.parent && (
                  <div className="rounded-xl bg-accent/40 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parent / Guardian</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Name</span>
                      <span className="ml-auto font-medium">{viewStudent.parent.name}</span>
                    </div>
                    {viewStudent.parent.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Phone 1</span>
                        <span className="ml-auto font-medium">{viewStudent.parent.phone}</span>
                      </div>
                    )}
                    {viewStudent.parent.phone2 && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Phone 2</span>
                        <span className="ml-auto font-medium">{viewStudent.parent.phone2}</span>
                      </div>
                    )}
                  </div>
                )}

                {canManage && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => { setViewStudent(null); openEdit(viewStudent); }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit Student
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => { setViewStudent(null); handleDelete(viewStudent.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StudentsPage;
