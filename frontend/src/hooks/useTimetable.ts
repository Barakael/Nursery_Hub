import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface TimetableSlot {
  id: number;
  school_id: number;
  class_id: number;
  class_name?: string;
  day: string;
  start_time: string;
  end_time: string;
  subject?: string;
  type: "lesson" | "break" | "meal" | "activity";
  teacher_name?: string;
}

interface TimetableParams {
  class_id?: number | string;
  day?: string;
}

export const useTimetable = (params?: TimetableParams) =>
  useQuery({
    queryKey: ["timetable", params],
    queryFn: () =>
      api
        .get("/v1/timetable", { params })
        .then((r) => r.data.data as TimetableSlot[]),
  });

export const useCreateSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TimetableSlot>) =>
      api.post("/v1/timetable", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
};

export const useUpdateSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TimetableSlot> & { id: number }) =>
      api.put(`/v1/timetable/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
};

export const useDeleteSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/timetable/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
};
