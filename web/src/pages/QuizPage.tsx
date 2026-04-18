import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useMyCourses } from "../features/courses/useCourses";
import { useQuizByCourse, useSubmitQuizMutation } from "../features/quiz/useQuiz";

export default function QuizPage() {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(900);

  const myCourses = useMyCourses();
  const quiz = useQuizByCourse(selectedCourseId);
  const submitMutation = useSubmitQuizMutation();

  useEffect(() => {
    if (!quiz.data || submitMutation.isSuccess) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [quiz.data, submitMutation.isSuccess]);

  const formattedTime = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  if (myCourses.isLoading) {
    return <LoadingState message="Loading your courses..." />;
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-semibold">Quiz Interface</h1>
        <label className="label">Select course</label>
        <select className="input" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
          <option value="">Select enrolled course</option>
          {(myCourses.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-300">Timer: {formattedTime}</p>
      </section>

      <section className="card space-y-3">
        {!selectedCourseId ? (
          <EmptyState title="No course selected" hint="Choose a course to load a quiz." />
        ) : quiz.isLoading ? (
          <p className="text-sm text-slate-400">Loading quiz...</p>
        ) : !quiz.data ? (
          <EmptyState title="No quiz available" hint="This course does not have a quiz yet." />
        ) : (
          <>
            {quiz.data.questions.map((q, idx) => (
              <article key={q.id} className="rounded-lg border border-slate-700 p-4">
                <p className="font-medium">
                  {idx + 1}. {q.question}
                </p>
                <div className="mt-2 space-y-2">
                  {q.options.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === option}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </article>
            ))}
            <button
              className="btn"
              disabled={submitMutation.isPending || submitMutation.isSuccess}
              onClick={() =>
                submitMutation.mutate({
                  quiz_id: quiz.data.id,
                  answers: Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })),
                })
              }
            >
              {submitMutation.isPending ? "Submitting..." : submitMutation.isSuccess ? "Submitted" : "Submit Quiz"}
            </button>
            {submitMutation.data ? <p className="text-sm text-emerald-300">{submitMutation.data.message ?? `Score: ${submitMutation.data.score}`}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
