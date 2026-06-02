"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/actions/session";
import { adminNavigation } from "@/lib/admin-console";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-controls="admin-mobile-menu"
        aria-expanded={open}
        aria-label={
          open
            ? "Cerrar menu de administracion"
            : "Abrir menu de administracion"
        }
        className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] transition-[border-color,background-color,color] duration-[var(--motion-duration-base)] hover:border-[var(--color-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>

      {open ? (
        <nav
          className="mt-3 grid gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-soft)]"
          id="admin-mobile-menu"
        >
          {adminNavigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={cn(
                  "rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
                  isActive
                    ? "ui-inverse-text bg-[var(--color-primary)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-surface)]",
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mt-1 grid gap-1 border-t border-[var(--color-border-subtle)] pt-3">
            <Link
              className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
              href="/mi-cuenta"
              onClick={() => setOpen(false)}
            >
              Mi cuenta
            </Link>
            <Link
              className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
              href="/mi-cuenta#notificaciones"
              onClick={() => setOpen(false)}
            >
              Notificaciones
            </Link>
            <Link
              className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
              href={`mailto:${siteConfig.supportEmail}`}
              onClick={() => setOpen(false)}
            >
              Soporte
            </Link>
            <form action={logoutAction}>
              <button
                className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
