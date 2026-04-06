import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Subject {
  id: number;
  name: string;
  description?: string;
  class_id: number;
  class_name?: string;
  class?: { id: number; name: string } | null;
  teacher_id?: number | null;
  teacher_name?: string;
  teacher?: { id: number; name: string } | null;
}

interface SubjectsParams {
  class_id?: number | string;
}

export const useSubjects = (params?: SubjectsParams) =>
  useQuery({
    queryKey: ["subjects", params],
    queryFn: () =>
      api.get("/v1/subjects", { params }).then((r) => {
        const raw: any[] = r.data.data ?? r.data;
        return raw.map((s): Subject => ({
          ...s,
          class_id: s.class_id ?? s.class?.id,
          class_name: s.class_name ?? s.class?.name,
          teacher_id: s.teacher_id ?? s.teacher?.id ?? null,
          teacher_name: s.teacher_name ?? s.teacher?.name ?? undefined,
        }));
      }),
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
