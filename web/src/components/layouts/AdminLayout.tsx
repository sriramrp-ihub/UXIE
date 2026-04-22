import clsx from "clsx";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/course-management", label: "Course Management" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/courses", label: "Course Oversight" },
  { to: "/admin/analytics", label: "Platform Analytics" },
  { to: "/admin/assistant", label: "Assistant" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#admin-main-content"
        className="sr-only left-4 top-4 z-50 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow focus:not-sr-only focus:absolute"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex w-full max-w-[1440px] gap-5 p-4 lg:p-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex">
          <Link to="/admin/dashboard" className="mb-5 block text-lg font-bold text-slate-900">
            AdminHub
          </Link>
          <nav className="space-y-2">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "block min-h-11 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:ring-blue-500",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Course quality and learner outcomes, all in one place.
          </div>
        </aside>

        <main id="admin-main-content" className="flex-1 space-y-4 scroll-mt-24" tabIndex={-1}>
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Welcome, {user?.name ?? "Admin"}</h1>
              <p className="text-xs text-slate-500">Platform operations and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 sm:block">
                {user?.email ?? "admin@platform"}
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
            </div>
          </header>
          <nav className="card flex gap-2 overflow-x-auto lg:hidden">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "min-h-11 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium focus-visible:ring-blue-500",
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
