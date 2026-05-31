import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="site-container flex flex-col items-center justify-between gap-4 py-6 text-sm text-[var(--color-muted)] sm:flex-row">
        <p className="font-bold text-[var(--color-ink)]">{siteConfig.shortName}</p>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link className="transition hover:text-[var(--color-primary)]" href="/legal#privacidad">
            Privacidad
          </Link>
          <Link className="transition hover:text-[var(--color-primary)]" href="/legal">
            Términos de Uso
          </Link>
          <Link className="transition hover:text-[var(--color-primary)]" href="/soporte">
            Contacto
          </Link>
          <Link className="transition hover:text-[var(--color-primary)]" href="/">
            Sobre Nosotros
          </Link>
        </nav>

        <p className="text-center text-xs">
          © {new Date().getFullYear()} {siteConfig.name}. Innovación y Empatía en Educación
          Especial.
        </p>
      </div>
    </footer>
  );
}
