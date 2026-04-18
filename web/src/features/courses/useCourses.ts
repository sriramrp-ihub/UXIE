import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { courseApi } from "../../lib/api/course.api";

export function useCatalog() {
  return useQuery({ queryKey: ["courses", "catalog"], queryFn: courseApi.listCourses });
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => courseApi.getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useCourseStructure(courseId: string) {
  return useQuery({
    queryKey: ["courses", "structure", courseId],
    queryFn: () => courseApi.getCourseStructure(courseId),
    enabled: !!courseId,
  });
}

export function useMyCourses() {
  return useQuery({ queryKey: ["courses", "mine"], queryFn: courseApi.myCourses });
}

export function useEnrollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => courseApi.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses", "mine"] });
      qc.invalidateQueries({ queryKey: ["analytics", "me"] });
    },
  });
}

export function useCreateCourseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courseApi.createCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses", "catalog"] }),
  });
}

export function useCreateModuleMutation() {
  return useMutation({ mutationFn: courseApi.createModule });
}

export function useCreateLessonMutation() {
  return useMutation({ mutationFn: courseApi.createLesson });
}

export function useProgressByCourse(courseId: string) {
  return useQuery({
    queryKey: ["progress", courseId],
    queryFn: () => courseApi.getProgressByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useUpdateProgressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courseApi.updateProgress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["analytics", "me"] });
      qc.invalidateQueries({ queryKey: ["courses", "mine"] });
    },
  });
}
