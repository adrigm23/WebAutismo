import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.14)] bg-[rgba(248,246,243,0.96)] backdrop-blur-md">
      <div className="site-container py-4">
        <div className="hidden items-center gap-8 md:grid md:grid-cols-[auto_1fr_auto]">
          <Link
            className="text-[2rem] font-bold leading-none tracking-[-0.05em] text-[var(--color-primary)] md:text-2xl"
            href="/"
          >
            {siteConfig.shortName}
          </Link>

          <nav aria-label="Navegacion principal" className="flex items-center justify-center gap-10">
            {siteConfig.nav.map((item) => (
              <Link
                className="border-b-2 border-transparent pb-1 text-base font-medium text-[var(--color-ink)] transition hover:text-[var(--color-primary)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
            <ButtonLink href="/acceder" variant="ghost">
              Acceder
            </ButtonLink>
            <ButtonLink href="/registro" variant="primary">
              Inscribirse
            </ButtonLink>
            <ButtonLink href={siteConfig.donateUrl} target="_blank" variant="accent">
              Dona
            </ButtonLink>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 md:hidden">
          <Link
            className="text-[2rem] font-bold leading-none tracking-[-0.05em] text-[var(--color-primary)]"
            href="/"
          >
            {siteConfig.shortName}
          </Link>

          <div className="flex items-center gap-2">
            <ButtonLink href="/acceder" variant="ghost">
              Acceder
            </ButtonLink>
            <ButtonLink href="/registro" variant="primary">
              Inscribirse
            </ButtonLink>
          </div>
        </div>

        <div className="mt-4 text-sm text-[var(--color-muted)] md:hidden">
          Formacion digital especializada
        </div>

        <nav
          aria-label="Navegacion principal movil"
          className="mt-4 grid grid-cols-2 gap-2 border-t border-[rgba(12,113,195,0.12)] pt-3 md:hidden"
        >
          {siteConfig.nav.map((item) => (
            <Link
              className="rounded-2xl border border-[rgba(12,113,195,0.12)] bg-white px-4 py-3 text-center text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              href={item.href}
              key={`mobile-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
