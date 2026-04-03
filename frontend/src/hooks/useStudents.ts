import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Student {
  id: number;
  name: string;
  admission_number: string;
  class_id: number;
  class?: { id: number; name: string } | null;
  parent_id?: number;
  parent?: { id: number; name: string; phone?: string } | null;
  dob?: string;
  gender?: string;
  photo?: string;
  school_id: number;
}

interface StudentsParams {
  search?: string;
  class_id?: number | string;
  page?: number;
  per_page?: number;
}

export const useStudents = (params?: StudentsParams) =>
  useQuery({
    queryKey: ["students", params],
    queryFn: () => api.get("/v1/students", { params }).then((r) => r.data),
  });

export const useStudent = (id: number) =>
  useQuery({
    queryKey: ["students", id],
    queryFn: () => api.get(`/v1/students/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Student>) =>
      api.post("/v1/students", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Student> & { id: number }) =>
      api.put(`/v1/students/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
};

export const useImportStudents = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post("/v1/students/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
};
