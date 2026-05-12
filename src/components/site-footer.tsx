import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[rgba(12,113,195,0.12)] bg-white/76">
      <div className="site-container grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-5">
          <p className="text-3xl font-bold tracking-[-0.04em] text-[var(--color-ink)]">
            {siteConfig.shortName}
          </p>
          <p className="max-w-md text-base leading-8 text-[var(--color-muted)]">
            Formacion digital especializada en autismo para familias, profesionales y
            entidades. Compra online, campus privado por curso y acceso segun matricula y
            edicion.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Navegacion
          </p>
          <div className="space-y-3 text-base text-[var(--color-ink)]">
            <Link className="block hover:text-[var(--color-primary)]" href="/">
              Inicio
            </Link>
            <Link className="block hover:text-[var(--color-primary)]" href="/plataforma">
              Plataforma
            </Link>
            <Link className="block hover:text-[var(--color-primary)]" href="/cursos">
              Cursos
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Soporte
          </p>
          <div className="space-y-3 text-base text-[var(--color-ink)]">
            <p>{siteConfig.supportEmail}</p>
            <p>Contenidos y adjuntos privados bajo sesion.</p>
            <p>Acceso segun matricula, edicion y ventana vigente.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
