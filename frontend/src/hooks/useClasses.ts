import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface SchoolClass {
  id: number;
  name: string;
  school_id: number;
  student_count?: number;
}

export const useClasses = () =>
  useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/v1/classes").then((r) => r.data.data as SchoolClass[]),
  });

export const useCreateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SchoolClass>) =>
      api.post("/v1/classes", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
};

export const useUpdateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SchoolClass> & { id: number }) =>
      api.put(`/v1/classes/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
};

export const useDeleteClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
};
