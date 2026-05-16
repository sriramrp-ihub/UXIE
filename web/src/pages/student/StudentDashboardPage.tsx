import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useMyDashboard, useTimeSpent } from "../../features/analytics/useAnalytics";
import { useMyCourses } from "../../features/courses/useCourses";
import { courseApi } from "../../lib/api/course.api";
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

  const totalHours = Math.round((timeSpent.data?.total_time_spent ?? dashboard.data?.time_spent ?? 0) / 3600);
  const activeCoursesCount = (courses.data ?? []).length;
  const completionPercentage = Math.round(dashboard.data?.completion_percentage ?? 0);
  const averageScore = Math.round(dashboard.data?.average_score ?? 0);
  const stats = [
    {
      label: "Enrolled Courses",
      value: dashboard.data?.enrolled_courses ?? 0,
      tone: "from-sky-500 to-blue-600",
      note: "Programs currently assigned to you",
    },
    {
      label: "Completed Lessons",
      value: dashboard.data?.completed_lessons ?? 0,
      tone: "from-emerald-500 to-teal-500",
      note: "Lessons marked complete across courses",
    },
    {
      label: "Average Score",
      value: `${averageScore}%`,
      tone: "from-violet-500 to-indigo-600",
      note: "Assessment performance across attempts",
    },
    {
      label: "Overall Completion",
      value: `${completionPercentage}%`,
      tone: "from-amber-400 to-orange-500",
      note: "Progress across your active learning plan",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-sky-100 bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_46%,_#38bdf8_100%)] text-white shadow-[0_28px_90px_rgba(37,99,235,0.22)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)] lg:px-8">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
              Today&apos;s snapshot
            </div>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                Stay on track with a dashboard built around your next step.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-sky-50/90">
                Review the course that needs attention, see how your scores are trending, and move back into learning
                without hunting through the platform.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/80">Active courses</p>
                <p className="mt-2 text-3xl font-semibold text-white">{activeCoursesCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/80">Learning hours</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalHours}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/80">Completion</p>
                <p className="mt-2 text-3xl font-semibold text-white">{completionPercentage}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/80">Current priority</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Continue learning</h3>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-sky-50">
                Live
              </div>
            </div>

            <div className="mt-5">
              {recentCourse ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{recentCourse.title}</p>
                    <p className="mt-2 text-sm leading-6 text-sky-50/85">
                      Resume where you left off and keep your dashboard progress moving forward.
                    </p>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/15">
                    <div
                      className="h-2.5 rounded-full bg-white transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, recentCourseProgress))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-sky-50/85">
                    <span>{recentCourseProgress}% complete</span>
                    <span>{recentProgressItems.length} recent updates</span>
                  </div>
                  <Link className="btn bg-white text-slate-950 hover:bg-sky-50" to={`/student/courses/${recentCourse.id}`}>
                    Continue learning
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-sky-50/85">
                    You don&apos;t have an active course yet. Enroll in a course to start seeing live progress here.
                  </p>
                  <Link className="btn bg-white text-slate-950 hover:bg-sky-50" to="/student/courses">
                    Explore courses
                  </Link>
                </div>
              )}
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[30px] border border-white/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Learning lineup</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">My courses</h2>
            </div>
            <Link to="/student/courses" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(courses.data ?? []).length ? (
              courses.data!.map((course) => (
                <article
                  key={course.id}
                  className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,130,246,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold tracking-tight text-slate-950">{course.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {course.description?.trim() || "Continue building knowledge with this course."}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {progressByCourseId.get(course.id) ?? 0}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                      style={{ width: `${Math.max(0, Math.min(100, progressByCourseId.get(course.id) ?? 0))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Progress synced from your lesson activity.</p>
                  <Link className="btn mt-4" to={`/student/courses/${course.id}`}>
                    Continue learning
                  </Link>
                </article>
              ))
            ) : (
              <EmptyState title="No enrolled courses yet" hint="Visit Courses to enroll and start learning." />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-[30px] border border-white/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Momentum</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Learning activity</h2>
            <div className="mt-4 space-y-3">
              {recentProgressItems.length ? (
                recentProgressItems.slice(0, 6).map((item) => (
                  <div
                    key={item.lesson_id}
                    className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <span
                      className={
                        item.completed
                          ? "mt-1 inline-flex h-3 w-3 rounded-full bg-emerald-500"
                          : "mt-1 inline-flex h-3 w-3 rounded-full bg-blue-500"
                      }
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.completed ? "Lesson completed" : "Lesson in progress"}: {item.lesson_title ?? "Lesson"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
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

          <section className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,_#f4faff_0%,_#ffffff_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Support lane</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Need a quick explanation?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open the BFSI assistant for concise help on banking, finance, insurance, and course-related concepts.
            </p>
            <Link className="btn mt-4" to="/student/assistant">
              Open assistant
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}
