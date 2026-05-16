import { useActiveUsers, useGlobalDashboard } from "../../features/analytics/useAnalytics";

export default function AdminDashboardPage() {
  const global = useGlobalDashboard(true);
  const active = useActiveUsers(true);
  const completionPercentage = Math.round(global.data?.completion_percentage ?? 0);
  const averageScore = Math.round(global.data?.average_score ?? 0);
  const totalLearningHours = Math.round((global.data?.time_spent ?? 0) / 3600);
  const stats = [
    {
      label: "Total Users",
      value: global.data?.total_users ?? 0,
      tone: "from-cyan-500 to-sky-600",
      note: "All learner and admin accounts in the platform",
    },
    {
      label: "Total Courses",
      value: global.data?.total_courses ?? 0,
      tone: "from-indigo-500 to-violet-600",
      note: "Programs currently available for delivery",
    },
    {
      label: "Enrollments",
      value: global.data?.total_enrollments ?? 0,
      tone: "from-emerald-500 to-teal-600",
      note: "Course joins recorded across the platform",
    },
    {
      label: "Active Users",
      value: active.data?.active_users ?? 0,
      tone: "from-amber-400 to-orange-500",
      note: "Users recently engaging with the LMS",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-slate-900 bg-[linear-gradient(135deg,_#020617_0%,_#0f172a_30%,_#155e75_100%)] text-white shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:px-8">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              Platform health
            </div>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                See platform performance clearly before issues turn into escalations.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-cyan-50/90">
                This dashboard brings user activity, learning outcomes, and course coverage into one operating view so
                the admin team can act quickly.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">Completion</p>
                <p className="mt-2 text-3xl font-semibold text-white">{completionPercentage}%</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">Avg. score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{averageScore}%</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">Learning hours</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalLearningHours}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">Executive summary</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-950/20 p-4">
                <p className="text-sm text-cyan-50/85">Completion rate</p>
                <p className="mt-2 text-3xl font-semibold text-white">{completionPercentage}%</p>
              </div>
              <div className="rounded-2xl bg-slate-950/20 p-4">
                <p className="text-sm text-cyan-50/85">Active learner signal</p>
                <p className="mt-2 text-3xl font-semibold text-white">{active.data?.active_users ?? 0}</p>
              </div>
              <p className="text-sm leading-6 text-cyan-50/80">
                Use this view as the first stop before moving into course management or deeper analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className={`h-1.5 bg-gradient-to-r ${stat.tone}`} />
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{stat.note}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="rounded-[30px] border border-white/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Outcome tracking</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Platform completion trend</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {completionPercentage}%
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] p-5">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Completion across all learning activity</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, completionPercentage))}%` }}
              />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Average score</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{averageScore}%</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Assessment quality signal across the platform.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Learning hours</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{totalLearningHours}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Cumulative learning time recorded in the LMS.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-[30px] border border-white/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Quick actions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Where to go next</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Course management</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add, organize, or refresh course structures before assigning them to learners.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">User management</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review learner access, role allocations, and verification status in one place.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Move deeper into performance breakdowns once the platform summary points to a gap.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-cyan-100 bg-[linear-gradient(180deg,_#f2fdff_0%,_#ffffff_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">Admin insight</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Healthy dashboards reduce reaction time.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep this overview crisp so demos, operations reviews, and day-to-day platform checks all start from the
              same reliable story.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
