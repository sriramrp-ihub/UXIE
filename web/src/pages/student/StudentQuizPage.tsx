import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useMyCourses } from "../../features/courses/useCourses";
import { useQuizByCourse, useSubmitQuizMutation } from "../../features/quiz/useQuiz";

export default function StudentQuizPage() {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(900);

  const myCourses = useMyCourses();
  const quiz = useQuizByCourse(selectedCourseId);
  const submit = useSubmitQuizMutation();

  useEffect(() => {
    if (!quiz.data || submit.isSuccess) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [quiz.data, submit.isSuccess]);

  const formatted = useMemo(() => {
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
        <h1 className="text-xl font-semibold">Quiz Attempt</h1>
        <label className="label">Select course</label>
        <select className="input" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
          <option value="">Select enrolled course</option>
          {(myCourses.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-300">Timer: {formatted}</p>
      </section>

      <section className="card space-y-3">
        {!selectedCourseId ? (
          <EmptyState title="No course selected" hint="Choose a course to load its quiz." />
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
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </article>
            ))}

            <button
              className="btn"
              disabled={submit.isPending || submit.isSuccess}
              onClick={() =>
                submit.mutate({
                  quiz_id: quiz.data.id,
                  answers: Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })),
                })
              }
            >
              {submit.isPending ? "Submitting..." : submit.isSuccess ? "Submitted" : "Submit"}
            </button>
            {submit.data ? <p className="text-sm text-emerald-300">{submit.data.message ?? `Score: ${submit.data.score}`}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
