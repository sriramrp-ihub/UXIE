import { useMemo, useState } from "react";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import {
  useCourseStructure,
  useMyCourses,
  useProgressByCourse,
  useUpdateProgressMutation,
} from "../features/courses/useCourses";

export default function MyLearningPage() {
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [completed, setCompleted] = useState(true);

  const myCourses = useMyCourses();
  const progress = useProgressByCourse(selectedCourseId);
  const structure = useCourseStructure(selectedCourseId);
  const updateProgress = useUpdateProgressMutation();

  const completionRate = progress.data?.completion_percentage ?? 0;

  const lessonOptions = useMemo(() => {
    return (structure.data?.modules ?? []).flatMap((module) =>
      module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        moduleTitle: module.title,
      }))
    );
  }, [structure.data]);

  if (myCourses.isLoading) {
    return <LoadingState message="Loading enrolled courses..." />;
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-semibold">My Learning</h1>
        <p className="mt-1 text-sm text-slate-400">Track course progress and update lesson completion.</p>
      </section>

      <section className="card">
        <label className="label">Select course</label>
        <select
          className="input"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          <option value="">Select enrolled course</option>
          {(myCourses.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-slate-300">Completion rate: {completionRate}%</p>
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
            <label className="label">Completed</label>
            <select className="input" value={String(completed)} onChange={(e) => setCompleted(e.target.value === "true")}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </div>
        <button
          className="btn"
          onClick={() => updateProgress.mutate({ lesson_id: selectedLessonId, completed })}
          disabled={!selectedLessonId || updateProgress.isPending}
        >
          Save Progress
        </button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Progress Records</h2>
        <div className="mt-3 space-y-2">
          {progress.data?.items?.length ? (
            progress.data.items.map((p) => (
              <div key={p.lesson_id} className="rounded-lg border border-slate-700 p-3 text-sm">
                <p>Lesson: {p.lesson_title ?? p.lesson_id}</p>
                <p>Module: {p.module_title ?? "-"}</p>
                <p>Status: {p.completed ? "Completed" : "In Progress"}</p>
                <p>Completed At: {p.completed_at ? new Date(p.completed_at).toLocaleString() : "-"}</p>
              </div>
            ))
          ) : (
            <EmptyState title="No progress records" hint="Select course and track lesson completion." />
          )}
        </div>
      </section>
    </div>
  );
}
