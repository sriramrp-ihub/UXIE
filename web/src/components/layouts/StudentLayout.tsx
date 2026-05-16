import clsx from "clsx";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";

const studentNav = [
  { to: "/student/dashboard", label: "Dashboard", shortLabel: "DB" },
  { to: "/student/courses", label: "My Courses", shortLabel: "MC" },
  { to: "/student/certificates", label: "Certificates", shortLabel: "CE" },
  { to: "/student/assistant", label: "Assistant", shortLabel: "AI" },
  { to: "/student/profile", label: "Profile", shortLabel: "ME" },
];

export function StudentLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,_#f7f8fc_0%,_#eef4ff_100%)]">
      <a
        href="#student-main-content"
        className="sr-only left-4 top-4 z-50 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow focus:not-sr-only focus:absolute"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex w-full max-w-[1480px] gap-5 p-4 lg:p-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] lg:flex">
          <div className="border-b border-white/10 px-5 pb-5 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/80">Learner Space</p>
            <Link to="/student/dashboard" className="mt-3 block text-2xl font-semibold tracking-tight text-white">
              LearnHub
            </Link>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Build momentum every day with guided learning, clean progress signals, and fast access to your next
              lesson.
            </p>
          </div>

          <nav className="space-y-2 px-4 py-5">
            {studentNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition focus-visible:ring-sky-400",
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_12px_40px_rgba(255,255,255,0.14)]"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={clsx(
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-bold tracking-[0.18em]",
                        isActive ? "bg-slate-950 text-white" : "bg-white/10 text-sky-100"
                      )}
                    >
                      {item.shortLabel}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto p-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">Focus today</p>
              <p className="mt-3 text-base font-semibold text-white">Keep the streak alive.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Review your active course, finish one lesson, and your dashboard will reflect the milestone instantly.
              </p>
            </div>
          </div>
        </aside>

        <main id="student-main-content" className="flex-1 space-y-4 scroll-mt-24" tabIndex={-1}>
          <header className="overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex w-fit items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Learning Dashboard
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                    Welcome back, {user?.name ?? "Learner"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Your workspace is set up to help you continue faster, revisit progress with less friction, and
                    stay focused on the next meaningful step.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Signed in as</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{user?.email ?? "Learner"}</p>
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
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-t border-slate-200/80 px-5 py-4 lg:hidden">
              {studentNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "min-h-11 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium focus-visible:ring-blue-500",
                      isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
