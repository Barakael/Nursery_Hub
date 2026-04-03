import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Subject {
  id: number;
  name: string;
  class_id: number;
  class_name?: string;
  teacher_id?: number;
  teacher_name?: string;
}

interface SubjectsParams {
  class_id?: number | string;
}

export const useSubjects = (params?: SubjectsParams) =>
  useQuery({
    queryKey: ["subjects", params],
    queryFn: () =>
      api.get("/v1/subjects", { params }).then((r) => r.data.data as Subject[]),
  });

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Subject>) =>
      api.post("/v1/subjects", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Subject> & { id: number }) =>
      api.put(`/v1/subjects/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
};
