import { useAuthStore } from "../../store/auth.store";
import { useMyDashboard } from "../../features/analytics/useAnalytics";

export default function StudentProfilePage() {
  const user = useAuthStore((s) => s.user);
  const dashboard = useMyDashboard();

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-slate-300">{user?.name}</p>
        <p className="text-sm text-slate-400">{user?.email}</p>
        <p className="text-sm text-slate-400">Role: {user?.role}</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="card">
          <p className="text-xs text-slate-400">Enrolled Courses</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.data?.enrolled_courses ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Completed Lessons</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.data?.completed_lessons ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Average Score</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.data?.average_score ?? 0}</p>
        </article>
      </section>
    </div>
  );
}
