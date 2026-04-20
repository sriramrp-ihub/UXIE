import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useLoginMutation } from "../../features/auth/useAuthMutations";
import { getErrorMessage } from "../../lib/api/helpers";
import { useAuthStore } from "../../store/auth.store";
import type { UserRole } from "../../types/domain";
import { roleDashboardPath, roleLabel } from "../../utils/roleRouting";

interface RoleLoginPageProps {
  role: UserRole;
}

export default function RoleLoginPage({ role }: RoleLoginPageProps) {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const loginMutation = useLoginMutation();
  const [form, setForm] = useState({
    email: role === "admin" ? "admin@example.com" : "student@example.com",
    password: "Password123!",
  });
  const [error, setError] = useState<string | null>(null);

  if (token && user) {
    return <Navigate to={roleDashboardPath(user.role)} replace />;
  }

  const routeRoleSlug = role === "admin" ? "admin" : "student";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{roleLabel(role)} Login</h1>
        <p className="text-xs text-slate-400">Dedicated authentication flow for {roleLabel(role).toLowerCase()} access.</p>

        <div>
          <label className="label">Email</label>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
        </div>

        <button
          className="btn w-full"
          disabled={loginMutation.isPending}
          onClick={async () => {
            setError(null);
            try {
              const me = await loginMutation.mutateAsync(form);
              if (me.role !== role) {
                logout();
                setError(`Role mismatch: this login is only for ${roleLabel(role)} users.`);
                return;
              }
              navigate(roleDashboardPath(role), { replace: true });
            } catch (err) {
              const message = getErrorMessage(err);
              if (message === "Email is not verified") {
                setError("Email is not verified. Please complete email verification, then login again.");
                return;
              }
              setError(message || "Unable to login. Check credentials and try again.");
            }
          }}
        >
          {loginMutation.isPending ? "Signing in..." : `Sign in as ${roleLabel(role)}`}
        </button>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <p className="text-xs text-slate-400">
          Need another role?{" "}
          <Link className="text-blue-300" to="/login/student">
            Learner
          </Link>{" "}
          ·{" "}
          <Link className="text-blue-300" to="/login/admin">
            Admin
          </Link>
        </p>
        <p className="text-xs text-slate-400">
          New account? Register via <Link to="/auth/register" className="text-blue-300">shared signup</Link>, then login at <code>/login/{routeRoleSlug}</code>.
        </p>
      </div>
    </div>
  );
}
