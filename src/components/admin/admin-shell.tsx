"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  BookCopy,
  BookOpen,
  CalendarDays,
  ChartColumnBig,
  CircleHelp,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Search,
  Settings,
  Ticket,
  Tickets,
  UsersRound,
} from "lucide-react";
import { logoutAction } from "@/actions/session";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ButtonLink } from "@/components/ui/button";
import {
  adminNavigation,
  getAdminSearchPlaceholder,
  getUserInitials,
} from "@/lib/admin-console";
import { isDemoUserId } from "@/lib/demo-auth";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  children: ReactNode;
};

function AdminNavIcon({ name }: { name: string }) {
  const className = "h-[1.05rem] w-[1.05rem]";

  switch (name) {
    case "layout-dashboard":
      return <LayoutDashboard className={className} strokeWidth={2} />;
    case "users-round":
      return <UsersRound className={className} strokeWidth={2} />;
    case "graduation-cap":
      return <GraduationCap className={className} strokeWidth={2} />;
    case "book-copy":
      return <BookCopy className={className} strokeWidth={2} />;
    case "layers-3":
      return <Layers3 className={className} strokeWidth={2} />;
    case "tickets":
      return <Tickets className={className} strokeWidth={2} />;
    case "scroll-text":
      return <ScrollText className={className} strokeWidth={2} />;
    case "book-open":
      return <BookOpen className={className} strokeWidth={2} />;
    case "calendar-days":
      return <CalendarDays className={className} strokeWidth={2} />;
    case "chart-column-big":
      return <ChartColumnBig className={className} strokeWidth={2} />;
    default:
      return <Ticket className={className} strokeWidth={2} />;
  }
}

