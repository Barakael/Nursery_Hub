import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "school" | "teacher" | "parent";
  phone?: string;
  school_id?: number;
  school_name?: string;
  avatar?: string;
}

interface UsersParams {
  role?: string;
}

export const useUsers = (params?: UsersParams) =>
  useQuery({
    queryKey: ["users", params],
    queryFn: () =>
      api.get("/v1/users", { params }).then((r) => r.data.data as AppUser[]),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppUser> & { password: string }) =>
      api.post("/v1/users", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AppUser> & { id: number }) =>
      api.put(`/v1/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};
