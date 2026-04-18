import { useState } from "react";

import {
  useCatalog,
  useCourseStructure,
  useCreateCourseMutation,
  useCreateLessonMutation,
  useCreateModuleMutation,
} from "../../features/courses/useCourses";

export default function MentorCourseManagementPage() {
  const catalog = useCatalog();
  const createCourse = useCreateCourseMutation();
  const createModule = useCreateModuleMutation();
  const createLesson = useCreateLessonMutation();

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

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card space-y-2">
        <h2 className="font-semibold">Create Course</h2>
        <input className="input" placeholder="Title" value={course.title} onChange={(e) => setCourse((p) => ({ ...p, title: e.target.value }))} />
        <textarea className="input" placeholder="Description" value={course.description} onChange={(e) => setCourse((p) => ({ ...p, description: e.target.value }))} />
        <button className="btn" onClick={() => createCourse.mutate(course)}>Create</button>
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
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Create Lesson</h2>
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
        <input className="input" placeholder="Content URL" value={lessonForm.content_url} onChange={(e) => setLessonForm((p) => ({ ...p, content_url: e.target.value }))} />
        <button
          className="btn"
          disabled={!lessonForm.module_id || createLesson.isPending}
          onClick={() =>
            createLesson.mutate(lessonForm, {
              onSuccess: () => {
                setLessonForm((p) => ({ ...p, title: "", content_url: "" }));
                structure.refetch();
              },
            })
          }
        >
          {createLesson.isPending ? "Creating..." : "Create"}
        </button>
      </section>
    </div>
  );
}
