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

export interface ClassPerformanceReport {
  class_id: number;
  class_name: string;
  subjects: Array<{
    subject_id: number;
    subject_name: string;
    average: number;
    count: number;
  }>;
}

export interface StudentReport {
  student: { id: number; name: string; class_name: string };
  scores: Array<{
    subject: string;
    score: number;
    max_score: number;
    percentage: number;
    grade: string;
    term: string;
    year: number;
  }>;
  balance: {
    total_fees: number;
    total_paid: number;
    remaining: number;
    percent_paid: number;
  };
}

export const useOverviewReport = () =>
  useQuery({
    queryKey: ["reports", "overview"],
    queryFn: () =>
      api.get("/v1/reports/overview").then((r) => r.data as OverviewReport),
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
