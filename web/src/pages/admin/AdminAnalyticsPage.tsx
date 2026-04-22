import { useState } from "react";

import {
  useCourseAnalytics,
  useDetailedCourseAnalytics,
  useGlobalDashboard,
} from "../../features/analytics/useAnalytics";
import { useCatalog } from "../../features/courses/useCourses";

export default function AdminAnalyticsPage() {
  const [courseId, setCourseId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const catalog = useCatalog();
  const global = useGlobalDashboard(true);
  const course = useCourseAnalytics(courseId, enabled);
  const detailed = useDetailedCourseAnalytics(courseId, enabled);

  return (
    <div className="space-y-5">
      <section className="card space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Platform Analytics</h1>
        <p className="text-sm text-slate-600">Understand performance trends across the entire learning platform.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System Completion</p>
            <p className="text-2xl font-semibold text-slate-900">{global.data?.completion_percentage ?? 0}%</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</p>
            <p className="text-2xl font-semibold text-slate-900">{Math.round(global.data?.average_score ?? 0)}%</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning Time</p>
            <p className="text-2xl font-semibold text-slate-900">{global.data?.time_spent ?? 0} sec</p>
          </article>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completion Trend (snapshot)</p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, global.data?.completion_percentage ?? 0))}%` }}
            />
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Course Analytics</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {(catalog.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => setEnabled(true)}>
            Load
          </button>
        </div>
        {course.data ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completion</p>
              <p className="text-2xl font-semibold text-slate-900">{course.data.completion_percentage}%</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</p>
              <p className="text-2xl font-semibold text-slate-900">{Math.round(course.data.average_score)}%</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time Spent</p>
              <p className="text-2xl font-semibold text-slate-900">{course.data.time_spent} sec</p>
            </article>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Choose a course and load analytics.</p>
        )}
      </section>

      {enabled && courseId ? (
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Learner Time Breakdown</h2>
          {detailed.isLoading ? (
            <p className="text-sm text-slate-600">Loading detailed analytics...</p>
          ) : !detailed.data ? (
            <p className="text-sm text-slate-600">No detailed analytics available.</p>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  Course: <span className="font-semibold">{detailed.data.course_title ?? "Course"}</span>
                </p>
                <p>
                  Enrolled students: <span className="font-semibold">{detailed.data.enrolled_students}</span>
                </p>
              </div>

              <div className="space-y-3">
                {detailed.data.learners.length ? (
                  detailed.data.learners.map((learner) => (
                    <article key={learner.user_id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{learner.name}</p>
                          <p className="text-xs text-slate-500">{learner.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                            Completion: {Math.round(learner.completion_percentage)}%
                          </span>
                          <span className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                            Score: {Math.round(learner.average_score)}%
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                            SCORM: {learner.scorm_time_spent} sec
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                            Total: {learner.total_time_spent} sec
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time spent by module</p>
                        {learner.modules.length ? (
                          learner.modules.map((module) => (
                            <details key={module.module_id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <summary className="cursor-pointer text-sm font-medium text-slate-800">
                                {module.module_title} — {module.time_spent} sec
                              </summary>
                              <div className="mt-2 space-y-1 pl-2">
                                {module.lessons.map((lesson) => (
                                  <p key={lesson.lesson_id} className="text-xs text-slate-600">
                                    {lesson.lesson_title}: <span className="font-medium">{lesson.time_spent} sec</span>
                                  </p>
                                ))}
                              </div>
                            </details>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No module-level SCORM time tracked yet.</p>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No learner records found for this course.</p>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
