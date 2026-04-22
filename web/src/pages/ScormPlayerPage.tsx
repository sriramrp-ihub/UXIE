import { useRef } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { useScormPlayer } from "../features/scorm/useScormPlayer";

export default function ScormPlayerPage() {
  const { packageId = "" } = useParams();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const { status, currentLaunchUrl, report, bindApiToFrame } = useScormPlayer(packageId, frameRef);

  if (!packageId) {
    return <EmptyState title="Lesson not found" />;
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Interactive Lesson</h1>
          <Link className="btn-secondary" to="/student/learning">
            Back to Learning
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-600">{status}</p>
        <p className="text-xs text-slate-500">
          Complete the lesson and exit normally to save your progress.
        </p>
        {report ? (
          <div className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 md:grid-cols-4">
            <p>
              Completion: <span className="font-semibold">{report.completion}%</span>
            </p>
            <p>
              Status: <span className="font-semibold">{report.status}</span>
            </p>
            <p>
              Score: <span className="font-semibold">{report.score ?? "-"}</span>
            </p>
            <p>
              Time: <span className="font-semibold">{report.timeSpent} sec</span>
            </p>
          </div>
        ) : null}
        {currentLaunchUrl ? <p className="text-xs text-slate-400">Lesson loaded and ready.</p> : null}
      </section>
      <iframe
        ref={frameRef}
        title="Interactive lesson"
        src={currentLaunchUrl || "about:blank"}
        onLoad={bindApiToFrame}
        className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white"
      />
    </div>
  );
}
