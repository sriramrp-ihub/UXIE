import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { courseApi } from "../../lib/api/course.api";
import { useMyDashboard, useTimeSpent } from "../../features/analytics/useAnalytics";
import { useMyCourses } from "../../features/courses/useCourses";
import { useAuthStore } from "../../store/auth.store";

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const dashboard = useMyDashboard();
  const courses = useMyCourses();
  const timeSpent = useTimeSpent(user?.id ?? "", !!user?.id);

  const recentCourseId = useMemo(() => {
    const fromTimeSpent = timeSpent.data?.courses?.[0]?.course_id;
    return fromTimeSpent ?? courses.data?.[0]?.id ?? "";
  }, [courses.data, timeSpent.data]);

  const progressQueries = useQueries({
    queries: (courses.data ?? []).map((course) => ({
      queryKey: ["progress", "dashboard", course.id],
      queryFn: () => courseApi.getProgressByCourse(course.id),
      enabled: !!course.id,
    })),
  });

  const progressByCourseId = useMemo(() => {
    const map = new Map<string, number>();
    (courses.data ?? []).forEach((course, index) => {
      const completion = progressQueries[index]?.data?.completion_percentage ?? 0;
      map.set(course.id, completion);
    });
    return map;
  }, [courses.data, progressQueries]);

  const recentCourse = (courses.data ?? []).find((c) => c.id === recentCourseId) ?? (courses.data ?? [])[0] ?? null;
  const recentCourseProgress = recentCourse ? progressByCourseId.get(recentCourse.id) ?? 0 : 0;
  const recentProgressItems =
    progressQueries[(courses.data ?? []).findIndex((c) => c.id === recentCourse?.id)]?.data?.items ?? [];

  if (dashboard.isLoading || courses.isLoading) {
    return <LoadingState message="Loading learner dashboard..." />;
  }

  return (
    <div className="space-y-5">
      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900">Continue Learning</h2>
        {recentCourse ? (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">{recentCourse.title}</p>
              <div className="progress-track max-w-xl">
                <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, recentCourseProgress))}%` }} />
              </div>
              <p className="text-sm text-slate-600">{recentCourseProgress}% complete</p>
            </div>
            <Link className="btn" to={`/student/courses/${recentCourse.id}`}>
              Continue learning
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="No course in progress yet" hint="Enroll in a course and start learning to see it here." />
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Enrolled Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.data?.enrolled_courses ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed Lessons</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.data?.completed_lessons ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.data?.average_score ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overall Completion</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.data?.completion_percentage ?? 0}%</p>
        </article>
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">My Courses</h2>
          <Link to="/student/courses" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            View all
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(courses.data ?? []).length ? (
            courses.data!.map((course) => (
              <article key={course.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{course.title}</p>
                <div className="mt-3 progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.max(0, Math.min(100, progressByCourseId.get(course.id) ?? 0))}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">{progressByCourseId.get(course.id) ?? 0}% complete</p>
                <Link className="btn mt-3" to={`/student/courses/${course.id}`}>
                  Continue learning
                </Link>
              </article>
            ))
          ) : (
            <EmptyState title="No enrolled courses yet" hint="Visit Courses to enroll and start learning." />
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900">Learning Activity</h2>
        <div className="mt-4 space-y-3">
          {recentProgressItems.length ? (
            recentProgressItems.slice(0, 6).map((item) => (
              <div key={item.lesson_id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span
                  className={
                    item.completed
                      ? "mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"
                      : "mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"
                  }
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.completed ? "Lesson completed" : "Lesson in progress"}: {item.lesson_title ?? "Lesson"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.completed_at ? new Date(item.completed_at).toLocaleString() : "Recently accessed"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No activity yet" hint="Start a lesson and your learning timeline will appear here." />
          )}
        </div>
      </section>
    </div>
  );
}
