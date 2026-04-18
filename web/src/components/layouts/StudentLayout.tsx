import clsx from "clsx";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";

const studentNav = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/courses", label: "Courses" },
  { to: "/student/learning", label: "My Learning" },
  { to: "/student/quiz", label: "Quiz" },
  { to: "/student/profile", label: "Profile" },
];

export function StudentLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 p-4">
        <aside className="card sticky top-4 hidden h-[calc(100vh-2rem)] w-64 flex-col lg:flex">
          <Link to="/student/dashboard" className="mb-4 block text-lg font-bold text-blue-300">
            Learner Portal
          </Link>
          <nav className="space-y-2">
            {studentNav.map((item) => (
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
              <h1 className="text-lg font-semibold">Welcome, {user?.name ?? "Learner"}</h1>
              <p className="text-xs text-slate-400">Student experience</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate("/login/student", { replace: true });
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
