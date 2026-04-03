import { useState } from "react";
import { Plus, Trash2, Mail, Phone, UserCircle } from "lucide-react";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/useUsers";
import { useClasses } from "@/hooks/useClasses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Role = "teacher" | "parent";

const EMPTY = { name: "", email: "", phone: "", password: "", role: "teacher" as Role };

const roleColors: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-700",
  parent:  "bg-green-100 text-green-700",
};

const UsersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Role>("teacher");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, role: tab });

  const { data: users = [], isLoading } = useUsers({ role: tab });
  const { data: classes = [] } = useClasses();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const canManage = user?.role === "admin" || user?.role === "school";

  const openAdd = () => { setForm({ ...EMPTY, role: tab }); setOpen(true); };

  const handleSave = async () => {
    try {
      await createUser.mutateAsync(form);
      toast({ title: `${tab === "teacher" ? "Teacher" : "Parent"} added` });
      setOpen(false);
    } catch {
      toast({ title: "Failed to add user", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this user?")) return;
    await deleteUser.mutateAsync(id);
    toast({ title: "User removed" });
  };

  const switchTab = (t: Role) => {
    setTab(t);
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Staff & parents</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add {tab === "teacher" ? "Teacher" : "Parent"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-card p-1.5 shadow-soft">
        {(["teacher", "parent"] as Role[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all capitalize ${
              tab === t
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}s
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <UserCircle className="h-12 w-12 opacity-30" />
          <p>No {tab}s yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary uppercase">
                {u.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{u.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {u.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {u.email}
                    </span>
                  )}
                  {u.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {u.phone}
                    </span>
                  )}
                </div>
              </div>
              <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block ${roleColors[u.role] ?? ""}`}>
                {u.role}
              </span>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(u.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {form.role === "teacher" ? "Teacher" : "Parent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as Role })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234…" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password *</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.email || !form.password || createUser.isPending}
            >
              {createUser.isPending ? "Saving…" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
