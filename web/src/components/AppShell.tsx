import clsx from "clsx";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/auth.store";

const navItems: Array<{ to: string; label: string; roles: Array<"student" | "instructor" | "admin"> }> = [
  { to: "/dashboard", label: "Dashboard", roles: ["student", "instructor", "admin"] },
  { to: "/catalog", label: "Course Catalog", roles: ["student", "instructor", "admin"] },
  { to: "/learning", label: "My Learning", roles: ["student", "instructor", "admin"] },
  { to: "/quiz", label: "Quiz", roles: ["student", "instructor", "admin"] },
  { to: "/scorm", label: "SCORM", roles: ["student", "instructor", "admin"] },
  { to: "/analytics", label: "Analytics", roles: ["instructor", "admin"] },
  { to: "/admin", label: "Admin", roles: ["admin"] },
];

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const visibleNav = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  const onLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 p-4">
        <aside className="card sticky top-4 hidden h-[calc(100vh-2rem)] w-64 flex-col lg:flex">
          <Link to="/dashboard" className="mb-4 block text-lg font-bold text-blue-300">
            UXIE LMS
          </Link>
          <nav className="space-y-2">
            {visibleNav.map((item) => (
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
          <header className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Signed in</p>
              <h1 className="text-lg font-semibold text-slate-100">{user?.name ?? "User"}</h1>
              <p className="text-xs text-slate-400">Role: {user?.role ?? "-"}</p>
            </div>
            <button className="btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </header>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
