"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareText,
  MessagesSquare,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/session";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/docente", icon: LayoutGrid },
  { label: "Mis Cursos", href: "/docente/cursos", icon: GraduationCap },
  { label: "Mensajes", href: "/mensajes", icon: MessagesSquare },
  { label: "Comunidad", href: "/comunidad", icon: MessageSquareText },
  { label: "Recursos", href: "/docente/biblioteca", icon: BookOpen },
  { label: "Calendario", href: "/docente/calendario", icon: CalendarDays },
];

export type TeacherShellProps = {
  children: ReactNode;
  viewerName: string;
  viewerInitials: string;
  roleLabel: string;
  notificationsCount?: number;
};

function isNavItemActive(pathname: string, href: string) {
  const path = href.split("?")[0]?.split("#")[0] ?? href;

  if (path === "/" || path === "" || path === "#") {
    return false;
  }

  // /docente exact match only (to avoid /docente/cursos also marking Dashboard active)
  if (path === "/docente") {
    return pathname === "/docente";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-4" aria-label="Navegación docente">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = !item.disabled && isNavItemActive(pathname, item.href);

        if (item.disabled) {
          return (
            <div
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[1.02rem] font-medium text-[var(--color-ink-soft)] opacity-50"
              key={item.label}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-[rgba(28,47,67,0.08)] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-soft)]">
                Próx.
              </span>
            </div>
          );
        }

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
              isActive &&
                "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] hover:bg-[var(--color-primary)] hover:text-white",
            )}
            href={item.href}
            key={item.label}
            onClick={onNavigate}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="px-6 pb-5 pt-8">
      <Link className="block" href="/docente">
        <div className="text-[1.85rem] font-bold tracking-[-0.06em] text-[var(--color-primary)]">
          {siteConfig.shortName}
        </div>
        <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-ink-soft)]">
          Portal docente
        </p>
      </Link>
    </div>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-[var(--color-border-subtle)] px-4 py-5">
      <div className="space-y-1">
        <Link
          className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          href="/soporte"
          onClick={onNavigate}
        >
          <CircleHelp className="h-5 w-5 shrink-0" strokeWidth={2} />
          <span>Soporte</span>
        </Link>
        <form action={logoutAction}>
          <button
            className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-left text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            type="submit"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function TeacherShell({
  children,
  viewerName,
  viewerInitials,
  roleLabel,
  notificationsCount = 0,
}: TeacherShellProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-[rgba(28,47,67,0.08)] bg-[#eef0f5] lg:flex lg:w-[260px] lg:flex-col">
        <SidebarBrand />
        <SidebarNav pathname={pathname} />
        <SidebarFooter />
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-[rgba(15,23,32,0.45)] backdrop-blur-sm"
            onClick={closeMobileNav}
            type="button"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-[rgba(28,47,67,0.08)] bg-[#eef0f5] shadow-2xl">
            <div className="flex items-start justify-between pr-3">
              <SidebarBrand />
              <button
                aria-label="Cerrar menú"
                className="mr-1 mt-7 grid h-10 w-10 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                onClick={closeMobileNav}
                type="button"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <SidebarNav
              onNavigate={closeMobileNav}
              pathname={pathname}
            />
            <SidebarFooter onNavigate={closeMobileNav} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[rgba(28,47,67,0.08)] bg-[rgba(248,250,252,0.95)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                aria-label="Abrir menú"
                className="grid h-10 w-10 place-items-center rounded-full border border-transparent text-[var(--color-ink-soft)] transition hover:border-[var(--color-border-subtle)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] lg:hidden"
                onClick={() => setIsMobileNavOpen(true)}
                type="button"
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>
              <Link
                className="truncate text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)] lg:hidden"
                href="/docente"
              >
                {siteConfig.shortName}
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                aria-label="Ir a notificaciones"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-transparent text-[var(--color-ink-soft)] transition hover:border-[var(--color-border-subtle)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                href="/notificaciones"
              >
                <Bell className="h-5 w-5" strokeWidth={1.9} />
                {notificationsCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[0.6rem] font-semibold text-white">
                    {notificationsCount > 9 ? "9+" : notificationsCount}
                  </span>
                ) : null}
              </Link>

              <Link
                className="flex items-center gap-2.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] py-1 pl-1 pr-2 transition hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:pr-3"
                href="/mi-cuenta"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
                  {viewerInitials}
                </span>
                <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {viewerName}
                  </span>
                  <span className="truncate text-[0.7rem] text-[var(--color-ink-soft)]">
                    {roleLabel}
                  </span>
                </span>
                <ChevronRight className="hidden h-4 w-4 text-[var(--color-ink-soft)] sm:block" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#f8fafc]">{children}</main>
      </div>
    </div>
  );
}
