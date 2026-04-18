import { useCatalog } from "../../features/courses/useCourses";

export default function AdminCoursesPage() {
  const catalog = useCatalog();

  return (
    <section className="card">
      <h1 className="text-xl font-semibold">Course Oversight</h1>
      <div className="mt-3 space-y-2">
        {(catalog.data ?? []).map((course) => (
          <article key={course.id} className="rounded-lg border border-slate-700 p-3 text-sm">
            <p className="font-medium">{course.title}</p>
            <p>{course.description ?? "No description"}</p>
            <p>Instructor ID: {course.instructor_id}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
