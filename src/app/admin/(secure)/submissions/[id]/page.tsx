import Link from "next/link";
import { FolderDown, MoveLeft, Phone, Save, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import { updateSubmissionAction } from "@/app/admin/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { STATUS_LABELS, SUBMISSION_STATUSES } from "@/lib/constants";
import {
  formatDateTime,
  formatFileSize,
  shortenId,
} from "@/lib/formatters";
import { getSubmissionDetail } from "@/lib/submissions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  validation: "No fue posible guardar los cambios. Revisa el formulario.",
};

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { submission, files } = await getSubmissionDetail(id);

  if (!submission) {
    notFound();
  }

  const successMessage =
    query.updated === "1" ? "La solicitud fue actualizada correctamente." : null;
  const errorMessage = query.error ? errorMessages[query.error] : null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-strong"
      >
        <MoveLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-white/70 bg-white p-7 shadow-[0_24px_60px_rgba(15,35,62,0.10)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
                Solicitud #{shortenId(submission.id)}
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink">
                {submission.full_name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Registrada el {formatDateTime(submission.created_at)}
              </p>
            </div>

            <StatusBadge status={submission.status} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Código del cliente
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {submission.client_code}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Cantidad de imágenes
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {submission.files_count}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <Phone className="h-4 w-4" />
                Teléfono
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {submission.phone || "No proporcionado"}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <UserRound className="h-4 w-4" />
                Correo
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {submission.email || "No proporcionado"}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">
                Archivos cargados
              </h2>
              <p className="text-sm text-slate-500">
                Descarga cada imagen mediante un enlace firmado de Supabase Storage.
              </p>
            </div>

            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Imagen {index + 1}: {file.file_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {file.content_type} · {formatFileSize(file.size_bytes)}
                    </p>
                  </div>

                  <a
                    href={`/api/admin/files/${file.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-strong"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FolderDown className="h-4 w-4" />
                    Descargar archivo
                  </a>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="rounded-[32px] border border-white/70 bg-white p-7 shadow-[0_24px_60px_rgba(15,35,62,0.10)]">
          <div className="border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
              Gestión interna
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink">
              Seguimiento de la solicitud
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Actualiza el estado operativo y agrega notas de atención para el
              equipo interno.
            </p>
          </div>

          <form action={updateSubmissionAction} className="mt-6 space-y-5">
            <input type="hidden" name="submissionId" value={submission.id} />

            <div className="space-y-2">
              <label
                htmlFor="status"
                className="text-sm font-semibold text-slate-700"
              >
                Estado de la solicitud
              </label>
              <select
                id="status"
                name="status"
                defaultValue={submission.status}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              >
                {SUBMISSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="notes"
                className="text-sm font-semibold text-slate-700"
              >
                Notas internas
              </label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={submission.notes ?? ""}
                rows={8}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="Ejemplo: validar legibilidad de imágenes, contactar al cliente, confirmar cierre..."
              />
            </div>

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              <Save className="h-4 w-4" />
              Guardar cambios
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
