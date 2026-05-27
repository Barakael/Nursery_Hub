import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  billing_cycle: "monthly" | "yearly";
  is_active: boolean;
}

export interface SchoolSubscription {
  id: number;
  school_id: number;
  status: "active" | "inactive" | "expired" | "cancelled";
  starts_on: string;
  ends_on?: string | null;
  notes?: string | null;
  plan?: {
    id: number;
    name: string;
    price: number;
    billing_cycle: "monthly" | "yearly";
  };
}

export const useSubscriptionPlans = (activeOnly = false) =>
  useQuery({
    queryKey: ["subscription-plans", { activeOnly }],
    queryFn: () =>
      api
        .get("/v1/subscription-plans", { params: activeOnly ? { active_only: true } : undefined })
        .then((r) => r.data.data as SubscriptionPlan[]),
  });

export const useCreateSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SubscriptionPlan>) =>
      api.post("/v1/subscription-plans", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription-plans"] }),
  });
};

export const useSchoolSubscriptions = (schoolId?: number) =>
  useQuery({
    queryKey: ["school-subscriptions", schoolId],
    queryFn: () =>
      api
        .get("/v1/school-subscriptions", { params: schoolId ? { school_id: schoolId } : undefined })
        .then((r) => r.data.data as SchoolSubscription[]),
    enabled: !!schoolId,
  });

export const useCreateSchoolSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      school_id: number;
      subscription_plan_id: number;
      starts_on: string;
      ends_on?: string;
      status?: SchoolSubscription["status"];
      notes?: string;
    }) => api.post("/v1/school-subscriptions", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["schools"] });
    },
  });
};

export const useActivateSchoolSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/v1/school-subscriptions/${id}/activate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["schools"] });
    },
  });
};

export const useDeactivateSchoolSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/v1/school-subscriptions/${id}/deactivate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["schools"] });
    },
  });
};

export const useMySchoolSubscription = () =>
  useQuery({
    queryKey: ["school-subscriptions", "me"],
    queryFn: () =>
      api.get("/v1/school-subscriptions/me").then((r) => (r.data.data ?? null) as SchoolSubscription | null),
  });
