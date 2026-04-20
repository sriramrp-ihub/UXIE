import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { useCourseDetail, useEnrollMutation } from "../../features/courses/useCourses";

export default function StudentCourseDetailPage() {
  const { courseId = "" } = useParams();
  const course = useCourseDetail(courseId);
  const enroll = useEnrollMutation();

  if (!courseId) return <EmptyState title="Course not found" />;
  if (course.isLoading) return <LoadingState message="Loading course detail..." />;
  if (!course.data) return <EmptyState title="Course not found" />;

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-2xl font-semibold">{course.data.title}</h1>
        <p className="text-slate-300">{course.data.description ?? "No description"}</p>
        <div className="flex gap-2">
          <button className="btn" onClick={() => enroll.mutate(courseId)} disabled={enroll.isPending}>
            {enroll.isPending ? "Enrolling..." : "Enroll"}
          </button>
          <Link className="btn-secondary" to="/student/learning">
            Start Learning
          </Link>
        </div>
        {enroll.isSuccess ? <p className="text-sm text-emerald-300">You are enrolled in this course.</p> : null}
        {enroll.isError ? (
          <p className="text-sm text-red-300">Could not enroll. You may already have access to this course.</p>
        ) : null}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Modules & Lessons</h2>
        {course.data.modules?.length ? (
          <div className="mt-3 space-y-3">
            {course.data.modules.map((module) => (
              <div key={module.id} className="rounded-lg border border-slate-700 p-3">
                <p className="font-medium text-slate-100">{module.title}</p>
                {module.lessons.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        {lesson.title} <span className="text-slate-500">({lesson.content_type})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">No lessons yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No modules or lessons published for this course yet.</p>
        )}
      </section>
    </div>
  );
}
