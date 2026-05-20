"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { adminNavigation } from "@/lib/admin-console";
import { cn } from "@/lib/utils";

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-controls="admin-mobile-menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-[#d6dde6] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>

      {open ? (
        <nav
          className="mt-3 grid gap-2 rounded-2xl border border-[#d6dde6] bg-white p-3 shadow-[var(--shadow-soft)]"
          id="admin-mobile-menu"
        >
          {adminNavigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "ui-inverse-text bg-[var(--color-primary)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
