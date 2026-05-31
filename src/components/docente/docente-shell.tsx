"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FolderOpen,
  MessageCircle,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Settings,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Panel", href: "/mis-cursos", icon: LayoutDashboard },
  { label: "Cursos", href: "/mis-cursos", icon: BookOpen },
  { label: "Pacientes", href: "#", icon: Users, disabled: true },
  { label: "Recursos", href: "#", icon: FolderOpen, disabled: true },
  { label: "Comunidad", href: "#", icon: MessageCircle, disabled: true },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Soporte", href: "/soporte", icon: HelpCircle },
];

type DocenteShellProps = {
  children: React.ReactNode;
  viewerName: string;
  viewerInitials: string;
};

function SidebarContent({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-[var(--color-ink)]">
            Campus Autismo
          </p>
          <p className="text-xs text-[var(--color-muted)]">Córdoba</p>
        </div>
      </div>

      {/* New report button */}
      <div className="px-3 pb-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nuevo Reporte
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Navegación docente">
        {NAV_ITEMS.map((item) => {
          const isActive =
            !item.disabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              onClick={item.disabled ? undefined : onNavClick}
              aria-disabled={item.disabled}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : item.disabled
                    ? "cursor-not-allowed text-[var(--color-border)] opacity-50"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-emerald-600" : "",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="space-y-0.5 border-t border-[var(--color-border)] px-3 py-3">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavClick}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
        <form action="/api/auth/logout" method="POST">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
            type="submit"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export function DocenteShell({
  children,
  viewerName,
  viewerInitials,
}: DocenteShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-[var(--color-border)] bg-white lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-52 bg-white shadow-xl">
            <SidebarContent
              pathname={pathname}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Right side: header + content ────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-5">
          <div className="flex items-center gap-3">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Abrir menú"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-[var(--color-ink)] lg:text-base">
              Campus Autismo Córdoba
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              type="button"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              type="button"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              type="button"
              aria-label="Configuración"
            >
              <Settings className="h-4 w-4" />
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white"
              title={viewerName}
            >
              {viewerInitials}
            </div>
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
