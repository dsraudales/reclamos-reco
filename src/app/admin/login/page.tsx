import { LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/admin/actions";
import { hasAdminAccess } from "@/lib/admin-access";
import { getCurrentUserOrNull } from "@/lib/auth";

const errorMessages: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  missing_fields: "Completa el correo y la contraseña.",
  no_access: "Tu usuario no tiene acceso al panel administrativo.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUserOrNull()]);

  if (user && hasAdminAccess(user)) {
    redirect("/admin");
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#edf4ff_0%,#f8fafc_45%,#e8edf5_100%)] px-6 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white/82 shadow-[0_32px_80px_rgba(15,35,62,0.14)] backdrop-blur lg:grid-cols-[1fr_420px]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#133b6c_0%,#0d2442_100%)] px-10 py-12 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(200,154,61,0.22),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
                <ShieldCheck className="h-7 w-7 text-accent" />
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.28em] text-white/70">
                  Acceso interno
                </p>
                <h1 className="max-w-sm font-display text-4xl leading-tight">
                  Panel administrativo para revisar y gestionar solicitudes.
                </h1>
                <p className="max-w-md text-base leading-7 text-white/78">
                  Inicia sesión con un usuario registrado en Supabase Auth y
                  autorizado para personal interno.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/14 bg-white/8 p-6">
              <p className="text-sm font-semibold text-white/92">
                Recomendación operativa
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Usa `ADMIN_EMAILS` o el rol `admin` en el usuario de Supabase
                para controlar el acceso a este módulo.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <div className="mx-auto flex max-w-sm flex-col gap-8">
            <div className="space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
                  Administradores
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">
                  Iniciar sesión
                </h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Accede al historial de solicitudes, descarga las fotografías
                alojadas en Supabase Storage y actualiza su estado.
              </p>
            </div>

            <form action={signInAction} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Correo institucional
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  placeholder="usuario@institucion.gob.hn"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  placeholder="********"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong"
              >
                Entrar al panel
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
