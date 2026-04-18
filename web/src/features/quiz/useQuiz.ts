import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { quizApi } from "../../lib/api/quiz.api";

export function useQuizByCourse(courseId: string) {
  return useQuery({
    queryKey: ["quiz", courseId],
    queryFn: () => quizApi.getQuizByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useSubmitQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quizApi.submitQuiz,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["analytics", "me"] });
    },
  });
}
