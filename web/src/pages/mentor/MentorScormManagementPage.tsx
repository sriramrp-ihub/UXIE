import { useState } from "react";

import { useCatalog, useCourseStructure, useCreateCourseMutation } from "../../features/courses/useCourses";
import { useUploadScormMutation } from "../../features/scorm/useScorm";
import { getErrorMessage } from "../../lib/api/helpers";

export default function MentorScormManagementPage() {
  const coursesQuery = useCatalog();
  const createCourse = useCreateCourseMutation();
  const upload = useUploadScormMutation();
  const [courseId, setCourseId] = useState("");
  const structure = useCourseStructure(courseId);
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const uploadError = upload.error ? getErrorMessage(upload.error) : null;

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-semibold">SCORM Management</h1>
        <p className="text-sm text-slate-400">Mentor can upload SCORM to a course. Consumption is student-only.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {(coursesQuery.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select className="input" value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={!courseId || structure.isLoading}>
            <option value="">Link lesson (recommended)</option>
            {(structure.data?.modules ?? []).flatMap((module) =>
              module.lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {module.title} • {lesson.title}
                </option>
              ))
            )}
          </select>
          <input className="input" placeholder="SCORM Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" type="file" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        {coursesQuery.isLoading ? <p className="text-xs text-slate-400">Loading courses...</p> : null}
        {coursesQuery.isError ? <p className="text-xs text-red-300">Failed to load courses: {getErrorMessage(coursesQuery.error)}</p> : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && (coursesQuery.data?.length ?? 0) === 0 ? (
          <div className="space-y-2 rounded border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-300">
            <p>No courses found yet, so there is no UUID to select.</p>
            <button
              className="btn"
              disabled={createCourse.isPending}
              onClick={() => {
                createCourse.mutate(
                  {
                    title: `SCORM Course ${new Date().toLocaleString()}`,
                    description: "Auto-created from SCORM management page",
                  },
                  {
                    onSuccess: (created) => {
                      setCourseId(created.id);
                      coursesQuery.refetch();
                    },
                  }
                );
              }}
            >
              {createCourse.isPending ? "Creating..." : "Create Course & Use Its UUID"}
            </button>
          </div>
        ) : null}
        <button
          className="btn"
          disabled={!courseId || !file || upload.isPending}
          onClick={() => {
            const form = new FormData();
            form.append("course_id", courseId);
            if (lessonId) form.append("lesson_id", lessonId);
            if (title) form.append("title", title);
            if (file) form.append("file", file);
            upload.mutate(form);
          }}
        >
          {upload.isPending ? "Uploading..." : "Upload SCORM"}
        </button>
        {uploadError ? <p className="text-sm text-red-300">Upload failed: {uploadError}</p> : null}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Upload Output</h2>
        <p className="mt-1 text-xs text-slate-400">
          Tip: linking a lesson enables automatic learner progress sync when SCORM finishes.
        </p>
        <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(upload.data, null, 2)}</pre>
      </section>
    </div>
  );
}
