import { useAuthStore } from "../../store/auth.store";
import { useMyDashboard } from "../../features/analytics/useAnalytics";

export default function StudentProfilePage() {
  const user = useAuthStore((s) => s.user);
  const dashboard = useMyDashboard();

  return (
    <div className="space-y-5">
      <section className="card">
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-3 text-base font-medium text-slate-800">{user?.name ?? "Learner"}</p>
        <p className="text-sm text-slate-600">{user?.email}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Learning account</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolled Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.data?.enrolled_courses ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed Lessons</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.data?.completed_lessons ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{Math.round(dashboard.data?.average_score ?? 0)}%</p>
        </article>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Learning Goals</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {["Complete one lesson today", "Review your latest course", "Keep your streak going"].map((goal) => (
            <div key={goal} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {goal}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
