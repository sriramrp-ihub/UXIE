import { useState } from "react";

import { useCourseAnalytics, useGlobalDashboard } from "../../features/analytics/useAnalytics";
import { useCatalog } from "../../features/courses/useCourses";

export default function AdminAnalyticsPage() {
  const [courseId, setCourseId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const catalog = useCatalog();
  const global = useGlobalDashboard(true);
  const course = useCourseAnalytics(courseId, enabled);

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-semibold">Platform Analytics</h1>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-400">System Completion</p>
            <p className="text-xl font-semibold">{global.data?.completion_percentage ?? 0}%</p>
          </article>
          <article className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-400">Average Score</p>
            <p className="text-xl font-semibold">{global.data?.average_score ?? 0}</p>
          </article>
          <article className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-400">Learning Time</p>
            <p className="text-xl font-semibold">{global.data?.time_spent ?? 0} sec</p>
          </article>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Completion Trend (current snapshot)</p>
          <div className="h-3 rounded bg-slate-800">
            <div
              className="h-3 rounded bg-emerald-500"
              style={{ width: `${Math.min(100, Math.max(0, global.data?.completion_percentage ?? 0))}%` }}
            />
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Course Analytics</h2>
        <div className="mt-2 flex gap-2">
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
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-400">Completion</p>
              <p className="text-xl font-semibold">{course.data.completion_percentage}%</p>
            </article>
            <article className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-400">Average Score</p>
              <p className="text-xl font-semibold">{course.data.average_score}</p>
            </article>
            <article className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-400">Time Spent</p>
              <p className="text-xl font-semibold">{course.data.time_spent} sec</p>
            </article>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Choose a course and load analytics.</p>
        )}
      </section>
    </div>
  );
}
