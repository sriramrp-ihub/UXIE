import type { UserRole } from "../types/domain";

export function roleDashboardPath(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "instructor":
      return "/admin/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/login/student";
  }
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "student":
      return "Learner";
    case "instructor":
      return "Admin";
    case "admin":
      return "Admin";
    default:
      return role;
  }
}
