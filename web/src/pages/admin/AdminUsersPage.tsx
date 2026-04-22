import { useMemo, useState } from "react";

import { useAdminUsers, useTimeSpent } from "../../features/analytics/useAnalytics";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";

export default function AdminUsersPage() {
  const users = useAdminUsers(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "instructor" | "admin">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "pending">("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role">("name");
  const [selectedUserId, setSelectedUserId] = useState("");

  const selectedTime = useTimeSpent(selectedUserId, !!selectedUserId);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = (users.data ?? []).filter((u) => {
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" ? u.is_verified : !u.is_verified);

      return matchesSearch && matchesRole && matchesVerification;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "email") return a.email.localeCompare(b.email);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return a.name.localeCompare(b.name);
    });
  }, [users.data, search, roleFilter, verificationFilter, sortBy]);

  const totalUsers = (users.data ?? []).length;
  const verifiedCount = (users.data ?? []).filter((u) => u.is_verified).length;
  const studentsCount = (users.data ?? []).filter((u) => u.role === "student").length;

  if (users.isLoading) return <LoadingState message="Loading users..." />;

  return (
    <div className="space-y-5">
      <section className="card">
        <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-600">Review users with live filters and drill down into individual learning time.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalUsers}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{verifiedCount}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Verification</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalUsers - verifiedCount}</p>
        </article>
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{studentsCount}</p>
        </article>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input
            className="input"
            placeholder="Search by name, email, or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
            <option value="all">All roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="input"
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as typeof verificationFilter)}
          >
            <option value="all">All verification states</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="name">Sort by name</option>
            <option value="email">Sort by email</option>
            <option value="role">Sort by role</option>
          </select>
        </div>
      </section>

      <section className="grid items-start gap-3 sm:grid-cols-2">
        {filteredUsers.length ? (
          filteredUsers.map((u) => (
            <article key={u.id} className="card self-start space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">{u.name}</p>
                <span
                  className={
                    u.is_verified
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                  }
                >
                  {u.is_verified ? "Verified" : "Pending"}
                </span>
              </div>
              <p className="text-sm text-slate-600">{u.email}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role: {u.role}</p>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedUserId((prev) => (prev === u.id ? "" : u.id))}
                >
                  {selectedUserId === u.id ? "Hide details" : "View details"}
                </button>
              </div>

              {selectedUserId === u.id ? (
                <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {selectedTime.isLoading ? (
                    <p className="text-sm text-slate-600">Loading learning details...</p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700">
                        Total learning time: <span className="font-semibold">{selectedTime.data?.total_time_spent ?? 0} sec</span>
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time by course</p>
                        {(selectedTime.data?.courses ?? []).length ? (
                          (selectedTime.data?.courses ?? []).map((c) => (
                            <div key={c.course_id} className="rounded-lg border border-slate-200 bg-white p-2">
                              <p className="text-sm font-medium text-slate-800">{c.course_title}</p>
                              <p className="text-xs text-slate-500">{c.time_spent} sec</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No tracked learning time yet.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="sm:col-span-2">
            <EmptyState title="No users match your filters" hint="Try broadening your search or filters." />
          </div>
        )}
      </section>
    </div>
  );
}
