"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type AuthNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type AccountAuthHeaderProps = {
  fullName: string;
  initials: string;
  roleLabel: string;
  navItems: AuthNavItem[];
  footerContent?: ReactNode;
};

export function AccountAuthHeader({
  fullName,
  initials,
  roleLabel,
  navItems,
  footerContent = null,
}: AccountAuthHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.92)] backdrop-blur-xl">
      <div className="site-container py-3 sm:py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center xl:gap-5">
            <div className="flex items-start justify-between gap-4 sm:items-center xl:justify-start">
              <Link
                className="shrink-0"
                href="/mis-cursos"
              >
                <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                  Campus privado
                </span>
                <span className="mt-1 block text-[1.1rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)] sm:text-[1.35rem] xl:text-[1.55rem]">
                  {siteConfig.shortName}
                </span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 xl:hidden">
                <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.08)] bg-white/86 px-2.5 py-2 shadow-[var(--shadow-inset-soft)]">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                    {initials}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                      {fullName}
                    </p>
                    <p className="hidden truncate text-xs text-[var(--color-muted)] sm:block">
                      {roleLabel}
                    </p>
                  </div>
                </div>

                <form action={logoutAction}>
                  <Button className="px-3 py-2" size="sm" type="submit" variant="subtle">
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Salir</span>
                  </Button>
                </form>
              </div>
            </div>

            <nav
              aria-label="Navegacion privada"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:min-w-0 xl:justify-center xl:overflow-visible xl:pb-0"
            >
              {navItems.map((item) => (
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-semibold whitespace-nowrap transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)] xl:min-h-11",
                    item.active
                      ? "border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                      : "border-transparent bg-[rgba(255,255,255,0.36)] text-[var(--color-ink)] hover:border-[rgba(22,60,88,0.08)] hover:bg-white hover:text-[var(--color-primary)]",
                  )}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden flex-wrap items-center justify-between gap-2 xl:flex xl:min-w-0 xl:justify-end">
              <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.08)] bg-white/86 px-3 py-2 shadow-[var(--shadow-inset-soft)] sm:max-w-[18rem]">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                  {initials}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {fullName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {roleLabel}
                  </p>
                </div>
              </div>

              <form action={logoutAction}>
                <Button className="px-3 py-2" type="submit" variant="subtle">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span>Salir</span>
                </Button>
              </form>
            </div>
          </div>

          {footerContent ? (
            <div className="border-t border-[rgba(22,60,88,0.08)] pt-4">{footerContent}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
