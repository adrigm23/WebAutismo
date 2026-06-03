"use client";

import Link from "next/link";
import { Bell, LogOut, Settings2 } from "lucide-react";
import { logoutAction } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type CampusHeaderNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type CampusPrivateHeaderProps = {
  fullName: string;
  initials: string;
  roleLabel: string;
  navItems: CampusHeaderNavItem[];
  notificationsHref?: string;
  notificationsCount?: number;
  settingsHref?: string;
  profileHref?: string;
};

function UtilityLink(input: {
  href: string;
  label: string;
  icon: typeof Bell;
  count?: number;
}) {
  return (
    <Link
      aria-label={input.label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent text-[var(--color-ink)] transition hover:border-[rgba(22,60,88,0.08)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      href={input.href}
    >
      <input.icon className="h-5 w-5" />
      {input.count ? (
        <span className="absolute right-2 top-2 min-w-4 rounded-full bg-[var(--color-primary)] px-1 text-center text-[0.62rem] font-semibold leading-4 text-white">
          {input.count > 9 ? "9+" : input.count}
        </span>
      ) : null}
    </Link>
  );
}

export function CampusPrivateHeader({
  fullName,
  initials,
  roleLabel,
  navItems,
  notificationsHref = "/mi-cuenta#notificaciones",
  notificationsCount = 0,
  settingsHref = "/mi-cuenta",
  profileHref = "/mi-cuenta",
}: CampusPrivateHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.94)] backdrop-blur-xl">
      <div className="site-container py-3 sm:py-4">
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center xl:gap-6">
          <div className="flex items-center justify-between gap-3 xl:justify-start">
            <Link className="shrink-0" href="/mis-cursos">
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-ink-soft)]">
                Campus privado
              </span>
              <span className="mt-1 block text-[1.1rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)] sm:text-[1.35rem] xl:text-[1.55rem]">
                {siteConfig.shortName}
              </span>
            </Link>

            <div className="flex items-center gap-1.5 xl:hidden">
              <UtilityLink
                count={notificationsCount}
                href={notificationsHref}
                icon={Bell}
                label="Abrir notificaciones"
              />
              <UtilityLink
                href={settingsHref}
                icon={Settings2}
                label="Abrir ajustes"
              />
            </div>
          </div>

          <nav
            aria-label="Navegacion del campus"
            className="flex items-center gap-5 overflow-x-auto pb-1 xl:justify-center xl:overflow-visible xl:pb-0"
          >
            {navItems.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "shrink-0 border-b-2 px-0.5 pb-2 text-sm font-medium tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                  item.active
                    ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-ink-soft)] hover:border-[rgba(22,60,88,0.18)] hover:text-[var(--color-ink)]",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-3 xl:justify-end">
            <div className="hidden items-center gap-1.5 xl:flex">
              <UtilityLink
                count={notificationsCount}
                href={notificationsHref}
                icon={Bell}
                label="Abrir notificaciones"
              />
              <UtilityLink
                href={settingsHref}
                icon={Settings2}
                label="Abrir ajustes"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                className="flex min-w-0 items-center gap-3 rounded-full border border-[rgba(22,60,88,0.08)] bg-[rgba(223,234,243,0.52)] px-3 py-2 shadow-[var(--shadow-inset-soft)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:pr-4"
                href={profileHref}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                  {initials}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {fullName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {roleLabel}
                  </p>
                </div>
              </Link>

              <form action={logoutAction}>
                <Button
                  aria-label="Cerrar sesión"
                  className="px-3 py-2"
                  size="sm"
                  type="submit"
                  variant="subtle"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