function getPrimaryAction(input: {
  pathname: string;
  searchParams: URLSearchParams;
  isDemoAdmin: boolean;
}) {
  if (input.isDemoAdmin) {
    return null;
  }

  if (input.pathname.startsWith("/admin/teachers")) {
    return { href: "/admin/teachers#create-teacher", label: "+ Crear docente" };
  }

  if (input.pathname.startsWith("/admin/editions")) {
    return {
      href: "/admin/editions?create=1#create-edition",
      label: "+ Nueva edicion",
    };
  }

  if (input.pathname.startsWith("/admin/promotions")) {
    return {
      href: "/admin/promotions?create=1#create-promotion",
      label: "+ Crear cupon",
    };
  }

  if (input.pathname.startsWith("/admin/audit")) {
    const q = input.searchParams.get("q") ?? "";
    const range = input.searchParams.get("range") ?? "7d";
    const actorId = input.searchParams.get("actorId") ?? "ALL";
    const action = input.searchParams.get("action") ?? "ALL";
    const entity = input.searchParams.get("entity") ?? "ALL";

    return {
      href: `/admin/audit/export?range=${encodeURIComponent(range)}&actorId=${encodeURIComponent(actorId)}&action=${encodeURIComponent(action)}&entity=${encodeURIComponent(entity)}&q=${encodeURIComponent(q)}`,
      label: "Exportar CSV",
    };
  }

  if (input.pathname.startsWith("/admin/courses")) {
    return { href: "/admin/courses/nuevo", label: "+ Nuevo curso" };
  }

  return { href: "/admin/courses/nuevo", label: "+ Nuevo curso" };
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchPlaceholder = getAdminSearchPlaceholder(pathname);
  const searchValue = searchParams.get("q") ?? "";
  const isDemoAdmin = isDemoUserId(user.id);
  const preservedSearchParams = Array.from(searchParams.entries()).filter(
    ([key]) => key !== "q",
  );
  const primaryAction = getPrimaryAction({
    pathname,
    searchParams: new URLSearchParams(searchParams.toString()),
    isDemoAdmin,
  });
  const navigationItems = adminNavigation;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[var(--color-ink)]">
      <div className="grid min-h-screen lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,#f5f1eb_0%,#f4f7fb_100%)] lg:flex lg:flex-col">
          <div className="px-8 pb-7 pt-10">
            <Link className="block" href="/admin">
              <div className="text-[2.35rem] font-bold tracking-[-0.07em] text-[var(--color-primary)]">
                {siteConfig.shortName}
              </div>
              <p className="mt-3 text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink-soft)]">
                Control central del campus
              </p>
            </Link>
          </div>

          <div className="px-7">
            {isDemoAdmin ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-5 py-4 text-sm leading-6 text-[var(--color-muted)]">
                Modo demo: secciones del panel con datos simulados.
              </div>
            ) : primaryAction ? (
              <ButtonLink
                className="w-full justify-center"
                href={primaryAction.href}
              >
                {primaryAction.label}
              </ButtonLink>
            ) : null}
          </div>

          <nav className="mt-10 flex-1 space-y-2 px-7">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={cn(
                    "flex items-center gap-4 rounded-[var(--radius-md)] px-4 py-3 text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition duration-[var(--motion-duration-base)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
                    isActive &&
                      "ui-inverse-text bg-[var(--color-primary)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-primary)]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <AdminNavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[var(--color-border-subtle)] px-7 py-7">
            <div className="space-y-2">
              <a
                className="flex items-center gap-4 rounded-[var(--radius-md)] px-4 py-3 text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition duration-[var(--motion-duration-base)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                href="mailto:formacion@autismocordoba.org"
              >
                <CircleHelp
                  className="h-[1.05rem] w-[1.05rem]"
                  strokeWidth={2}
                />
                <span>Soporte</span>
              </a>

              <form action={logoutAction}>
                <button
                  className="flex w-full items-center gap-4 rounded-[var(--radius-md)] px-4 py-3 text-left text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition duration-[var(--motion-duration-base)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                  type="submit"
                >
                  <LogOut className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[rgba(255,255,255,0.96)] backdrop-blur-md">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 xl:px-10">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <div className="flex min-w-0 items-center gap-2.5">
                  <AdminMobileNav />
                  <Link
                    className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]"
                    href="/admin"
                  >
                    AC Admin
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    aria-label="Abrir ajustes de mi cuenta"
                    className="hidden min-h-10 min-w-10 place-items-center rounded-full border border-transparent text-[var(--color-ink-soft)] transition duration-[var(--motion-duration-base)] hover:border-[var(--color-border)] hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)] sm:grid"
                    href="/mi-cuenta"
                  >
                    <Settings className="h-4 w-4" strokeWidth={1.9} />
                  </Link>
                  <Link
                    aria-label="Ir a mi cuenta"
                    className="ui-inverse-text grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                    href="/mi-cuenta"
                  >
                    {getUserInitials(user.name)}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <form className="w-full lg:max-w-[34rem]" method="get">
                  {preservedSearchParams.map(([key, value]) => (
                    <input
                      key={`${key}-${value}`}
                      name={key}
                      type="hidden"
                      value={value}
                    />
                  ))}
                  <label className="relative flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-4 text-[var(--color-muted)] shadow-[var(--shadow-inset-soft)] transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-surface-canvas)] sm:px-4 lg:min-h-[3.25rem] lg:px-5 lg:shadow-[var(--shadow-soft)]">
                    <span className="pointer-events-none mr-2 text-[var(--color-muted)] lg:mr-3">
                      <Search
                        className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]"
                        strokeWidth={1.8}
                      />
                    </span>
                    <input
                      className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 sm:text-[0.98rem]"
                      defaultValue={searchValue}
                      name="q"
                      placeholder={searchPlaceholder}
                      type="search"
                    />
                  </label>
                </form>

                <div className="hidden items-center gap-3 text-[var(--color-ink-soft)] lg:flex">
                  <Link
                    aria-label="Ir a notificaciones"
                    className="grid h-11 w-11 place-items-center rounded-full border border-transparent transition duration-[var(--motion-duration-base)] hover:border-[var(--color-border)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                    href="/mi-cuenta#notificaciones"
                  >
                    <Bell className="h-5 w-5" strokeWidth={1.9} />
                  </Link>
                  <Link
                    aria-label="Contactar con soporte"
                    className="grid h-11 w-11 place-items-center rounded-full border border-transparent transition duration-[var(--motion-duration-base)] hover:border-[var(--color-border)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                    href={`mailto:${siteConfig.supportEmail}`}
                  >
                    <CircleHelp className="h-5 w-5" strokeWidth={1.9} />
                  </Link>
                  <Link
                    aria-label="Abrir ajustes de mi cuenta"
                    className="grid h-11 w-11 place-items-center rounded-full border border-transparent transition duration-[var(--motion-duration-base)] hover:border-[var(--color-border)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                    href="/mi-cuenta"
                  >
                    <Settings className="h-5 w-5" strokeWidth={1.9} />
                  </Link>
                  <Link
                    aria-label="Ir a mi cuenta"
                    className="ui-inverse-text grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                    href="/mi-cuenta"
                  >
                    {getUserInitials(user.name)}
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <main className="px-5 py-8 sm:px-7 xl:px-10 xl:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
