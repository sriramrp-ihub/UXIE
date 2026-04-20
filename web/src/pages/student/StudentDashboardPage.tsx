import { Link } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useMyDashboard, useTimeSpent } from "../../features/analytics/useAnalytics";
import { useMyCourses } from "../../features/courses/useCourses";
import { useAuthStore } from "../../store/auth.store";

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const dashboard = useMyDashboard();
  const courses = useMyCourses();
  const timeSpent = useTimeSpent(user?.id ?? "", !!user?.id);

  if (dashboard.isLoading || courses.isLoading) {
    return <LoadingState message="Loading learner dashboard..." />;
  }

  return (
    <div className="space-y-4">
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
        <article className="card">
          <p className="text-xs text-slate-400">Overall Completion</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.data?.completion_percentage ?? 0}%</p>
        </article>
        <article className="card md:col-span-2">
          <p className="text-xs text-slate-400">Learning Time Spent</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.data?.time_spent ?? 0} sec</p>
          <div className="mt-3 h-2 rounded bg-slate-800">
            <div
              className="h-2 rounded bg-emerald-500"
              style={{ width: `${Math.min(100, Math.max(0, dashboard.data?.completion_percentage ?? 0))}%` }}
            />
          </div>
        </article>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Recently Enrolled</h2>
        <div className="mt-3 space-y-2">
          {(courses.data ?? []).length ? (
            courses.data!.slice(0, 5).map((course) => (
              <Link
                key={course.id}
                to={`/student/courses/${course.id}`}
                className="block rounded-lg border border-slate-700 p-3 hover:bg-slate-800"
              >
                <p className="font-medium">{course.title}</p>
                <p className="text-sm text-slate-400">{course.description ?? "No description"}</p>
              </Link>
            ))
          ) : (
            <EmptyState title="No enrolled courses yet" hint="Visit Courses to enroll and start learning." />
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Time Spent by Course</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(timeSpent.data?.courses ?? []).length ? (
            timeSpent.data!.courses.map((item) => (
              <div key={item.course_id} className="rounded-lg border border-slate-700 p-3">
                <p className="font-medium text-slate-100">{item.course_title}</p>
                <p className="text-slate-400">{item.time_spent} sec</p>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No tracked study time yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
