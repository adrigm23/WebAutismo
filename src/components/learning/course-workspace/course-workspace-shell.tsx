"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  CircleHelp,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  MessagesSquare,
  MessageSquareText,
  Search,
  Settings2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logoutAction } from "@/actions/session";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/mis-cursos", icon: LayoutGrid },
  { label: "Mis Cursos", href: "/mis-cursos", icon: GraduationCap },
  { label: "Mensajes", href: "/mensajes", icon: MessagesSquare },
  { label: "Comunidad", href: "#", icon: MessageSquareText, disabled: true },
  { label: "Biblioteca", href: "#", icon: BookOpen, disabled: true },
  { label: "Certificados", href: "#", icon: Award, disabled: true },
];

type CourseWorkspaceShellProps = {
  children: ReactNode;
  viewerName: string;
  viewerInitials: string;
  roleLabel: string;
  notificationsCount?: number;
};

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-5 pb-4 pt-6">
        <Link href="/mis-cursos" onClick={onNavigate}>
          <p className="text-base font-bold text-[#1a1f2e]">Learning Portal</p>
          <p className="mt-0.5 text-[0.7rem] text-[#9ba3af]">Professional Training</p>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Navegación campus">
        {NAV_ITEMS.map((item) => {
          const isActive =
            !item.disabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#c4c9d4] opacity-60"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1f2e]",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-emerald-600" : "",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="space-y-0.5 border-t border-[#f0f0f0] px-3 py-4">
        <Link
          href="/soporte"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
        >
          <CircleHelp className="h-4 w-4 shrink-0" />
          <span>Soporte</span>
        </Link>
        <Link
          href="/mi-cuenta"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
        >
          <Settings2 className="h-4 w-4 shrink-0" />
          <span>Configuración</span>
        </Link>
        <form action={logoutAction}>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6b7280] transition hover:bg-red-50 hover:text-red-600"
            type="submit"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function CourseWorkspaceShell({
  children,
  viewerName,
  viewerInitials,
  roleLabel,
  notificationsCount = 0,
}: CourseWorkspaceShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7]">
      {/* Desktop sidebar */}
      <aside className="hidden w-44 shrink-0 flex-col border-r border-[#eaeaec] bg-white lg:flex xl:w-48">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-48 bg-white shadow-xl">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Right side: topbar + content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 bg-white px-4 shadow-[0_1px_0_0_#eaeaec]">
          {/* Mobile menu button */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6] lg:hidden"
            onClick={() => setMobileOpen(true)}
            type="button"
            aria-label="Abrir menú"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Search bar */}
          <div className="flex flex-1 items-center justify-start">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-full bg-[#f3f4f6] px-4 py-2">
              <Search className="h-4 w-4 shrink-0 text-[#9ba3af]" />
              <input
                className="flex-1 bg-transparent text-sm text-[#1a1f2e] placeholder:text-[#9ba3af] focus:outline-none"
                placeholder="Buscar contenido..."
                type="text"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/mi-cuenta#notificaciones"
              aria-label="Notificaciones"
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#f3f4f6]"
            >
              <Bell className="h-4 w-4" />
              {notificationsCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[0.55rem] font-bold text-white">
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </span>
              )}
            </Link>
            <Link
              href="/soporte"
              aria-label="Ayuda"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#f3f4f6]"
            >
              <CircleHelp className="h-4 w-4" />
            </Link>
            <Link
              href="/mi-cuenta"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white"
              title={viewerName}
            >
              {viewerInitials}
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
