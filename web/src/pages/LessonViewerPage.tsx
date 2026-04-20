import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";

export default function LessonViewerPage() {
  const [search] = useSearchParams();
  const type = search.get("type") ?? "text";
  const url = search.get("url") ?? "";

  const lessonTypeLabel = type === "video" ? "Video Lesson" : type === "pdf" ? "Reading Lesson" : "Interactive Lesson";

  const content = useMemo(() => {
    if (!url) return null;

    if (type === "video") {
      return <video className="w-full rounded-lg" src={url} controls preload="metadata" />;
    }

    if (type === "pdf") {
      return <iframe title="Reading lesson" className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white" src={url} />;
    }

    if (type === "scorm") {
      return <iframe title="Interactive lesson" className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white" src={url} />;
    }

    return <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{url}</article>;
  }, [type, url]);

  return (
    <div className="space-y-5">
      <header className="card">
        <h1 className="text-2xl font-semibold text-slate-900">Lesson Viewer</h1>
        <p className="mt-1 text-sm text-slate-600">{lessonTypeLabel}</p>
      </header>

      <section className="card">
        {content ?? <EmptyState title="No lesson available" hint="Return to your course and open a lesson to start learning." />}
      </section>
    </div>
  );
}
