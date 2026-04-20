import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useCatalog, useEnrollMutation, useMyCourses } from "../../features/courses/useCourses";
import { courseApi } from "../../lib/api/course.api";

export default function StudentCoursesPage() {
  const catalog = useCatalog();
  const myCourses = useMyCourses();
  const enroll = useEnrollMutation();

  const enrolledCourseIds = useMemo(
    () => new Set((myCourses.data ?? []).map((course) => course.id)),
    [myCourses.data]
  );

  const progressQueries = useQueries({
    queries: (catalog.data ?? []).map((course) => ({
      queryKey: ["progress", "course-card", course.id],
      queryFn: () => courseApi.getProgressByCourse(course.id),
      enabled: !!course.id,
    })),
  });

  if (catalog.isLoading || myCourses.isLoading) return <LoadingState message="Loading courses..." />;

  return (
    <div className="space-y-5">
      <section className="card">
        <h1 className="text-2xl font-semibold text-slate-900">My Courses</h1>
        <p className="mt-1 text-sm text-slate-600">Continue where you left off and complete your learning paths.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(catalog.data ?? []).length ? (
          catalog.data!.map((course, index) => {
            const completion = progressQueries[index]?.data?.completion_percentage ?? 0;
            const isEnrolled = enrolledCourseIds.has(course.id) || completion > 0;

            return (
            <article key={course.id} className="card space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{course.title}</h2>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{course.description ?? "Start this course to begin learning."}</p>
              </div>
              <div className="space-y-2">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, completion))}%` }} />
                </div>
                <p className="text-sm text-slate-600">{completion}% complete</p>
              </div>
              <div className="flex gap-2">
                {isEnrolled ? (
                  <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Enrolled
                  </span>
                ) : (
                  <button className="btn" onClick={() => enroll.mutate(course.id)} disabled={enroll.isPending}>
                    {enroll.isPending ? "Enrolling..." : "Enroll"}
                  </button>
                )}
                <Link className="btn-secondary" to={`/student/courses/${course.id}`}>
                  Continue learning
                </Link>
              </div>
            </article>
            );
          })
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No courses available" />
          </div>
        )}
      </section>

      {enroll.isSuccess ? (
        <section className="card">
          <p className="text-sm text-emerald-700">Enrollment successful. You can now continue learning.</p>
        </section>
      ) : null}

      {enroll.isError ? (
        <section className="card">
          <p className="text-sm text-red-600">Enrollment could not be completed. You may already be enrolled.</p>
        </section>
      ) : null}
    </div>
  );
}
