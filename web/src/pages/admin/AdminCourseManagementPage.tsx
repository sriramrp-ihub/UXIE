import { useEffect, useState } from "react";

import {
  useCatalog,
  useCourseStructure,
  useCreateCourseMutation,
  useCreateLessonMutation,
  useCreateModuleMutation,
} from "../../features/courses/useCourses";
import { useUploadScormMutation } from "../../features/scorm/useScorm";
import { getErrorMessage } from "../../lib/api/helpers";

export default function AdminCourseManagementPage() {
  const catalog = useCatalog();
  const createCourse = useCreateCourseMutation();
  const createModule = useCreateModuleMutation();
  const createLesson = useCreateLessonMutation();
  const uploadScorm = useUploadScormMutation();

  const [course, setCourse] = useState({ title: "", description: "" });
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const structure = useCourseStructure(selectedCourseId);

  const [moduleForm, setModuleForm] = useState({ course_id: "", title: "", order_index: 1 });
  const [quickScorm, setQuickScorm] = useState({
    course_id: "",
    module_id: "",
    lesson_title: "",
    scorm_title: "",
  });
  const [quickScormFile, setQuickScormFile] = useState<File | null>(null);
  const [quickScormSummary, setQuickScormSummary] = useState<{
    title: string;
    launch_file: string;
    activity_count: number;
    is_single_sco: boolean;
    health_warning?: string | null;
  } | null>(null);
  const [lessonForm, setLessonForm] = useState({
    module_id: "",
    title: "",
    content_type: "text" as "video" | "text" | "scorm",
    content_url: "",
  });
  const [scormTitle, setScormTitle] = useState("");
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [scormSummary, setScormSummary] = useState<{
    title: string;
    launch_file: string;
    activity_count: number;
    is_single_sco: boolean;
    health_warning?: string | null;
  } | null>(null);

  const scormError = uploadScorm.error ? getErrorMessage(uploadScorm.error) : null;

  useEffect(() => {
    if (selectedCourseId) {
      return;
    }
    const firstCourse = catalog.data?.[0];
    if (!firstCourse) {
      return;
    }
    setSelectedCourseId(firstCourse.id);
    setModuleForm((p) => ({ ...p, course_id: firstCourse.id }));
    setQuickScorm((p) => ({ ...p, course_id: firstCourse.id }));
  }, [catalog.data, selectedCourseId]);

  const createScormLesson = async (moduleId: string, lessonTitle?: string) => {
    if (!selectedCourseId || !moduleId || !quickScormFile || uploadScorm.isPending || createLesson.isPending) {
      return;
    }

    try {
      const form = new FormData();
      form.append("course_id", selectedCourseId);
      form.append("title", quickScorm.scorm_title || lessonTitle || "SCORM Lesson");
      form.append("file", quickScormFile);

      const uploaded = await uploadScorm.mutateAsync(form);
      await createLesson.mutateAsync({
        module_id: moduleId,
        title: lessonTitle || quickScorm.scorm_title || uploaded.title || "SCORM Lesson",
        content_type: "scorm",
        content_url: uploaded.file_path,
      });

      setQuickScormSummary({
        title: uploaded.title,
        launch_file: uploaded.launch_file,
        activity_count: uploaded.activity_count ?? 0,
        is_single_sco: Boolean(uploaded.is_single_sco),
        health_warning: uploaded.health_warning,
      });
      setQuickScorm((p) => ({ ...p, lesson_title: "", scorm_title: "" }));
      setQuickScormFile(null);
      structure.refetch();
    } catch {
      // errors are surfaced through mutation state
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.module_id || createLesson.isPending || uploadScorm.isPending) {
      return;
    }

    if (lessonForm.content_type === "scorm") {
      if (!selectedCourseId || !scormFile) {
        return;
      }

      try {
        const form = new FormData();
        form.append("course_id", selectedCourseId);
        form.append("title", scormTitle || lessonForm.title || "SCORM Lesson");
        form.append("file", scormFile);

        const uploaded = await uploadScorm.mutateAsync(form);
        await createLesson.mutateAsync({
          module_id: lessonForm.module_id,
          title: lessonForm.title,
          content_type: "scorm",
          content_url: uploaded.file_path,
        });

        setScormSummary({
          title: uploaded.title,
          launch_file: uploaded.launch_file,
          activity_count: uploaded.activity_count ?? 0,
          is_single_sco: Boolean(uploaded.is_single_sco),
          health_warning: uploaded.health_warning,
        });
        setLessonForm((p) => ({ ...p, title: "", content_url: "", module_id: "" }));
        setScormTitle("");
        setScormFile(null);
        structure.refetch();
      } catch {
        // errors are surfaced through mutation state
      }
      return;
    }

    createLesson.mutate(lessonForm, {
      onSuccess: () => {
        setLessonForm((p) => ({ ...p, title: "", content_url: "" }));
        structure.refetch();
      },
    });
  };

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-2xl font-semibold text-slate-900">Course Builder</h1>
        <p className="mt-1 text-sm text-slate-600">
          Primary flow: create a course, then organize it with modules. Add lessons/content only when needed.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Quick SCORM Upload</h2>
        <p className="text-sm text-slate-600">
          If you only want to upload a SCORM ZIP, use this section. Select course and module, then upload.
        </p>

        <select
          className="input"
          value={quickScorm.course_id}
          onChange={(e) => {
            const value = e.target.value;
            setQuickScorm((p) => ({ ...p, course_id: value, module_id: "" }));
            setSelectedCourseId(value);
            setModuleForm((p) => ({ ...p, course_id: value }));
            setLessonForm((p) => ({ ...p, module_id: "" }));
          }}
        >
          <option value="">Select course</option>
          {(catalog.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={quickScorm.module_id}
          onChange={(e) => setQuickScorm((p) => ({ ...p, module_id: e.target.value }))}
          disabled={!quickScorm.course_id}
        >
          <option value="">Select module</option>
          {(structure.data?.modules ?? []).map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </select>

        <input
          className="input"
          placeholder="Lesson title (optional)"
          value={quickScorm.lesson_title}
          onChange={(e) => setQuickScorm((p) => ({ ...p, lesson_title: e.target.value }))}
        />

        <input
          className="input"
          placeholder="SCORM display title (optional)"
          value={quickScorm.scorm_title}
          onChange={(e) => setQuickScorm((p) => ({ ...p, scorm_title: e.target.value }))}
        />

        <input
          className="input"
          type="file"
          accept=".zip"
          onChange={(e) => setQuickScormFile(e.target.files?.[0] ?? null)}
        />

        {(structure.data?.modules?.length ?? 0) === 0 && quickScorm.course_id ? (
          <p className="text-xs text-amber-700">No modules found in this course. Please create one in Step 2 below.</p>
        ) : null}
        {quickScormFile ? <p className="text-xs text-emerald-700">Ready: {quickScormFile.name}</p> : null}
        {scormError ? <p className="text-xs text-red-600">Upload failed: {scormError}</p> : null}

        <button
          className="btn"
          disabled={!quickScorm.course_id || !quickScorm.module_id || !quickScormFile || uploadScorm.isPending || createLesson.isPending}
          onClick={() => createScormLesson(quickScorm.module_id, quickScorm.lesson_title)}
        >
          {uploadScorm.isPending || createLesson.isPending ? "Uploading..." : "Upload SCORM ZIP"}
        </button>

        {quickScormSummary ? (
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="text-emerald-700">
              Uploaded: {quickScormSummary.title} ({quickScormSummary.launch_file})
            </p>
            <p className="text-slate-700">
              Detected SCO/activities: <span className="font-semibold">{quickScormSummary.activity_count}</span>
            </p>
            {quickScormSummary.is_single_sco ? (
              <div className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-800">
                <p className="font-semibold">SCORM Package Health Warning</p>
                <p>{quickScormSummary.health_warning ?? "Single SCO/activity detected."}</p>
              </div>
            ) : (
              <p className="text-emerald-700">Health: Multi-SCO package detected.</p>
            )}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Step 1: Create Course</h2>
        <p className="text-sm text-slate-600">Add a new course shell for instructors and learners.</p>
        <input className="input" placeholder="Title" value={course.title} onChange={(e) => setCourse((p) => ({ ...p, title: e.target.value }))} />
        <textarea className="input" placeholder="Description" value={course.description} onChange={(e) => setCourse((p) => ({ ...p, description: e.target.value }))} />
        <button
          className="btn"
          disabled={!course.title.trim() || createCourse.isPending}
          onClick={() =>
            createCourse.mutate(course, {
              onSuccess: (created) => {
                setSelectedCourseId(created.id);
                setModuleForm((p) => ({ ...p, course_id: created.id }));
                setCourse({ title: "", description: "" });
              },
            })
          }
        >
          {createCourse.isPending ? "Creating..." : "Create"}
        </button>
        {createCourse.isError ? (
          <p className="text-xs text-red-600">Could not create course. Please check your permissions.</p>
        ) : null}
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Step 2: Create Module</h2>
        <p className="text-sm text-slate-600">Organize lessons into clear, sequential modules.</p>
        <select
          className="input"
          value={moduleForm.course_id}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedCourseId(value);
            setModuleForm((p) => ({ ...p, course_id: value }));
            setLessonForm((p) => ({ ...p, module_id: "" }));
          }}
        >
          <option value="">Select course</option>
          {(catalog.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Title" value={moduleForm.title} onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))} />
        <input className="input" type="number" value={moduleForm.order_index} onChange={(e) => setModuleForm((p) => ({ ...p, order_index: Number(e.target.value) }))} />
        <button
          className="btn"
          disabled={!moduleForm.course_id || createModule.isPending}
          onClick={() =>
            createModule.mutate(moduleForm, {
              onSuccess: () => {
                setModuleForm((p) => ({ ...p, title: "", order_index: p.order_index + 1 }));
                structure.refetch();
              },
            })
          }
        >
          {createModule.isPending ? "Creating..." : "Create"}
        </button>
        {createModule.isError ? (
          <p className="text-xs text-red-600">Module creation failed. Please try again.</p>
        ) : null}
      </section>
      </div>

      <details className="card group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Step 3 (Optional): Add Lesson Content</h2>
            <p className="text-xs text-slate-500">Open only if you want manual lesson creation or SCORM uploads.</p>
          </div>
          <span className="text-xs font-medium text-slate-500 group-open:hidden">Show</span>
          <span className="hidden text-xs font-medium text-slate-500 group-open:inline">Hide</span>
        </summary>

        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">
            For SCORM lessons, choose <span className="font-semibold">scorm</span> as content type and upload ZIP here.
          </p>
          <select className="input" value={lessonForm.module_id} onChange={(e) => setLessonForm((p) => ({ ...p, module_id: e.target.value }))}>
            <option value="">Select module</option>
            {(structure.data?.modules ?? []).map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Title" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} />
          <select className="input" value={lessonForm.content_type} onChange={(e) => setLessonForm((p) => ({ ...p, content_type: e.target.value as typeof p.content_type }))}>
            <option value="text">text</option>
            <option value="video">video</option>
            <option value="scorm">scorm</option>
          </select>
          {lessonForm.content_type === "scorm" ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="label">SCORM Display Title (optional)</label>
              <input
                className="input"
                placeholder="Leave blank to use lesson title"
                value={scormTitle}
                onChange={(e) => setScormTitle(e.target.value)}
              />
              <label className="label">SCORM ZIP File</label>
              <input className="input" type="file" accept=".zip" onChange={(e) => setScormFile(e.target.files?.[0] ?? null)} />
              {scormFile ? <p className="text-xs text-emerald-700">Ready: {scormFile.name}</p> : <p className="text-xs text-slate-500">Upload a SCORM .zip package.</p>}
              {scormError ? <p className="text-xs text-red-600">Upload failed: {scormError}</p> : null}
              {scormSummary ? (
                <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                  <p className="text-emerald-700">
                    Uploaded: {scormSummary.title} ({scormSummary.launch_file})
                  </p>
                  <p className="text-slate-700">
                    Detected SCO/activities: <span className="font-semibold">{scormSummary.activity_count}</span>
                  </p>
                  {scormSummary.is_single_sco ? (
                    <div className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-800">
                      <p className="font-semibold">SCORM Package Health Warning</p>
                      <p>{scormSummary.health_warning ?? "Single SCO/activity detected."}</p>
                    </div>
                  ) : (
                    <p className="text-emerald-700">Health: Multi-SCO package detected.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <input className="input" placeholder="Content URL" value={lessonForm.content_url} onChange={(e) => setLessonForm((p) => ({ ...p, content_url: e.target.value }))} />
          )}
          <button
            className="btn"
            disabled={
              !lessonForm.module_id ||
              createLesson.isPending ||
              (lessonForm.content_type === "scorm" && (!selectedCourseId || !scormFile))
            }
            onClick={handleCreateLesson}
          >
            {lessonForm.content_type === "scorm"
              ? uploadScorm.isPending || createLesson.isPending
                ? "Uploading & Creating..."
                : "Upload SCORM & Create Lesson"
              : createLesson.isPending
                ? "Creating..."
                : "Create"}
          </button>
          {createLesson.isError ? (
            <p className="text-xs text-red-600">Lesson creation failed. Please verify inputs and retry.</p>
          ) : null}
        </div>
      </details>
    </div>
  );
}
