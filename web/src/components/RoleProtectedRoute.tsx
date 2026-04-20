import { Navigate } from "react-router-dom";

import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types/domain";
import { roleDashboardPath } from "../utils/roleRouting";

interface RoleProtectedRouteProps {
  role: UserRole;
  children: React.ReactNode;
}

export function RoleProtectedRoute({ role, children }: RoleProtectedRouteProps) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) {
    return <Navigate to={`/login/${role === "admin" ? "admin" : "student"}`} replace />;
  }

  const adminAccessAllowed = role === "admin" && (user.role === "admin" || user.role === "instructor");

  if (!adminAccessAllowed && user.role !== role) {
    return <Navigate to={roleDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
