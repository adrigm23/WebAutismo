import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aviso legal y privacidad",
  description:
    "Informacion legal, privacidad y uso de la plataforma de formacion de Autismo Cordoba."
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Informacion legal
          </p>
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            Aviso legal, privacidad y uso responsable
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            Esta plataforma pertenece a {siteConfig.shortName}. Este contenido resume las bases
            legales y operativas necesarias para presentar el campus con un marco profesional y
            claro para alumnado, familias y entidades.
          </p>
        </div>

        <section className="rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Titularidad y contacto</h2>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
            Responsable del servicio: {siteConfig.name}. Para consultas legales, soporte operativo o
            ejercicio de derechos sobre tus datos puedes escribir a{" "}
            <a className="text-[var(--color-primary)]" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Privacidad</h2>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
            La plataforma trata datos de identificacion, acceso, compra y seguimiento academico con
            la finalidad de prestar el servicio formativo, gestionar matrículas y mantener la
            seguridad operativa del campus. El acceso a estos datos queda restringido al personal
            autorizado conforme al rol asignado.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Uso del campus</h2>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
            El alumnado y el equipo docente deben utilizar el campus de forma responsable,
            respetando la normativa interna, la propiedad intelectual de los materiales y las normas
            de convivencia en foros, recursos y comunicaciones.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            href="/registro"
          >
            Volver al registro
          </Link>
          <Link
            className="rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            href="/soporte"
          >
            Ir a soporte
          </Link>
        </div>
      </div>
    </main>
  );
}
