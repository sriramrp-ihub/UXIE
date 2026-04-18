import { useState } from "react";

import { useCatalog, useProgressByCourse } from "../../features/courses/useCourses";

export default function MentorStudentMonitoringPage() {
  const [courseId, setCourseId] = useState("");
  const [searchCourseId, setSearchCourseId] = useState("");
  const catalog = useCatalog();
  const progress = useProgressByCourse(searchCourseId);

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-semibold">Student Monitoring</h1>
        <div className="flex gap-2">
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {(catalog.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => setSearchCourseId(courseId)}>
            Track
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Progress Data</h2>
        <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs">{JSON.stringify(progress.data, null, 2)}</pre>
      </section>
    </div>
  );
}
