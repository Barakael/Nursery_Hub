import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface FeeStructure {
  id: number;
  name: string;
  total_amount: number;
  amount: number; // alias used in UI
  term: string;
  academic_year: string;
  year: number; // alias used in UI
  school_id: number;
  class_id?: number | null;
  class_name?: string | null;
  collected?: number;
  pending?: number;
  collection_percent?: number;
}

export const useFeeStructures = () =>
  useQuery({
    queryKey: ["fee-structures"],
    queryFn: () =>
      api.get("/v1/fee-structures").then((r) => r.data.data as FeeStructure[]),
  });

export const useCreateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FeeStructure>) =>
      api.post("/v1/fee-structures", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-structures"] }),
  });
};

export const useUpdateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<FeeStructure> & { id: number }) =>
      api.put(`/v1/fee-structures/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-structures"] }),
  });
};

export const useDeleteFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/fee-structures/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-structures"] }),
  });
};
