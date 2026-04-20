import { useRef } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { useScormPlayer } from "../features/scorm/useScormPlayer";

export default function ScormPlayerPage() {
  const { packageId = "" } = useParams();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const { status, currentLaunchUrl, report } = useScormPlayer(packageId, frameRef);

  if (!packageId) {
    return <EmptyState title="SCORM package not found" />;
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">SCORM Player</h1>
          <Link className="btn-secondary" to="/student/learning">
            Back to My Learning
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-300">{status}</p>
        <p className="mt-1 text-xs text-slate-400">Launch URL: {currentLaunchUrl || "pending"}</p>
        <p className="text-xs text-slate-400">
          Complete the SCO and close/exit it normally so your progress can be finalized.
        </p>
        {report ? (
          <div className="mt-2 grid gap-2 rounded border border-slate-700 p-3 text-xs md:grid-cols-4">
            <p>Completion: <span className="font-semibold">{report.completion}%</span></p>
            <p>Status: <span className="font-semibold">{report.status}</span></p>
            <p>Score: <span className="font-semibold">{report.score ?? "-"}</span></p>
            <p>Time: <span className="font-semibold">{report.timeSpent} sec</span></p>
          </div>
        ) : null}
      </section>
      <iframe ref={frameRef} title="SCORM Runtime" className="h-[75vh] w-full rounded-xl border border-slate-700 bg-white" />
    </div>
  );
}
