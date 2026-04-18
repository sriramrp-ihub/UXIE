import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useCatalog, useEnrollMutation } from "../features/courses/useCourses";

export default function CatalogPage() {
  const catalog = useCatalog();
  const enrollMutation = useEnrollMutation();
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const pagedCourses = useMemo(() => {
    const all = catalog.data ?? [];
    const start = (page - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }, [catalog.data, page]);

  const totalPages = useMemo(() => {
    const total = catalog.data?.length ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [catalog.data]);

  if (catalog.isLoading) {
    return <LoadingState message="Loading catalog..." />;
  }

  return (
    <div className="space-y-4">
      <header className="card">
        <h1 className="text-xl font-semibold">Course Catalog</h1>
        <p className="mt-1 text-sm text-slate-300">Browse all courses and enroll.</p>
        <p className="mt-1 text-xs text-slate-400">Page {page} of {totalPages}</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {catalog.data?.length ? (
          pagedCourses.map((course) => (
            <article key={course.id} className="card space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{course.title}</h2>
                <p className="text-sm text-slate-400">{course.description ?? "No description"}</p>
              </div>
              <div className="flex gap-2">
                <Link className="btn-secondary" to={`/catalog/${course.id}`}>
                  View Details
                </Link>
                <button className="btn" onClick={() => enrollMutation.mutate(course.id)} disabled={enrollMutation.isPending}>
                  Enroll
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

      <section className="card flex items-center justify-between">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </button>
        <button
          className="btn-secondary"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </section>
    </div>
  );
}
