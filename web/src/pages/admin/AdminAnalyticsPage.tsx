import { useState } from "react";

import { useCourseAnalytics, useGlobalDashboard } from "../../features/analytics/useAnalytics";
import { useCatalog } from "../../features/courses/useCourses";

export default function AdminAnalyticsPage() {
  const [courseId, setCourseId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const catalog = useCatalog();
  const global = useGlobalDashboard(true);
  const course = useCourseAnalytics(courseId, enabled);

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-semibold">Platform Analytics</h1>
        <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(global.data, null, 2)}</pre>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Course Analytics</h2>
        <div className="mt-2 flex gap-2">
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {(catalog.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => setEnabled(true)}>
            Load
          </button>
        </div>
        <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(course.data, null, 2)}</pre>
      </section>
    </div>
  );
}
