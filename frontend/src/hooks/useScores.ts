import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export interface Score {
  id: number;
  student_id: number;
  subject_id: number;
  score: number;
  max_score: number;
  term: string;
  academic_year: string;
  percentage?: number;
  grade?: string;
  student?: { id: number; name: string };
  subject?: { id: number; name: string };
  recorded_at?: string;
}

interface ScoreParams {
  term?: string;
  academic_year?: string;
}

export const useScoresByStudent = (studentId: number, params?: ScoreParams) =>
  useQuery({
    queryKey: ["scores", "student", studentId, params],
    queryFn: () =>
      api
        .get(`/v1/scores/student/${studentId}`, { params })
        .then((r) => r.data.data as Score[]),
    enabled: !!studentId,
  });

export const useScoresBySubject = (subjectId: number, params?: ScoreParams) =>
  useQuery({
    queryKey: ["scores", "subject", subjectId, params],
    queryFn: () =>
      api
        .get(`/v1/scores/subject/${subjectId}`, { params })
        .then((r) => r.data.data as Score[]),
    enabled: !!subjectId,
  });

export const useUpsertScore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Score>) =>
      api.post("/v1/scores", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scores"] }),
  });
};
