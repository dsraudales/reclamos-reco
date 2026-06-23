import Link from "next/link";
import { Clock3, FileText, FolderDown, SearchCheck } from "lucide-react";

import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, shortenId } from "@/lib/formatters";
import { listSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const submissions = await listSubmissions();

  const stats = submissions.reduce(
    (accumulator, submission) => {
      accumulator.total += 1;
      accumulator[submission.status] += 1;
      return accumulator;
    },
    {
      total: 0,
      new: 0,
      in_review: 0,
      resolved: 0,
    },
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_18px_45px_rgba(15,35,62,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Total
              </p>
              <p className="mt-4 text-4xl font-semibold text-ink">
                {stats.total}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_18px_45px_rgba(15,35,62,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Nuevas
              </p>
              <p className="mt-4 text-4xl font-semibold text-ink">
                {stats.new}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_18px_45px_rgba(15,35,62,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                En revisión
              </p>
              <p className="mt-4 text-4xl font-semibold text-ink">
                {stats.in_review}
              </p>
            </div>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <SearchCheck className="h-5 w-5" />
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_18px_45px_rgba(15,35,62,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Resueltas
              </p>
              <p className="mt-4 text-4xl font-semibold text-ink">
                {stats.resolved}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FolderDown className="h-5 w-5" />
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_24px_60px_rgba(15,35,62,0.10)]">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
              Bandeja operativa
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Solicitudes registradas
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Ordenadas por fecha de creación, de la más reciente a la más antigua.
          </p>
        </div>

        {submissions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50/85 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Solicitud</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold">Archivos</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="align-top">
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="font-semibold text-ink">
                          {submission.full_name}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          #{shortenId(submission.id)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium">{submission.client_code}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1 text-slate-600">
                        <p>{submission.phone || "Sin teléfono"}</p>
                        <p>{submission.email || "Sin correo"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">{submission.files_count}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {formatDateTime(submission.created_at)}
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="inline-flex rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-2xl text-ink">
              Aún no hay solicitudes registradas.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Cuando el formulario público reciba envíos, aparecerán aquí.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
