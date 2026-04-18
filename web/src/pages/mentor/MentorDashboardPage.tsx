import { useMemo } from "react";

import { useCatalog } from "../../features/courses/useCourses";
import { useAuthStore } from "../../store/auth.store";

export default function MentorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const catalog = useCatalog();

  const createdCourses = useMemo(() => {
    if (!user) return [];
    return (catalog.data ?? []).filter((course) => course.instructor_id === user.id);
  }, [catalog.data, user]);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <article className="card">
          <p className="text-xs text-slate-400">Courses Created</p>
          <p className="mt-2 text-2xl font-semibold">{createdCourses.length}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Total Catalog Courses</p>
          <p className="mt-2 text-2xl font-semibold">{catalog.data?.length ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs text-slate-400">Engagement</p>
          <p className="mt-2 text-2xl font-semibold">Tracking</p>
        </article>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">My Courses</h2>
        <div className="mt-3 space-y-2">
          {createdCourses.map((course) => (
            <div key={course.id} className="rounded-lg border border-slate-700 p-3 text-sm">
              <p className="font-medium">{course.title}</p>
              <p className="text-slate-400">{course.description ?? "No description"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
