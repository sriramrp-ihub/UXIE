import { useActiveUsers, useGlobalDashboard } from "../../features/analytics/useAnalytics";

export default function AdminDashboardPage() {
  const global = useGlobalDashboard(true);
  const active = useActiveUsers(true);

  return (
    <div className="space-y-5">
      <section className="card">
        <h2 className="text-2xl font-semibold text-slate-900">Platform Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Monitor learners, courses, and overall engagement health.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{global.data?.total_users ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{global.data?.total_courses ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enrollments</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{global.data?.total_enrollments ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{active.data?.active_users ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completion Rate</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{global.data?.completion_percentage ?? 0}%</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{Math.round(global.data?.average_score ?? 0)}%</p>
        </article>
        <article className="card sm:col-span-2 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Learning Time</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{global.data?.time_spent ?? 0} sec</p>
        </article>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">Platform completion trend</p>
          <p className="text-sm font-medium text-slate-600">{global.data?.completion_percentage ?? 0}%</p>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.max(0, Math.min(100, global.data?.completion_percentage ?? 0))}%` }}
          />
        </div>
      </section>
    </div>
  );
}
