import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/session";
import { Button, ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type AuthNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type AuthUtilityItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
  external?: boolean;
};

type AuthPrimaryAction = {
  label: string;
  href: string;
  variant?: ButtonVariant;
};

type AccountAuthHeaderProps = {
  fullName: string;
  initials: string;
  roleLabel: string;
  navItems: AuthNavItem[];
  utilityItems?: AuthUtilityItem[];
  primaryAction?: AuthPrimaryAction | null;
};

export function AccountAuthHeader({
  fullName,
  initials,
  roleLabel,
  navItems,
  utilityItems = [],
  primaryAction = null
}: AccountAuthHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.14)] bg-[rgba(255,255,255,0.92)] backdrop-blur-md">
      <div className="site-container py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-1 xl:flex-row xl:items-center xl:gap-6">
            <div className="flex items-center justify-between gap-4">
              <Link
                className="shrink-0 text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)]"
                href="/mi-cuenta"
              >
                {siteConfig.shortName}
              </Link>

              {primaryAction ? (
                <ButtonLink className="xl:hidden" href={primaryAction.href} variant={primaryAction.variant ?? "primary"}>
                  {primaryAction.label}
                </ButtonLink>
              ) : null}
            </div>

            <nav
              aria-label="Navegacion privada"
              className="flex flex-wrap items-center gap-1.5 xl:flex-1 xl:flex-nowrap xl:justify-start"
            >
              {navItems.map((item) => (
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition",
                    item.active
                      ? "border border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                  )}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 xl:min-w-0 xl:flex-row xl:items-center xl:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              {utilityItems.map((item) =>
                item.external ? (
                  <a
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                    href={item.href}
                    key={`${item.label}-${item.href}`}
                  >
                    {item.icon ? <span className="mr-2">{item.icon}</span> : null}
                    {item.label}
                    {item.badge}
                  </a>
                ) : (
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                    href={item.href}
                    key={`${item.label}-${item.href}`}
                  >
                    {item.icon ? <span className="mr-2">{item.icon}</span> : null}
                    {item.label}
                    {item.badge}
                  </Link>
                )
              )}

              {primaryAction ? (
                <ButtonLink
                  className="hidden xl:inline-flex"
                  href={primaryAction.href}
                  variant={primaryAction.variant ?? "primary"}
                >
                  {primaryAction.label}
                </ButtonLink>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-3 py-2 xl:max-w-[18rem]">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                  {initials}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{fullName}</p>
                  <p className="text-xs text-[var(--color-muted)]">{roleLabel}</p>
                </div>
              </div>

              <form action={logoutAction}>
                <Button className="px-3 py-2" type="submit" variant="subtle">
                  <LogOut className="h-4 w-4 xl:mr-2" />
                  <span className="hidden xl:inline">Salir</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
