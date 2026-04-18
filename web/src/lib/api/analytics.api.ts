import { apiClient } from "./client";
import { unwrap } from "./helpers";

export interface UserDashboard {
  user_id: string;
  enrolled_courses: number;
  average_score: number;
  time_spent: number;
  completed_lessons: number;
}

export interface GlobalDashboard {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  active_users: number;
  average_score: number;
}

export interface CourseAnalytics {
  course_id: string;
  completion_percentage: number;
  average_score: number;
  time_spent: number;
}

export const analyticsApi = {
  me: async () => unwrap<UserDashboard>(await apiClient.get("/analytics/dashboard/me")),
  global: async () => unwrap<GlobalDashboard>(await apiClient.get("/analytics/dashboard/global")),
  activeUsers: async () => unwrap<{ active_users: number }>(await apiClient.get("/analytics/active-users")),
  course: async (courseId: string) => unwrap<CourseAnalytics>(await apiClient.get(`/analytics/course/${courseId}`)),
  users: async () => unwrap<Array<{ id: string; name: string; email: string; role: string; is_verified: boolean }>>(await apiClient.get("/users")),
};
