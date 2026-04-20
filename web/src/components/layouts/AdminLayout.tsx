import clsx from "clsx";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/course-management", label: "Course Management" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/courses", label: "Course Oversight" },
  { to: "/admin/analytics", label: "Platform Analytics" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 p-4">
        <aside className="card sticky top-4 hidden h-[calc(100vh-2rem)] w-64 flex-col lg:flex">
          <Link to="/admin/dashboard" className="mb-4 block text-lg font-bold text-blue-300">
            Admin Console
          </Link>
          <nav className="space-y-2">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 space-y-4">
          <header className="card flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Welcome, {user?.name ?? "Admin"}</h1>
              <p className="text-xs text-slate-400">System-level control</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate("/login/admin", { replace: true });
              }}
            >
              Logout
            </button>
          </header>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
