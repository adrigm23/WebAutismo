"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  BookCopy,
  ChartColumnBig,
  CircleHelp,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Search,
  Ticket,
  Tickets,
  UsersRound
} from "lucide-react";
import { logoutAction } from "@/actions/session";
import { ButtonLink } from "@/components/ui/button";
import { adminNavigation, getAdminSearchPlaceholder, getUserInitials } from "@/lib/admin-console";
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
    case "chart-column-big":
      return <ChartColumnBig className={className} strokeWidth={2} />;
    default:
      return <Ticket className={className} strokeWidth={2} />;
  }
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchPlaceholder = getAdminSearchPlaceholder(pathname);
  const searchValue = searchParams.get("q") ?? "";

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[var(--color-ink)]">
      <div className="grid min-h-screen lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#d6dde6] bg-[#f6f3ee] lg:flex lg:flex-col">
          <div className="px-8 pb-7 pt-10">
            <Link className="block" href="/admin">
              <div className="text-[2.6rem] font-bold tracking-[-0.07em] text-[var(--color-primary)]">
                Autismo
              </div>
              <div className="text-[2.1rem] font-bold tracking-[-0.08em] text-[#103456]">
                Cordoba
              </div>
              <p className="mt-3 text-[0.82rem] font-semibold uppercase tracking-[0.26em] text-[#22384f]">
                Admin Console
              </p>
            </Link>
          </div>

          <div className="px-7">
            <ButtonLink
              className="w-full justify-center rounded-2xl py-4 text-base shadow-none"
              href="/admin/courses?create=1"
            >
              + Nuevo curso
            </ButtonLink>
          </div>

          <nav className="mt-10 flex-1 space-y-2 px-7">
            {adminNavigation.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-3 text-[1.05rem] font-medium text-[#243444] transition hover:bg-white hover:text-[var(--color-primary)]",
                    isActive &&
                      "bg-[var(--color-primary)] text-white shadow-[0_14px_26px_rgba(12,113,195,0.18)] hover:bg-[var(--color-primary)] hover:text-white"
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

          <div className="border-t border-[#d6dde6] px-7 py-7">
            <div className="space-y-2">
              <a
                className="flex items-center gap-4 rounded-2xl px-4 py-3 text-[1.02rem] font-medium text-[#243444] transition hover:bg-white"
                href="mailto:formacion@autismocordoba.org"
              >
                <CircleHelp className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                <span>Support</span>
              </a>

              <form action={logoutAction}>
                <button
                  className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[1.02rem] font-medium text-[#243444] transition hover:bg-white"
                  type="submit"
                >
                  <LogOut className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                  <span>Salir</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[#d6dde6] bg-[#f7f4ef]/96 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-7 xl:px-10">
              <div className="lg:hidden">
                <Link className="text-[1.65rem] font-bold tracking-[-0.06em] text-[var(--color-primary)]" href="/admin">
                  Campus Admin
                </Link>
              </div>

              <form action={pathname} className="w-full max-w-[34rem]">
                <label className="relative block">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#53657a]">
                    <Search className="hidden h-5 w-5 sm:block" strokeWidth={1.8} />
                  </span>
                  <input
                    className="h-14 w-full rounded-full border border-[#c8d2de] bg-white pl-6 pr-5 text-[1.03rem] text-[#1f2c3a] shadow-[0_8px_20px_rgba(15,44,76,0.04)] outline-none transition placeholder:text-[#6c7784] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(12,113,195,0.12)] sm:pl-14"
                    defaultValue={searchValue}
                    name="q"
                    placeholder={searchPlaceholder}
                    type="search"
                  />
                </label>
              </form>

              <div className="ml-auto flex items-center gap-3 text-[#203345]">
                <Link
                  className="grid h-11 w-11 place-items-center rounded-full border border-transparent transition hover:border-[#c8d2de] hover:bg-white"
                  href="/mi-cuenta#notificaciones"
                >
                  <Bell className="h-5 w-5" strokeWidth={1.9} />
                </Link>
                <Link
                  className="grid h-11 w-11 place-items-center rounded-full border border-transparent transition hover:border-[#c8d2de] hover:bg-white"
                  href="/mi-cuenta"
                >
                  <CircleHelp className="h-5 w-5" strokeWidth={1.9} />
                </Link>
                <Link
                  className="grid h-11 w-11 place-items-center rounded-full border border-transparent transition hover:border-[#c8d2de] hover:bg-white"
                  href="/mi-cuenta"
                >
                  <Settings className="h-5 w-5" strokeWidth={1.9} />
                </Link>
                <Link
                  className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(12,113,195,0.18)]"
                  href="/mi-cuenta"
                >
                  {getUserInitials(user.name)}
                </Link>
              </div>
            </div>
          </header>

          <main className="px-5 py-8 sm:px-7 xl:px-10 xl:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
