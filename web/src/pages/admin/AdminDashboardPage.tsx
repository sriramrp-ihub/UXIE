import { useActiveUsers, useGlobalDashboard } from "../../features/analytics/useAnalytics";

export default function AdminDashboardPage() {
  const global = useGlobalDashboard(true);
  const active = useActiveUsers(true);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        <article className="card">
          <p className="text-xs text-slate-400">Total Users</p>
          <p className="mt-2 text-2xl font-semibold">{global.data?.total_users ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Total Courses</p>
          <p className="mt-2 text-2xl font-semibold">{global.data?.total_courses ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Enrollments</p>
          <p className="mt-2 text-2xl font-semibold">{global.data?.total_enrollments ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Active Users</p>
          <p className="mt-2 text-2xl font-semibold">{active.data?.active_users ?? 0}</p>
        </article>
      </section>
    </div>
  );
}
