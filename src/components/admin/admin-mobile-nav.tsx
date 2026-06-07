"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { logoutAction } from "@/actions/session";
import { adminNavigation } from "@/lib/admin-console";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client before using portals
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll (iOS-safe: position:fixed approach)
  useScrollLock(open);

  const drawer = open && mounted ? createPortal(
    // Portal renders directly on document.body — completely outside
    // the sticky header's stacking context (which was trapping z-index)
    <div className="fixed inset-0 z-[9999] flex lg:hidden">
      {/* Backdrop */}
      <button
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
        tabIndex={-1}
        type="button"
      />

      {/* Drawer panel */}
      <nav
        aria-label="Menu de administracion"
        className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-[linear-gradient(180deg,#f5f1eb_0%,#f4f7fb_100%)] shadow-2xl"
        id="admin-mobile-menu"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-safe pt-6">
          <Link
            className="block"
            href="/admin"
            onClick={() => setOpen(false)}
          >
            <div className="text-[1.7rem] font-bold tracking-[-0.06em] text-[var(--color-primary)]">
              {siteConfig.shortName}
            </div>
            <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
              Admin
            </p>
          </Link>
          <button
            aria-label="Cerrar menu"
            className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <div className="space-y-1">
            {adminNavigation.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={cn(
                    "flex items-center rounded-[var(--radius-md)] px-4 py-3.5 text-[1rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-ink)] hover:bg-white hover:text-[var(--color-primary)]",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer — always pinned, safe area for iPhone home bar */}
        <div
          className="shrink-0 border-t border-[var(--color-border-subtle)] px-3 pt-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
        >
          <div className="space-y-1">
            <Link
              className="flex items-center rounded-[var(--radius-md)] px-4 py-3.5 text-[1rem] font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              href="/mi-cuenta"
              onClick={() => setOpen(false)}
            >
              Mi cuenta
            </Link>
            <Link
              className="flex items-center rounded-[var(--radius-md)] px-4 py-3.5 text-[1rem] font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              href="/mi-cuenta#notificaciones"
              onClick={() => setOpen(false)}
            >
              Notificaciones
            </Link>
            <Link
              className="flex items-center rounded-[var(--radius-md)] px-4 py-3.5 text-[1rem] font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              href={`mailto:${siteConfig.supportEmail}`}
              onClick={() => setOpen(false)}
            >
              Soporte
            </Link>
            <form action={logoutAction}>
              <button
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3.5 text-left text-[1rem] font-semibold text-[var(--color-danger)] transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
                type="submit"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>
    </div>,
    document.body
  ) : null;

  return (
    <div className="lg:hidden">
      <button
        aria-controls="admin-mobile-menu"
        aria-expanded={open}
        aria-label={open ? "Cerrar menu" : "Abrir menu"}
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] transition hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu className="h-4 w-4" />
        Menu
      </button>

      {drawer}
    </div>
  );
}
