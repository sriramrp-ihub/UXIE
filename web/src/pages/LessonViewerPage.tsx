import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";

export default function LessonViewerPage() {
  const [search] = useSearchParams();
  const type = search.get("type") ?? "text";
  const url = search.get("url") ?? "";

  const content = useMemo(() => {
    if (!url) return null;

    if (type === "video") {
      return <video className="w-full rounded-lg" src={url} controls preload="metadata" />;
    }

    if (type === "pdf") {
      return <iframe title="PDF lesson" className="h-[70vh] w-full rounded-lg" src={url} />;
    }

    if (type === "scorm") {
      return <iframe title="SCORM lesson" className="h-[70vh] w-full rounded-lg" src={url} />;
    }

    return <article className="rounded-lg border border-slate-700 p-3 text-sm text-slate-300">{url}</article>;
  }, [type, url]);

  return (
    <div className="space-y-4">
      <header className="card">
        <h1 className="text-xl font-semibold">Lesson Viewer</h1>
        <p className="mt-1 text-sm text-slate-400">Supports video, PDF, and SCORM rendering.</p>
      </header>

      <section className="card">{content ?? <EmptyState title="No lesson URL provided" hint="Use /lesson-viewer?type=video|pdf|scorm&url=..." />}</section>
    </div>
  );
}
