import { EmptyState } from "../../components/EmptyState";

export default function StudentCertificatesPage() {
  return (
    <div className="space-y-5">
      <section className="card">
        <h1 className="text-2xl font-semibold text-slate-900">Certificates</h1>
        <p className="mt-2 text-sm text-slate-600">
          Celebrate your learning milestones. Certificates will appear here once available.
        </p>
      </section>

      <section className="card">
        <EmptyState
          title="No certificates yet"
          hint="Complete your enrolled courses to unlock your first certificate."
        />
      </section>
    </div>
  );
}
