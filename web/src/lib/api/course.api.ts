import { apiClient } from "./client";
import { unwrap } from "./helpers";

import type { Course, Lesson, Module, ModuleWithLessons, ProgressSummary } from "../../types/domain";

export const courseApi = {
  listCourses: async () => unwrap<Course[]>(await apiClient.get("/courses")),
  getCourse: async (courseId: string) => unwrap<Course>(await apiClient.get(`/courses/${courseId}`)),
  getCourseStructure: async (courseId: string) =>
    unwrap<{ course_id: string; modules: ModuleWithLessons[] }>(
      await apiClient.get(`/courses/${courseId}/structure`)
    ),
  createCourse: async (payload: { title: string; description?: string | null }) =>
    unwrap<Course>(await apiClient.post("/courses", payload)),
  createModule: async (payload: { course_id: string; title: string; order_index: number }) =>
    unwrap<Module>(await apiClient.post("/courses/modules", payload)),
  createLesson: async (payload: { module_id: string; title: string; content_type: "video" | "text" | "scorm"; content_url: string }) =>
    unwrap<Lesson>(await apiClient.post("/courses/lessons", payload)),
  enroll: async (courseId: string) =>
    unwrap<{ id: string; course_id: string; message?: string; course?: { id: string; title: string } }>(
      await apiClient.post(`/enroll/${courseId}`)
    ),
  myCourses: async () => unwrap<Course[]>(await apiClient.get("/my-courses")),
  updateProgress: async (payload: { lesson_id: string; completed: boolean }) =>
    unwrap<{ progress: unknown; completion_percentage: number; course_id: string }>(
      await apiClient.post("/progress/update", payload)
    ),
  getProgressByCourse: async (courseId: string) =>
    unwrap<ProgressSummary>(await apiClient.get(`/progress/${courseId}`)),
};
