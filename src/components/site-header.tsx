"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

function getMobilePrimaryAction(pathname: string) {
  if (pathname === "/cursos" || pathname.startsWith("/cursos/")) {
    return { href: "/registro", label: "Comenzar Ahora" };
  }

  return { href: "/cursos", label: "Ver cursos" };
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobilePrimaryAction = getMobilePrimaryAction(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(248,246,243,0.94)] backdrop-blur-md">
      <div className="site-container py-3 lg:py-4">
        <div className="hidden items-center gap-8 lg:grid lg:grid-cols-[auto_1fr_auto]">
          <Link
            className="text-2xl font-bold leading-none tracking-[-0.05em] text-[var(--color-primary)]"
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
              Iniciar Sesión
            </ButtonLink>
            <ButtonLink href="/registro" variant="primary">
              Comenzar Ahora
            </ButtonLink>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Link
            className="min-w-0 text-[1.45rem] font-bold leading-[0.96] tracking-[-0.05em] text-[var(--color-primary)]"
            href="/"
          >
            {siteConfig.shortName}
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ButtonLink
              className="min-h-10 rounded-lg px-3.5 py-2 text-sm"
              href={mobilePrimaryAction.href}
              variant="primary"
            >
              {mobilePrimaryAction.label}
            </ButtonLink>

            <div className="relative">
              <button
                aria-controls="public-mobile-menu"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[rgba(12,113,195,0.16)] bg-white/92 px-3 text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)] transition-[border-color,background-color,color] duration-200 hover:border-[rgba(12,113,195,0.3)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                type="button"
              >
                <span className="sr-only">{isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}</span>
                {isMobileMenuOpen ? (
                  <X aria-hidden className="h-4 w-4" />
                ) : (
                  <Menu aria-hidden className="h-4 w-4" />
                )}
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[rgba(12,113,195,0.12)] bg-[rgba(248,246,243,0.995)] p-2 shadow-[0_16px_32px_rgba(21,35,50,0.12)] transition-[opacity,transform] duration-200 ${isMobileMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}
                id="public-mobile-menu"
              >
                <nav aria-label="Navegacion principal movil" className="flex flex-col">
                  {siteConfig.nav.map((item) => (
                    <Link
                      className="inline-flex min-h-11 items-center rounded-lg px-3.5 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                      href={item.href}
                      key={`mobile-${item.href}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-1 border-t border-[rgba(12,113,195,0.1)] pt-1.5">
                  <Link
                    className="inline-flex min-h-11 w-full items-center rounded-lg px-3.5 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    href="/acceder"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Acceder
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
