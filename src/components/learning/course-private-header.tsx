"use client";

import Link from "next/link";
import { Bell, CircleHelp, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/session";
import { Button } from "@/components/ui/button";
import {
  buildCourseForumHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type CoursePrivateSection = "campus" | "tracking" | "forum";

type CoursePrivateHeaderProps = {
  fullName: string;
  roleLabel: string;
  courseSlug: string;
  activeSection: CoursePrivateSection;
  showTrackingNav: boolean;
  notificationsCount?: number;
};

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function UtilityLink(input: {
  href: string;
  label: string;
  icon: typeof Bell;
  count?: number;
}) {
  return (
    <Link
      aria-label={input.label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition hover:bg-[rgba(22,60,88,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
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

export function CoursePrivateHeader({
  fullName,
  roleLabel,
  courseSlug,
  activeSection,
  showTrackingNav,
  notificationsCount = 0,
}: CoursePrivateHeaderProps) {
  const navItems = [
    {
      label: "Mis cursos",
      href: showTrackingNav && activeSection === "tracking"
        ? buildCourseTrackingHref({ courseSlug })
        : "/mis-cursos",
      active: activeSection === "campus" || activeSection === "tracking",
    },
    {
      label: "Comunidad",
      href: buildCourseForumHref(courseSlug),
      active: activeSection === "forum",
    },
    {
      label: "Soporte",
      href: "/soporte",
      active: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(22,60,88,0.08)] bg-[rgba(252,250,246,0.94)] backdrop-blur-xl">
      <div className="app-container py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          <Link className="shrink-0 text-[var(--color-ink)]" href="/mis-cursos">
            <span className="block text-[0.64rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
              Campus
            </span>
            <span className="mt-0.5 block text-[1rem] font-semibold tracking-[-0.04em] sm:text-[1.16rem]">
              {siteConfig.shortName}
            </span>
          </Link>

          <nav
            aria-label="Navegacion privada"
            className="hidden items-center gap-6 lg:flex"
          >
            {navItems.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "border-b-2 px-0.5 pb-1 text-[0.95rem] font-medium tracking-[-0.02em] transition",
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <UtilityLink
              count={notificationsCount}
              href="/mi-cuenta#notificaciones"
              icon={Bell}
              label="Abrir notificaciones"
            />
            <UtilityLink href="/soporte" icon={CircleHelp} label="Abrir soporte" />

            <Link
              aria-label={`${fullName} - ${roleLabel}`}
              className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(180deg,#d8b58a_0%,#6b4c37_100%)] text-sm font-semibold text-white transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              href="/mi-cuenta"
              title={`${fullName} - ${roleLabel}`}
            >
              {getUserInitials(fullName)}
            </Link>
            <form action={logoutAction}>
              <Button
                aria-label="Cerrar sesión"
                className="min-h-10 min-w-10 px-0 shadow-none"
                size="sm"
                type="submit"
                variant="subtle"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <nav
          aria-label="Navegacion privada movil"
          className="mt-2.5 flex items-center gap-4 overflow-x-auto pb-1 lg:hidden"
        >
          {navItems.map((item) => (
            <Link
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-0.5 pb-1 text-sm font-medium transition",
                item.active
                  ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-ink-soft)]",
              )}
              href={item.href}
              key={`mobile-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
