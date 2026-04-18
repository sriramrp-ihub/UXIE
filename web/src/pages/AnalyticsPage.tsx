import { useState } from "react";

import { RoleGuard } from "../components/RoleGuard";
import { useAuthStore } from "../store/auth.store";
import { useActiveUsers, useCourseAnalytics, useGlobalDashboard, useMyDashboard } from "../features/analytics/useAnalytics";
import { useCatalog } from "../features/courses/useCourses";

export default function AnalyticsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [courseId, setCourseId] = useState("");
  const [enabledCourseQuery, setEnabledCourseQuery] = useState(false);
  const catalog = useCatalog();

  const my = useMyDashboard();
  const global = useGlobalDashboard(role === "admin");
  const active = useActiveUsers(role === "admin");
  const course = useCourseAnalytics(courseId, enabledCourseQuery);

  return (
    <RoleGuard allow={["instructor", "admin"]}>
      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-3">
          <article className="card">
            <p className="text-xs text-slate-400">My Avg Score</p>
            <p className="mt-2 text-2xl font-semibold">{my.data?.average_score ?? 0}</p>
          </article>
          <article className="card">
            <p className="text-xs text-slate-400">My Completed Lessons</p>
            <p className="mt-2 text-2xl font-semibold">{my.data?.completed_lessons ?? 0}</p>
          </article>
          <article className="card">
            <p className="text-xs text-slate-400">My Time Spent</p>
            <p className="mt-2 text-2xl font-semibold">{my.data?.time_spent ?? 0}s</p>
          </article>
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Course Performance</h2>
          <div className="flex gap-2">
            <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {(catalog.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => setEnabledCourseQuery(true)}>
              Load
            </button>
          </div>
          <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(course.data, null, 2)}</pre>
        </section>

        {role === "admin" ? (
          <section className="grid gap-3 md:grid-cols-2">
            <article className="card">
              <h3 className="font-semibold">Global Dashboard</h3>
              <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(global.data, null, 2)}</pre>
            </article>
            <article className="card">
              <h3 className="font-semibold">Active Users</h3>
              <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(active.data, null, 2)}</pre>
            </article>
          </section>
        ) : null}
      </div>
    </RoleGuard>
  );
}
