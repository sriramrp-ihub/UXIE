import { Link } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useCatalog, useEnrollMutation } from "../../features/courses/useCourses";

export default function StudentCoursesPage() {
  const catalog = useCatalog();
  const enroll = useEnrollMutation();

  if (catalog.isLoading) return <LoadingState message="Loading courses..." />;

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-semibold">Course Catalog</h1>
        <p className="text-sm text-slate-400">Browse and enroll in available courses.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(catalog.data ?? []).length ? (
          catalog.data!.map((course) => (
            <article key={course.id} className="card space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{course.title}</h2>
                <p className="text-sm text-slate-400">{course.description ?? "No description"}</p>
              </div>
              <div className="flex gap-2">
                <Link className="btn-secondary" to={`/student/courses/${course.id}`}>
                  View
                </Link>
                <button className="btn" onClick={() => enroll.mutate(course.id)} disabled={enroll.isPending}>
                  {enroll.isPending ? "Enrolling..." : "Enroll"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No courses available" />
          </div>
        )}
      </section>

      {enroll.isSuccess ? (
        <section className="card">
          <p className="text-sm text-emerald-300">Enrollment successful. You can now continue in My Learning.</p>
        </section>
      ) : null}

      {enroll.isError ? (
        <section className="card">
          <p className="text-sm text-red-300">Enrollment could not be completed. You may already be enrolled.</p>
        </section>
      ) : null}
    </div>
  );
}
