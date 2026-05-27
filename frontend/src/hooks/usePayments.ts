import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Payment {
  id: number;
  student_id: number;
  fee_structure_id: number;
  amount_paid: number;
  payment_date: string;
  reference?: string;
  method?: string;
  notes?: string;
  student?: { id: number; name: string };
  fee_structure?: { id: number; name: string; total: number };
  recorded_by_name?: string;
}

export interface FeeStructureBalance {
  id: number;
  name: string;
  term: string;
  academic_year?: string;
  total: number;
  paid: number;
  remaining: number;
  percent: number;
}

export interface StudentBalance {
  total: number;
  paid: number;
  remaining: number;
  percent: number;
  structure?: FeeStructureBalance | null;
  structures?: FeeStructureBalance[];
}

export const usePayments = (params?: { school_id?: number; fee_structure_id?: number }) =>
  useQuery({
    queryKey: ["payments", params],
    queryFn: () => api.get("/v1/payments", { params }).then((r) => r.data.data as Payment[]),
  });

export const useStudentPayments = (studentId: number, params?: { school_id?: number }) =>
  useQuery({
    queryKey: ["payments", "student", studentId, params],
    queryFn: () =>
      api
        .get(`/v1/payments/student/${studentId}`, { params })
        .then((r) => r.data.data as Payment[]),
    enabled: !!studentId,
  });

export const useStudentBalance = (studentId: number, params?: { school_id?: number }) =>
  useQuery({
    queryKey: ["payments", "balance", studentId, params],
    queryFn: () =>
      api
        .get(`/v1/payments/student/${studentId}/balance`, { params })
        .then((r) => r.data as StudentBalance),
    enabled: !!studentId,
  });

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      student_id: number;
      fee_structure_id: number;
      amount_paid: number;
      payment_date: string;
      method?: string;
      reference?: string;
      notes?: string;
    }) => api.post("/v1/payments", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
    },
  });
};
