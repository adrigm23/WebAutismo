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
    <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.14)] bg-[rgba(255,255,255,0.92)] backdrop-blur-md">
      <div className="site-container py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center xl:gap-5">
            <div className="flex items-center justify-between gap-4 xl:justify-start">
              <Link
                className="shrink-0 text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)]"
                href="/mi-cuenta"
              >
                {siteConfig.shortName}
              </Link>
            </div>

            <nav
              aria-label="Navegacion privada"
              className="flex flex-wrap items-center gap-1.5 xl:min-w-0 xl:justify-center"
            >
              {navItems.map((item) => (
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
                    item.active
                      ? "border border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]",
                  )}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-2 xl:min-w-0 xl:justify-end">
              <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-3 py-2 sm:max-w-[18rem]">
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

          {footerContent}
        </div>
      </div>
    </header>
  );
}
