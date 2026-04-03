import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Payment {
  id: number;
  student_id: number;
  student_name?: string;
  fee_structure_id: number;
  fee_name?: string;
  amount: number;
  payment_date: string;
  reference?: string;
  method?: string;
}

export interface StudentBalance {
  student_id: number;
  student_name: string;
  total_fees: number;
  total_paid: number;
  remaining: number;
  percent_paid: number;
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
        .get("/v1/payments", { params: { student_id: studentId } })
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
    mutationFn: (data: Partial<Payment>) =>
      api.post("/v1/payments", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
};
