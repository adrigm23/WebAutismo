import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Canales de ayuda y soporte del campus de Autismo Cordoba."
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Soporte
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Ayuda para acceso, compras y uso del campus
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            Si tienes incidencias con el acceso, materiales, pagos o funcionamiento del campus,
            utiliza este canal de soporte para que el equipo pueda revisar tu caso con contexto.
          </p>
        </div>

        <section className="rounded-[28px] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Contacto principal</h2>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
            Escribe a{" "}
            <a className="text-[var(--color-primary)]" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>{" "}
            indicando tu nombre, correo de acceso y una descripcion clara del problema.
          </p>
        </section>

        <section className="rounded-[28px] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Que incluir en la incidencia</h2>
          <ul className="mt-4 space-y-3 text-base leading-8 text-[var(--color-muted)]">
            <li>El curso o pantalla donde aparece el problema.</li>
            <li>La hora aproximada y los pasos previos.</li>
            <li>Captura o mensaje exacto si la plataforma muestra un error.</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <a
            className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            href={`mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent("Soporte campus Autismo Cordoba")}`}
          >
            Escribir a soporte
          </a>
          <Link
            className="rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            href="/legal"
          >
            Ver informacion legal
          </Link>
        </div>
      </div>
    </main>
  );
}
