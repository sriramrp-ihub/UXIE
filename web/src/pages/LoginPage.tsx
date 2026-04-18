import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useLoginMutation } from "../features/auth/useAuthMutations";
import { useAuthStore } from "../store/auth.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({ email: "student@example.com", password: "Password123!" });
  const loginMutation = useLoginMutation();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
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
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
        </div>
        <button
          className="btn w-full"
          disabled={loginMutation.isPending}
          onClick={async () => {
            await loginMutation.mutateAsync(form);
            navigate("/dashboard", { replace: true });
          }}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </button>
        {loginMutation.error ? (
          <p className="text-sm text-red-300">Unable to login. Check credentials.</p>
        ) : null}
        <p className="text-sm text-slate-300">
          No account? <Link to="/auth/register" className="text-blue-300">Register</Link>
        </p>
      </div>
    </div>
  );
}
