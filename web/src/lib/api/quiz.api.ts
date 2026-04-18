import { apiClient } from "./client";
import { unwrap } from "./helpers";

import type { Quiz, QuizAttempt } from "../../types/domain";

export const quizApi = {
  getQuizByCourse: async (courseId: string) => unwrap<Quiz>(await apiClient.get(`/quiz/${courseId}`)),
  submitQuiz: async (payload: { quiz_id: string; answers: Array<{ question_id: string; answer: string }> }) =>
    unwrap<QuizAttempt>(await apiClient.post("/quiz/submit", payload)),
};
