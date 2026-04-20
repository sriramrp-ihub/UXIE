import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import {
  useCourseStructure,
  useMyCourses,
  useProgressByCourse,
  useUpdateProgressMutation,
} from "../../features/courses/useCourses";
import { useCourseScormPackages } from "../../features/scorm/useScorm";
import { getErrorMessage } from "../../lib/api/helpers";

export default function StudentLearningPage() {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [completed, setCompleted] = useState(true);

  const myCourses = useMyCourses();
  const progress = useProgressByCourse(selectedCourseId);
  const structure = useCourseStructure(selectedCourseId);
  const scormPackages = useCourseScormPackages(selectedCourseId);
  const updateProgress = useUpdateProgressMutation();

  const completionRate = progress.data?.completion_percentage ?? 0;

  useEffect(() => {
    if (selectedCourseId) {
      return;
    }
    const firstCourseId = myCourses.data?.[0]?.id;
    if (firstCourseId) {
      setSelectedCourseId(firstCourseId);
    }
  }, [myCourses.data, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedLessonId("");
      return;
    }

    const lessons = (structure.data?.modules ?? []).flatMap((module) => module.lessons);
    if (!lessons.length) {
      setSelectedLessonId("");
      return;
    }

    const lessonStillExists = lessons.some((lesson) => lesson.id === selectedLessonId);
    if (!lessonStillExists) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [selectedCourseId, structure.data, selectedLessonId]);

  const lessonOptions = useMemo(() => {
    return (structure.data?.modules ?? []).flatMap((module) =>
      module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        moduleTitle: module.title,
      }))
    );
  }, [structure.data]);

  if (myCourses.isLoading) return <LoadingState message="Loading your learning hub..." />;

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-semibold">My Learning</h1>
        <label className="label">Select Course</label>
        <select className="input" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
          <option value="">Select enrolled course</option>
          {(myCourses.data ?? []).map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-300">Progress completion rate: {completionRate}%</p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Update Lesson Progress</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Lesson</label>
            <select
              className="input"
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              disabled={!selectedCourseId || structure.isLoading}
            >
              <option value="">Select lesson</option>
              {lessonOptions.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.moduleTitle} • {lesson.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Progress Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={completed ? "btn" : "btn-secondary"}
                onClick={() => setCompleted(true)}
              >
                Completed
              </button>
              <button
                type="button"
                className={!completed ? "btn" : "btn-secondary"}
                onClick={() => setCompleted(false)}
              >
                In Progress
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() => updateProgress.mutate({ lesson_id: selectedLessonId, completed })}
            disabled={!selectedLessonId || updateProgress.isPending}
          >
            Save Progress
          </button>
          <Link className="btn-secondary" to="/student/lesson-viewer">
            Open Lesson Viewer
          </Link>
        </div>
        {updateProgress.isSuccess ? (
          <p className="text-sm text-emerald-300">Progress saved successfully.</p>
        ) : null}
        {updateProgress.isError ? (
          <p className="text-sm text-red-300">Could not save progress. Please try again.</p>
        ) : null}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">SCORM Content</h2>
        {!selectedCourseId ? (
          <p className="mt-2 text-sm text-slate-400">Select a course to view SCORM packages.</p>
        ) : scormPackages.isLoading ? (
          <p className="mt-2 text-sm text-slate-400">Loading SCORM packages...</p>
        ) : scormPackages.isError ? (
          <p className="mt-2 text-sm text-red-300">Failed to load SCORM packages: {getErrorMessage(scormPackages.error)}</p>
        ) : (scormPackages.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No SCORM packages uploaded for this course yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {scormPackages.data!.map((pkg) => (
              <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-100">{pkg.title}</p>
                  <p className="text-xs text-slate-400">Launch: {pkg.launch_file}</p>
                </div>
                <Link className="btn" to={`/student/scorm/player/${pkg.id}`}>
                  Open SCORM
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Progress Records</h2>
        <div className="mt-3 space-y-2">
          {(progress.data?.items ?? []).length ? (
            progress.data!.items.map((p) => (
              <div key={p.lesson_id} className="rounded-lg border border-slate-700 p-3 text-sm">
                <p>Lesson: {p.lesson_title ?? "Lesson"}</p>
                <p>Module: {p.module_title ?? "-"}</p>
                <p>Status: {p.completed ? "Completed" : "In Progress"}</p>
                <p>Completed At: {p.completed_at ? new Date(p.completed_at).toLocaleString() : "-"}</p>
              </div>
            ))
          ) : (
            <EmptyState
              title="No progress records"
              hint={selectedCourseId ? "Complete lessons to see progress here." : "Select a course to view learning progress."}
            />
          )}
        </div>
      </section>
    </div>
  );
}
