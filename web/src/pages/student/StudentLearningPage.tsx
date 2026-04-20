import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useCourseStructure, useMyCourses, useProgressByCourse } from "../../features/courses/useCourses";

function cleanTitle(value: string): string {
  const normalized = value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "Lesson";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function StudentLearningPage() {
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const myCourses = useMyCourses();
  const progress = useProgressByCourse(selectedCourseId);
  const structure = useCourseStructure(selectedCourseId);

  const completionRate = progress.data?.completion_percentage ?? 0;

  useEffect(() => {
    if (selectedCourseId) {
      return;
    }
    const firstCourseId = myCourses.data?.[0]?.id;
    if (firstCourseId) {
      setSelectedCourseId(firstCourseId);
    }
  }, [myCourses.data, selectedCourseId]);

  const learningUnits = useMemo(() => {
    return (structure.data?.modules ?? []).flatMap((module) =>
      module.lessons.map((lesson, lessonIndex) => ({
        id: lesson.id,
        title: cleanTitle(lesson.title),
        moduleTitle: cleanTitle(module.title),
        label: `Lesson ${lessonIndex + 1}`,
      }))
    );
  }, [structure.data]);

  const completedLessonIds = useMemo(() => {
    const completed = new Set<string>();
    (progress.data?.items ?? []).forEach((item) => {
      if (item.completed) completed.add(item.lesson_id);
    });
    return completed;
  }, [progress.data]);

  const nextLesson = useMemo(() => {
    if (!learningUnits.length) return null;
    return learningUnits.find((lesson) => !completedLessonIds.has(lesson.id)) ?? learningUnits[0];
  }, [learningUnits, completedLessonIds]);

  if (myCourses.isLoading) return <LoadingState message="Loading your learning hub..." />;
  if (!(myCourses.data ?? []).length) {
    return (
      <EmptyState
        title="No active courses yet"
        hint="Once you enroll in a course, your learning center will appear here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Learning Center</h1>
        <p className="text-sm text-slate-600">Pick a course and continue exactly where you left off.</p>

        <label className="label">Choose a course</label>
        <select className="input" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
          <option value="">Select course</option>
          {(myCourses.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Your progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, completionRate))}%` }} />
          </div>
        </div>
      </section>

      {!selectedCourseId ? (
        <EmptyState title="Choose a course to begin" hint="Select one of your enrolled courses to see your next lesson." />
      ) : (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Continue Learning</h2>

            {structure.isLoading || progress.isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Preparing your lessons...</p>
              </div>
            ) : nextLesson ? (
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Up next</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{nextLesson.title}</p>
                <p className="mt-1 text-sm text-slate-600">{nextLesson.moduleTitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link className="btn" to={`/student/courses/${selectedCourseId}`}>
                    Continue learning
                  </Link>
                  <Link className="btn-secondary" to="/student/courses">
                    View all courses
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState title="No lessons available" hint="Your instructor is preparing content for this course." />
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700">Lesson Checklist</h3>
              <div className="mt-2 space-y-2">
                {learningUnits.length ? (
                  learningUnits.map((lesson) => {
                    const done = completedLessonIds.has(lesson.id);
                    return (
                      <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{lesson.label}: {lesson.title}</p>
                          <p className="text-xs text-slate-600">{lesson.moduleTitle}</p>
                        </div>
                        <span
                          className={
                            done
                              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                              : "rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600"
                          }
                        >
                          {done ? "Completed" : "Next"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No lessons available yet.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="card space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            {(progress.data?.items ?? []).length ? (
              <div className="space-y-2">
                {(progress.data?.items ?? []).slice(0, 8).map((entry) => (
                  <div key={entry.lesson_id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">{cleanTitle(entry.lesson_title ?? "Lesson")}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.completed ? "Completed" : "In progress"}
                      {entry.completed_at ? ` · ${new Date(entry.completed_at).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No activity yet" hint="Start your next lesson to build momentum." />
            )}
          </aside>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Tips for Steady Progress</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {["Learn in short sessions", "Resume where you paused", "Aim for one lesson per day"].map((tip) => (
            <div key={tip} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {tip}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
