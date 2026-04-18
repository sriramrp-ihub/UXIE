import { Navigate } from "react-router-dom";

import type { UserRole } from "../types/domain";
import { useAuthStore } from "../store/auth.store";

interface RoleGuardProps {
  allow: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const role = useAuthStore((state) => state.user?.role);

  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
