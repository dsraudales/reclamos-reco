import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { PublicRequestForm } from "@/components/public-request-form";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
import creeLogo from "../../docs/LogoColor.png";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(180deg,#f8fbff_0%,#eff4fb_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(19,59,108,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(200,154,61,0.18),transparent_30%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:py-10">
          <div className="space-y-6">
            <div className="w-full max-w-[520px] rounded-[28px] border border-white/80 bg-white/92 p-3 shadow-[0_20px_50px_rgba(15,35,62,0.12)] sm:p-4">
              <Image
                src={creeLogo}
                alt="Gobierno de Honduras y CREE"
                className="h-auto w-full"
                priority
              />
            </div>

            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">
                Comisión Reguladora de Energía Eléctrica
              </p>
              <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">
                Recepción de Reclamos
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Completa la información del cliente y adjunta evidencias de
                forma segura.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[minmax(280px,0.36fr)_minmax(0,0.64fr)] lg:py-12">
        <div>
          <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#133b6c_0%,#0d2442_100%)] p-7 text-white shadow-[0_24px_60px_rgba(15,35,62,0.14)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/12 p-3 text-accent">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl">
                  Recomendaciones para el usuario
                </h2>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-7 text-white/82">
              <li>
                Adjunta fotografías claras y legibles de tu último recibo de
                pago y de tu nota de crédito o débito, con un peso máximo de{" "}
                {MAX_FILE_SIZE_MB} MB por imagen.
              </li>
              <li>
                El número o código del cliente es obligatorio para que el equipo
                pueda identificar la gestión.
              </li>
              <li>
                El teléfono y el correo son opcionales, pero ayudan a dar
                seguimiento cuando sea necesario.
              </li>
            </ul>
          </div>
        </div>

        <PublicRequestForm />
      </section>
    </main>
  );
}
