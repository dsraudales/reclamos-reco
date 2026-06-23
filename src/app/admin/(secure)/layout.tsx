import Link from "next/link";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";

import { signOutAction } from "@/app/admin/actions";
import { requireAdminUser } from "@/lib/auth";

export default async function SecureAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdminUser();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f7fb_0%,#edf3fb_55%,#f8fafc_100%)]">
      <header className="border-b border-slate-200/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/12 text-brand">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">
                Panel interno
              </p>
              <h1 className="font-display text-2xl text-ink">
                Gestión de solicitudes
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right md:block">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Sesión activa
              </p>
              <p className="text-sm font-semibold text-slate-700">{user.email}</p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
            >
              Ver formulario
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-strong"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
