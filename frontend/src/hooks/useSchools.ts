import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface SchoolItem {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
  is_active: boolean;
  students_count?: number;
  classes_count?: number;
  manager?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  current_subscription?: {
    id: number;
    status: string;
    starts_on?: string | null;
    ends_on?: string | null;
    plan_name?: string | null;
    plan_id?: number | null;
  } | null;
}

export interface CreateSchoolPayload {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  manager: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  };
}

export const useSchools = () =>
  useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get("/v1/schools").then((r) => r.data.data as SchoolItem[]),
  });

export const useCreateSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSchoolPayload) => api.post("/v1/schools", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schools"] }),
  });
};

export const useUpdateSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SchoolItem> & { id: number }) =>
      api.put(`/v1/schools/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schools"] }),
  });
};
