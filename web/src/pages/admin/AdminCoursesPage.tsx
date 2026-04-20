import { useCatalog } from "../../features/courses/useCourses";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";

export default function AdminCoursesPage() {
  const catalog = useCatalog();

  if (catalog.isLoading) return <LoadingState message="Loading course catalog..." />;

  return (
    <div className="space-y-5">
      <section className="card">
        <h1 className="text-2xl font-semibold text-slate-900">Course Oversight</h1>
        <p className="mt-1 text-sm text-slate-600">Track structure quality and instructor ownership across all courses.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(catalog.data ?? []).length ? (
          (catalog.data ?? []).map((course) => (
            <article key={course.id} className="card space-y-2">
              <p className="text-base font-semibold text-slate-900">{course.title}</p>
              <p className="line-clamp-2 text-sm text-slate-600">{course.description ?? "No description"}</p>
              <p className="text-xs font-medium text-slate-500">Instructor: {course.instructor_name ?? "Assigned instructor"}</p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                  Modules: {course.modules_count ?? 0}
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                  Lessons: {course.lessons_count ?? 0}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No courses available" hint="Create a course to begin content operations." />
          </div>
        )}
      </section>
    </div>
  );
}
