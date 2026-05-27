import { useMemo, useState } from "react";
import { Building2, Loader2, Plus, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSchool, useSchools } from "@/hooks/useSchools";
import {
  useActivateSchoolSubscription,
  useCreateSchoolSubscription,
  useCreateSubscriptionPlan,
  useDeactivateSchoolSubscription,
  useSchoolSubscriptions,
  useSubscriptionPlans,
} from "@/hooks/useSubscriptions";

const today = () => new Date().toISOString().slice(0, 10);

const SchoolsPage = () => {
  const { toast } = useToast();
  const { data: schools = [], isLoading } = useSchools();
  const { data: plans = [] } = useSubscriptionPlans(true);

  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const { data: schoolSubscriptions = [] } = useSchoolSubscriptions(selectedSchoolId ?? undefined);

  const createSchool = useCreateSchool();
  const createPlan = useCreateSubscriptionPlan();
  const assignSubscription = useCreateSchoolSubscription();
  const activateSubscription = useActivateSchoolSubscription();
  const deactivateSubscription = useDeactivateSchoolSubscription();

  const [newSchoolOpen, setNewSchoolOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);

  const [schoolForm, setSchoolForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    manager_name: "",
    manager_email: "",
    manager_phone: "",
    manager_password: "",
  });

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price: "",
    billing_cycle: "monthly" as "monthly" | "yearly",
  });

  const [assignForm, setAssignForm] = useState({
    subscription_plan_id: "",
    starts_on: today(),
    ends_on: "",
  });

  const latestSubscription = useMemo(
    () => schoolSubscriptions[0] ?? null,
    [schoolSubscriptions]
  );

  const handleCreateSchool = async () => {
    try {
      await createSchool.mutateAsync({
        name: schoolForm.name,
        address: schoolForm.address || undefined,
        phone: schoolForm.phone || undefined,
        email: schoolForm.email || undefined,
        logo: schoolForm.logo || undefined,
        manager: {
          name: schoolForm.manager_name,
          email: schoolForm.manager_email,
          password: schoolForm.manager_password,
          phone: schoolForm.manager_phone || undefined,
        },
      });
      setNewSchoolOpen(false);
      setSchoolForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        logo: "",
        manager_name: "",
        manager_email: "",
        manager_phone: "",
        manager_password: "",
      });
      toast({ title: "School and manager created" });
    } catch {
      toast({ title: "Failed to create school", variant: "destructive" });
    }
  };

  const handleCreatePlan = async () => {
    try {
      await createPlan.mutateAsync({
        name: planForm.name,
        description: planForm.description || undefined,
        price: Number(planForm.price),
        billing_cycle: planForm.billing_cycle,
        is_active: true,
      });
      setNewPlanOpen(false);
      setPlanForm({ name: "", description: "", price: "", billing_cycle: "monthly" });
      toast({ title: "Subscription plan created" });
    } catch {
      toast({ title: "Failed to create plan", variant: "destructive" });
    }
  };

  const handleAssignSubscription = async () => {
    if (!selectedSchoolId) return;
    try {
      await assignSubscription.mutateAsync({
        school_id: selectedSchoolId,
        subscription_plan_id: Number(assignForm.subscription_plan_id),
        starts_on: assignForm.starts_on,
        ends_on: assignForm.ends_on || undefined,
        status: "active",
      });
      setAssignOpen(false);
      toast({ title: "Subscription assigned" });
    } catch {
      toast({ title: "Failed to assign subscription", variant: "destructive" });
    }
  };

  const toggleActive = async () => {
    if (!latestSubscription) return;
    try {
      if (latestSubscription.status === "active") {
        await deactivateSubscription.mutateAsync(latestSubscription.id);
        toast({ title: "School deactivated" });
      } else {
        await activateSubscription.mutateAsync(latestSubscription.id);
        toast({ title: "School activated" });
      }
    } catch {
      toast({ title: "Failed to change status", variant: "destructive" });
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Schools</h1>
          <p className="text-sm text-muted-foreground">Manage schools, managers and subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewPlanOpen(true)}>New Plan</Button>
          <Button onClick={() => setNewSchoolOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add School
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : schools.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-soft">
          <Building2 className="mx-auto mb-2 h-10 w-10 opacity-40" />
          No schools yet
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {schools.map((school) => (
            <button
              key={school.id}
              onClick={() => setSelectedSchoolId(school.id)}
              className={`rounded-2xl border p-4 text-left shadow-soft transition ${
                selectedSchoolId === school.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-foreground">{school.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{school.email || "No email"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Manager: {school.manager?.name ?? "Not assigned"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    school.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {school.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                <span>{school.students_count ?? 0} students</span>
                <span>•</span>
                <span>{school.classes_count ?? 0} classes</span>
                <span>•</span>
                <span>{school.current_subscription?.plan_name ?? "No plan"}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedSchoolId && (
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">Subscription Control</h3>
              <p className="text-xs text-muted-foreground">
                {latestSubscription
                  ? `${latestSubscription.plan?.name ?? "Plan"} • ${latestSubscription.status}`
                  : "No subscription assigned"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(true)}>Assign Plan</Button>
              {latestSubscription && (
                <Button
                  variant={latestSubscription.status === "active" ? "destructive" : "default"}
                  onClick={toggleActive}
                >
                  {latestSubscription.status === "active" ? (
                    <>
                      <PowerOff className="mr-1.5 h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="mr-1.5 h-4 w-4" /> Activate
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={newSchoolOpen} onOpenChange={setNewSchoolOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create School & Manager</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <Input placeholder="School name *" value={schoolForm.name} onChange={(e) => setSchoolForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="School email" value={schoolForm.email} onChange={(e) => setSchoolForm((f) => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Phone" value={schoolForm.phone} onChange={(e) => setSchoolForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input placeholder="Logo URL" value={schoolForm.logo} onChange={(e) => setSchoolForm((f) => ({ ...f, logo: e.target.value }))} />
            <Input className="sm:col-span-2" placeholder="Address" value={schoolForm.address} onChange={(e) => setSchoolForm((f) => ({ ...f, address: e.target.value }))} />
            <Input placeholder="Manager name *" value={schoolForm.manager_name} onChange={(e) => setSchoolForm((f) => ({ ...f, manager_name: e.target.value }))} />
            <Input placeholder="Manager email *" value={schoolForm.manager_email} onChange={(e) => setSchoolForm((f) => ({ ...f, manager_email: e.target.value }))} />
            <Input placeholder="Manager phone" value={schoolForm.manager_phone} onChange={(e) => setSchoolForm((f) => ({ ...f, manager_phone: e.target.value }))} />
            <Input type="password" placeholder="Manager password *" value={schoolForm.manager_password} onChange={(e) => setSchoolForm((f) => ({ ...f, manager_password: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSchoolOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSchool}
              disabled={!schoolForm.name || !schoolForm.manager_name || !schoolForm.manager_email || !schoolForm.manager_password}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Subscription</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Select
              value={assignForm.subscription_plan_id}
              onValueChange={(v) => setAssignForm((f) => ({ ...f, subscription_plan_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={String(plan.id)}>
                    {plan.name} • {plan.billing_cycle} • TSh {plan.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={assignForm.starts_on} onChange={(e) => setAssignForm((f) => ({ ...f, starts_on: e.target.value }))} />
            <Input type="date" value={assignForm.ends_on} onChange={(e) => setAssignForm((f) => ({ ...f, ends_on: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignSubscription} disabled={!assignForm.subscription_plan_id}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Subscription Plan</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Plan name" value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={planForm.description} onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))} />
            <Input type="number" placeholder="Price" value={planForm.price} onChange={(e) => setPlanForm((f) => ({ ...f, price: e.target.value }))} />
            <Select value={planForm.billing_cycle} onValueChange={(v: "monthly" | "yearly") => setPlanForm((f) => ({ ...f, billing_cycle: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPlanOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} disabled={!planForm.name || !planForm.price}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolsPage;
