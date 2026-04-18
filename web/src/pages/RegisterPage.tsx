import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useRegisterMutation } from "../features/auth/useAuthMutations";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const [form, setForm] = useState({
    name: "Test Student",
    email: "student@example.com",
    password: "Password123!",
    role: "student" as "student" | "instructor" | "admin",
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Create account</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as typeof form.role }))}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button
          className="btn w-full"
          disabled={registerMutation.isPending}
          onClick={async () => {
            await registerMutation.mutateAsync(form);
            navigate("/auth/login", { replace: true });
          }}
        >
          {registerMutation.isPending ? "Creating account..." : "Register"}
        </button>

        {registerMutation.error ? <p className="text-sm text-red-300">Registration failed.</p> : null}

        <p className="text-sm text-slate-300">
          Already have an account? <Link to="/auth/login" className="text-blue-300">Login</Link>
        </p>
      </div>
    </div>
  );
}
