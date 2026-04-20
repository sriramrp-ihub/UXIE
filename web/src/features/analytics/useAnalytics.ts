import { useQuery } from "@tanstack/react-query";

import { analyticsApi } from "../../lib/api/analytics.api";

export function useMyDashboard() {
  return useQuery({ queryKey: ["analytics", "me"], queryFn: analyticsApi.me });
}

export function useGlobalDashboard(enabled = true) {
  return useQuery({ queryKey: ["analytics", "global"], queryFn: analyticsApi.global, enabled });
}

export function useActiveUsers(enabled = true) {
  return useQuery({ queryKey: ["analytics", "active-users"], queryFn: analyticsApi.activeUsers, enabled });
}

export function useCourseAnalytics(courseId: string, enabled = false) {
  return useQuery({
    queryKey: ["analytics", "course", courseId],
    queryFn: () => analyticsApi.course(courseId),
    enabled: !!courseId && enabled,
  });
}

export function useDetailedCourseAnalytics(courseId: string, enabled = false) {
  return useQuery({
    queryKey: ["analytics", "course", courseId, "detailed"],
    queryFn: () => analyticsApi.detailedCourse(courseId),
    enabled: !!courseId && enabled,
  });
}

export function useTimeSpent(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "time-spent", userId],
    queryFn: () => analyticsApi.timeSpent(userId),
    enabled: !!userId && enabled,
  });
}

export function useAdminUsers(enabled = true) {
  return useQuery({ queryKey: ["admin", "users"], queryFn: analyticsApi.users, enabled });
}
