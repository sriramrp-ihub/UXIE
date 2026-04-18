import { Link } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useMyDashboard } from "../../features/analytics/useAnalytics";
import { useMyCourses } from "../../features/courses/useCourses";

export default function StudentDashboardPage() {
  const dashboard = useMyDashboard();
  const courses = useMyCourses();

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
    </div>
  );
}
