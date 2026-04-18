import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useCourseDetail, useEnrollMutation } from "../features/courses/useCourses";

export default function CourseDetailPage() {
  const { courseId = "" } = useParams();
  const courseDetail = useCourseDetail(courseId);
  const enrollMutation = useEnrollMutation();

  if (!courseId) return <EmptyState title="Missing course ID" />;
  if (courseDetail.isLoading) return <LoadingState message="Loading course..." />;

  if (!courseDetail.data) {
    return <EmptyState title="Course not found" />;
  }

  return (
    <div className="space-y-4">
      <article className="card space-y-3">
        <h1 className="text-2xl font-semibold">{courseDetail.data.title}</h1>
        <p className="text-slate-300">{courseDetail.data.description ?? "No description"}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => enrollMutation.mutate(courseId)} disabled={enrollMutation.isPending}>
            Enroll in course
          </button>
          <Link className="btn-secondary" to="/quiz">
            Go to Quiz Center
          </Link>
          <Link className="btn-secondary" to="/learning">
            Go to My Learning
          </Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-lg font-semibold">Modules & Lessons</h2>
        {courseDetail.data.modules?.length ? (
          <div className="mt-3 space-y-3">
            {courseDetail.data.modules.map((module) => (
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
      </article>
    </div>
  );
}
