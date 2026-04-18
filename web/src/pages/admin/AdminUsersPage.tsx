import { useAdminUsers } from "../../features/analytics/useAnalytics";

export default function AdminUsersPage() {
  const users = useAdminUsers(true);

  return (
    <section className="card">
      <h1 className="text-xl font-semibold">User Management</h1>
      <div className="mt-3 space-y-2">
        {(users.data ?? []).map((u) => (
          <article key={u.id} className="rounded-lg border border-slate-700 p-3 text-sm">
            <p className="font-medium">{u.name}</p>
            <p>{u.email}</p>
            <p>Role: {u.role}</p>
            <p>Verified: {String(u.is_verified)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
