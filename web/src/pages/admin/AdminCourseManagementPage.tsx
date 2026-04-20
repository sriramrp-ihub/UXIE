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
  const [lessonForm, setLessonForm] = useState({
    module_id: "",
    title: "",
    content_type: "text" as "video" | "text" | "scorm",
    content_url: "",
  });
  const [scormTitle, setScormTitle] = useState("");
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [scormSummary, setScormSummary] = useState<{ title: string; launch_file: string } | null>(null);

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
  }, [catalog.data, selectedCourseId]);

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

        setScormSummary({ title: uploaded.title, launch_file: uploaded.launch_file });
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
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card space-y-2">
        <h2 className="font-semibold">Create Course</h2>
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
          <p className="text-xs text-red-300">Could not create course. Please check your permissions.</p>
        ) : null}
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Create Module</h2>
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
          <p className="text-xs text-red-300">Module creation failed. Please try again.</p>
        ) : null}
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Create Lesson</h2>
        <p className="text-xs text-slate-400">
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
          <div className="space-y-2 rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <label className="label">SCORM Display Title (optional)</label>
            <input
              className="input"
              placeholder="Leave blank to use lesson title"
              value={scormTitle}
              onChange={(e) => setScormTitle(e.target.value)}
            />
            <label className="label">SCORM ZIP File</label>
            <input className="input" type="file" accept=".zip" onChange={(e) => setScormFile(e.target.files?.[0] ?? null)} />
            {scormFile ? <p className="text-xs text-emerald-300">Ready: {scormFile.name}</p> : <p className="text-xs text-slate-400">Upload a SCORM .zip package.</p>}
            {scormError ? <p className="text-xs text-red-300">Upload failed: {scormError}</p> : null}
            {scormSummary ? (
              <p className="text-xs text-emerald-300">
                Uploaded: {scormSummary.title} ({scormSummary.launch_file})
              </p>
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
          <p className="text-xs text-red-300">Lesson creation failed. Please verify inputs and retry.</p>
        ) : null}
      </section>
    </div>
  );
}
