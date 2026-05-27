import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export interface OverviewReport {
  total_students: number;
  total_classes: number;
  total_teachers: number;
  total_parents: number;
  total_fees: number;
  total_collected: number;
  collection_percent: number;
  paid_full: number;
  paid_partial: number;
  unpaid: number;
  students: Array<{
    id: number;
    name: string;
    class_name: string;
    total_fees: number;
    total_paid: number;
    remaining: number;
  }>;
  enrollment_by_class: Array<{
    class_name: string;
    student_count: number;
  }>;
  recent_admissions: Array<{
    id: number;
    name: string;
    admission_number: string;
    class_name: string;
    enrolled_at: string;
  }>;
}

export interface FeeStructureReport {
  fee_structure: {
    id: number;
    name: string;
    term?: string | null;
    academic_year?: string | null;
    class_id?: number | null;
    class_name?: string | null;
  };
  total_students: number;
  total_fees: number;
  total_collected: number;
  remaining: number;
  collection_percent: number;
  students: Array<{
    id: number;
    name: string;
    class_name: string;
    total_fees: number;
    total_paid: number;
    remaining: number;
  }>;
}

export interface ClassPerformanceReport {
  class_id: number;
  class_name: string;
  overall_avg: number | null;
  subjects: Array<{
    subject_id: number;
    subject_name: string;
    avg_score: number | null;
    count: number;
  }>;
}

export interface StudentReport {
  student: { id: number; name: string; class: string };
  performance: {
    avg_percent: number | null;
    subject_count: number;
    scores: Array<{
      subject: string;
      score: number;
      max: number;
      grade: string;
      percent: number;
    }>;
  };
  payments: {
    total: number;
    paid: number;
    remaining: number;
    percent: number;
    structure?: { id: number; name: string; term: string } | null;
  };
}

export interface ClassStudentScores {
  class_id: number;
  class_name: string;
  subjects: Array<{ id: number; name: string }>;
  students: Array<{
    id: number;
    name: string;
    admission_number: string;
    avg_percent: number | null;
    subjects: Array<{
      subject_id: number;
      subject_name: string;
      score: number | null;
      max_score: number;
      grade: string | null;
      percent: number | null;
    }>;
  }>;
}

export const useClassStudentScores = (classId: number, params?: { term?: string; academic_year?: string }) =>
  useQuery({
    queryKey: ["reports", "class", classId, "scores", params],
    queryFn: () =>
      api
        .get(`/v1/reports/class/${classId}/scores`, { params })
        .then((r) => r.data as ClassStudentScores),
    enabled: !!classId,
  });

export const useOverviewReport = (params?: { school_id?: number; fee_structure_id?: number }) =>
  useQuery({
    queryKey: ["reports", "overview", params],
    queryFn: () =>
      api.get("/v1/reports/overview", { params }).then((r) => r.data as OverviewReport),
  });

export const useFeeStructureReport = (feeStructureId?: number, params?: { school_id?: number }) =>
  useQuery({
    queryKey: ["reports", "fee-structure", feeStructureId, params],
    queryFn: () =>
      api
        .get(`/v1/reports/fee-structure/${feeStructureId}`, { params })
        .then((r) => r.data as FeeStructureReport),
    enabled: !!feeStructureId,
  });

export const useClassReport = (classId: number) =>
  useQuery({
    queryKey: ["reports", "class", classId],
    queryFn: () =>
      api
        .get(`/v1/reports/class/${classId}`)
        .then((r) => r.data as ClassPerformanceReport),
    enabled: !!classId,
  });

export const useStudentReport = (studentId: number) =>
  useQuery({
    queryKey: ["reports", "student", studentId],
    queryFn: () =>
      api
        .get(`/v1/reports/student/${studentId}`)
        .then((r) => r.data as StudentReport),
    enabled: !!studentId,
  });
