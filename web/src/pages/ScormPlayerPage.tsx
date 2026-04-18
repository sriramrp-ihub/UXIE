import { useRef } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { useScormPlayer } from "../features/scorm/useScormPlayer";

export default function ScormPlayerPage() {
  const { packageId = "" } = useParams();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const { status, currentLaunchUrl } = useScormPlayer(packageId, frameRef);

  if (!packageId) {
    return <EmptyState title="Missing package ID" />;
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
      </section>
      <iframe ref={frameRef} title="SCORM Runtime" className="h-[75vh] w-full rounded-xl border border-slate-700 bg-white" />
    </div>
  );
}
