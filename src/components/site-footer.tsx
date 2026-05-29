import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[rgba(12,113,195,0.12)] bg-white/76">
      <div className="site-container grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div className="space-y-4">
          <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--color-ink)]">
            {siteConfig.shortName}
          </p>
          <p className="max-w-xs text-sm leading-7 text-[var(--color-muted)]">
            Formación digital especializada en autismo para familias,
            profesionales y entidades. Campus privado, recursos protegidos
            y comunidad moderada por expertos.
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            <a
              className="hover:text-[var(--color-primary)]"
              href={`mailto:${siteConfig.supportEmail}`}
            >
              {siteConfig.supportEmail}
            </a>
          </p>
        </div>

        {/* Plataforma */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Plataforma
          </p>
          <nav className="space-y-3 text-sm text-[var(--color-ink)]">
            <Link className="block hover:text-[var(--color-primary)]" href="/">
              Inicio
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/plataforma"
            >
              Cómo funciona
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/acceder"
            >
              Acceder al campus
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/registro"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>

        {/* Cursos y comunidad */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Cursos
          </p>
          <nav className="space-y-3 text-sm text-[var(--color-ink)]">
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/cursos"
            >
              Catálogo completo
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/#comunidad"
            >
              Comunidad
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/mis-cursos"
            >
              Mi campus
            </Link>
          </nav>
        </div>

        {/* Legal y soporte */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Legal y soporte
          </p>
          <nav className="space-y-3 text-sm text-[var(--color-ink)]">
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/soporte"
            >
              Centro de ayuda
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/legal"
            >
              Aviso legal
            </Link>
            <Link
              className="block hover:text-[var(--color-primary)]"
              href="/legal#privacidad"
            >
              Privacidad y cookies
            </Link>
          </nav>
        </div>
      </div>

      <div className="site-container border-t border-[rgba(12,113,195,0.08)] py-5">
        <p className="text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
