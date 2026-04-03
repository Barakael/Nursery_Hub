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

export interface StudentBalance {
  total: number;
  paid: number;
  remaining: number;
  percent: number;
  structure?: { id: number; name: string; term: string } | null;
}

export const usePayments = () =>
  useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get("/v1/payments").then((r) => r.data.data as Payment[]),
  });

export const useStudentPayments = (studentId: number) =>
  useQuery({
    queryKey: ["payments", "student", studentId],
    queryFn: () =>
      api
        .get(`/v1/payments/student/${studentId}`)
        .then((r) => r.data.data as Payment[]),
    enabled: !!studentId,
  });

export const useStudentBalance = (studentId: number) =>
  useQuery({
    queryKey: ["payments", "balance", studentId],
    queryFn: () =>
      api
        .get(`/v1/payments/student/${studentId}/balance`)
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
};
