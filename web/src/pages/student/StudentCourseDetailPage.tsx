import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import {
  useCourseDetail,
  useCourseStructure,
  useEnrollMutation,
  useMyCourses,
  useProgressByCourse,
  useUpdateProgressMutation,
} from "../../features/courses/useCourses";
import { useCourseScormPackages } from "../../features/scorm/useScorm";
import { useScormPlayer } from "../../features/scorm/useScormPlayer";

function cleanTitle(value: string): string {
  const normalized = value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "Lesson";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function StudentCourseDetailPage() {
  const { courseId = "" } = useParams();
  const course = useCourseDetail(courseId);
  const structure = useCourseStructure(courseId);
  const progress = useProgressByCourse(courseId);
  const myCourses = useMyCourses();
  const scormPackages = useCourseScormPackages(courseId);
  const enroll = useEnrollMutation();
  const updateProgress = useUpdateProgressMutation();

  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [startedLessonId, setStartedLessonId] = useState("");
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const lessonRows = useMemo(() => {
    return (structure.data?.modules ?? []).flatMap((module) =>
      module.lessons.map((lesson, lessonIndex) => ({
        id: lesson.id,
        moduleId: module.id,
        moduleTitle: cleanTitle(module.title),
        lessonTitle: cleanTitle(lesson.title),
        contentType: lesson.content_type,
        contentUrl: lesson.content_url,
        label: `Lesson ${lessonIndex + 1}`,
      }))
    );
  }, [structure.data]);

  const selectedLesson = lessonRows.find((lesson) => lesson.id === selectedLessonId) ?? null;

  const progressByLessonId = useMemo(() => {
    const map = new Map<string, boolean>();
    (progress.data?.items ?? []).forEach((item) => map.set(item.lesson_id, Boolean(item.completed)));
    return map;
  }, [progress.data]);

  const lessonIdsWithProgress = useMemo(
    () => new Set((progress.data?.items ?? []).map((item) => item.lesson_id)),
    [progress.data]
  );

  const completionPct = Math.round(progress.data?.completion_percentage ?? 0);
  const isEnrolled = useMemo(() => {
    if (!courseId) return false;
    const inMyCourses = (myCourses.data ?? []).some((course) => course.id === courseId);
    return inMyCourses || completionPct > 0;
  }, [myCourses.data, courseId, completionPct]);

  const packageForSelectedLesson = useMemo(() => {
    if (!selectedLesson || selectedLesson.contentType !== "scorm") return null;
    return (
      (scormPackages.data ?? []).find((pkg) => pkg.lesson_id === selectedLesson.id) ??
      (scormPackages.data ?? []).find((pkg) => pkg.file_path === selectedLesson.contentUrl) ??
      null
    );
  }, [scormPackages.data, selectedLesson]);

  const scormPlayer = useScormPlayer(packageForSelectedLesson?.id ?? "", frameRef);

  useEffect(() => {
    if (!selectedLessonId && lessonRows.length) {
      setSelectedLessonId(lessonRows[0].id);
    }
  }, [lessonRows, selectedLessonId]);

  useEffect(() => {
    if (!selectedLesson) return;
    if (selectedLesson.contentType === "scorm") return;
    if (startedLessonId !== selectedLesson.id) return;
    if (progressByLessonId.get(selectedLesson.id)) return;

    const timeout = window.setTimeout(() => {
      updateProgress.mutate({ lesson_id: selectedLesson.id, completed: true });
    }, 15000);

    return () => window.clearTimeout(timeout);
  }, [selectedLesson, startedLessonId, progressByLessonId, updateProgress]);

  if (!courseId) return <EmptyState title="Course not found" />;
  if (course.isLoading || structure.isLoading || progress.isLoading) {
    return <LoadingState message="Loading course detail..." />;
  }
  if (!course.data) return <EmptyState title="Course not found" />;

  return (
    <div className="space-y-5">
      <section className="card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{course.data.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{course.data.description ?? "Continue your learning journey."}</p>
          </div>
          {isEnrolled ? (
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              Enrolled
            </span>
          ) : (
            <button className="btn" onClick={() => enroll.mutate(courseId)} disabled={enroll.isPending}>
              {enroll.isPending ? "Enrolling..." : "Enroll"}
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Course progress</span>
            <span>{completionPct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, completionPct))}%` }} />
          </div>
        </div>

        {enroll.isSuccess ? <p className="text-sm text-emerald-700">You are enrolled in this course.</p> : null}
        {enroll.isError ? (
          <p className="text-sm text-red-600">Could not enroll. You may already have access to this course.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <details className="card group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Course Content</h2>
            <span className="text-xs font-medium text-slate-500 group-open:hidden">Show</span>
            <span className="hidden text-xs font-medium text-slate-500 group-open:inline">Hide</span>
          </summary>

          {structure.data?.modules?.length ? (
            <div className="mt-3 space-y-3">
              {structure.data.modules.map((module) => {
                const moduleLessons = lessonRows.filter((row) => row.moduleId === module.id);

                return (
                  <div key={module.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">{cleanTitle(module.title)}</p>
                    <div className="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                      {moduleLessons.map((lesson) => {
                        const rawCompleted = progressByLessonId.get(lesson.id) ?? false;
                        const completed =
                          lesson.contentType === "scorm"
                            ? rawCompleted && completionPct >= 100
                            : rawCompleted;
                        const active = selectedLessonId === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => {
                              setSelectedLessonId(lesson.id);
                              setStartedLessonId(lesson.id);
                            }}
                            className={
                              active
                                ? "flex min-h-11 w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-left"
                                : "flex min-h-11 w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-100"
                            }
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">{lesson.label}</p>
                              <p className="text-xs text-slate-600">{lesson.lessonTitle}</p>
                            </div>
                            {completed ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                Completed
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState title="No lessons published yet" hint="Your instructor is preparing this course." />
            </div>
          )}
        </details>

        <div className="card space-y-4">
          {selectedLesson ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{selectedLesson.moduleTitle}</p>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedLesson.lessonTitle}</h3>
                </div>
                {(selectedLesson.contentType === "scorm"
                  ? (progressByLessonId.get(selectedLesson.id) ?? false) && completionPct >= 100
                  : (progressByLessonId.get(selectedLesson.id) ?? false)) ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Completed</span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {(() => {
                  const hasPersistedProgress = selectedLesson
                    ? lessonIdsWithProgress.has(selectedLesson.id)
                    : false;
                  const shouldContinueByType = selectedLesson?.contentType === "scorm";
                  const isActiveNow = startedLessonId === selectedLesson.id;

                  return (
                    <button className="btn" onClick={() => setStartedLessonId(selectedLesson.id)}>
                      {isActiveNow || hasPersistedProgress || shouldContinueByType
                        ? "Continue learning"
                        : "Start lesson"}
                    </button>
                  );
                })()}
                <Link className="btn-secondary" to="/student/courses">
                  Back to my courses
                </Link>
              </div>

              {startedLessonId === selectedLesson.id ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {selectedLesson.contentType === "video" ? (
                    <video
                      className="h-[72vh] w-full rounded-xl bg-black"
                      src={selectedLesson.contentUrl}
                      controls
                      onEnded={() => updateProgress.mutate({ lesson_id: selectedLesson.id, completed: true })}
                    />
                  ) : selectedLesson.contentType === "scorm" && packageForSelectedLesson ? (
                    <>
                      <iframe
                        ref={frameRef}
                        title="Lesson player"
                        src={scormPlayer.currentLaunchUrl || "about:blank"}
                        onLoad={scormPlayer.bindApiToFrame}
                        className="h-[72vh] w-full rounded-xl border border-slate-200 bg-white"
                      />
                      <p className="mt-3 text-sm text-slate-600">{scormPlayer.status}</p>
                    </>
                  ) : /^https?:\/\//.test(selectedLesson.contentUrl) || selectedLesson.contentUrl.startsWith("/") ? (
                    <iframe
                      title="Lesson content"
                      className="h-[72vh] w-full rounded-xl border border-slate-200 bg-white"
                      src={selectedLesson.contentUrl}
                    />
                  ) : (
                    <article className="prose max-w-none rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
                      <p>{selectedLesson.contentUrl}</p>
                    </article>
                  )}
                </div>
              ) : (
                <EmptyState title="Ready to start?" hint="Select Start lesson to open the lesson player." />
              )}
            </>
          ) : (
            <EmptyState title="No lesson selected" hint="Choose a lesson from the course content panel." />
          )}
        </div>
      </section>

      {(progress.data?.items ?? []).length ? (
        <section className="card">
          <h3 className="text-lg font-semibold text-slate-900">Learning Timeline</h3>
          <div className="mt-3 space-y-2">
            {(progress.data?.items ?? []).map((entry) => (
              <div key={entry.lesson_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">
                  {entry.completed ? "Lesson completed" : "Lesson in progress"}: {cleanTitle(entry.lesson_title ?? "Lesson")}
                </p>
                <p className="text-xs text-slate-500">
                  {entry.completed_at ? new Date(entry.completed_at).toLocaleString() : "Recently accessed"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
