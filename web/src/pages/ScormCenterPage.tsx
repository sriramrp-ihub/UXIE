import { useState } from "react";
import { Link } from "react-router-dom";

import { useCatalog, useCourseStructure } from "../features/courses/useCourses";
import {
  useCommitScormMutation,
  useCourseScormPackages,
  useFinishScormMutation,
  useGetScormRuntimeMutation,
  useInitializeScormMutation,
  useSetScormRuntimeMutation,
  useUploadScormMutation,
} from "../features/scorm/useScorm";

export default function ScormCenterPage() {
  const [packageId, setPackageId] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [runtimeKey, setRuntimeKey] = useState("cmi.core.score.raw");
  const [runtimeValue, setRuntimeValue] = useState("85");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const catalog = useCatalog();
  const structure = useCourseStructure(courseId);
  const packages = useCourseScormPackages(courseId);

  const upload = useUploadScormMutation();
  const initialize = useInitializeScormMutation();
  const setRuntime = useSetScormRuntimeMutation();
  const getRuntime = useGetScormRuntimeMutation();
  const commit = useCommitScormMutation();
  const finish = useFinishScormMutation();

  const runtimeOutput =
    initialize.data ?? getRuntime.data ?? setRuntime.data ?? commit.data ?? finish.data ?? upload.data;

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-semibold">SCORM Center</h1>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Course</label>
            <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {(catalog.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Linked Lesson (recommended)</label>
            <select className="input" value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={!courseId || structure.isLoading}>
              <option value="">Select lesson</option>
              {(structure.data?.modules ?? []).flatMap((module) =>
                module.lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {module.title} • {lesson.title}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="label">SCORM Title (optional)</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">SCORM ZIP</label>
            <input className="input" type="file" accept=".zip" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <button
          className="btn"
          disabled={!courseId || !selectedFile || upload.isPending}
          onClick={async () => {
            const form = new FormData();
            form.append("course_id", courseId);
            if (lessonId) form.append("lesson_id", lessonId);
            if (title) form.append("title", title);
            if (selectedFile) form.append("file", selectedFile);
            const result = await upload.mutateAsync(form);
            setPackageId(result.id);
          }}
        >
          {upload.isPending ? "Uploading..." : "Upload SCORM"}
        </button>
      </section>

      <section className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">SCORM Package</label>
            <select className="input" value={packageId} onChange={(e) => setPackageId(e.target.value)} disabled={!courseId || packages.isLoading}>
              <option value="">Select package</option>
              {(packages.data ?? []).map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-400">
            <p>Registration is created automatically after Initialize.</p>
            <p>Current session: {registrationId || "not initialized"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            disabled={!packageId || initialize.isPending}
            onClick={async () => {
              const result = await initialize.mutateAsync(packageId);
              setRegistrationId(result.session_id);
            }}
          >
            Initialize
          </button>
          <button className="btn-secondary" disabled={!registrationId} onClick={() => commit.mutate(registrationId)}>
            Commit
          </button>
          <button className="btn-secondary" disabled={!registrationId} onClick={() => finish.mutate(registrationId)}>
            Finish
          </button>
          <Link className="btn-secondary" to={`/scorm/player/${packageId}`}>
            Open Player
          </Link>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Runtime Key</label>
            <input className="input" value={runtimeKey} onChange={(e) => setRuntimeKey(e.target.value)} />
          </div>
          <div>
            <label className="label">Runtime Value</label>
            <input className="input" value={runtimeValue} onChange={(e) => setRuntimeValue(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            disabled={!registrationId || setRuntime.isPending}
            onClick={() => setRuntime.mutate({ registrationId, key: runtimeKey, value: runtimeValue })}
          >
            Set Value
          </button>
          <button
            className="btn-secondary"
            disabled={!registrationId || getRuntime.isPending}
            onClick={() => getRuntime.mutate({ registrationId, key: runtimeKey || undefined })}
          >
            Get Value
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Runtime Output</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-xs">{JSON.stringify(runtimeOutput, null, 2)}</pre>
      </section>
    </div>
  );
}
