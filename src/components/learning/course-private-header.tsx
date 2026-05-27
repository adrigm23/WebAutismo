"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import {
  buildCourseForumHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import { getPrivateNavItems } from "@/lib/private-navigation";
import { cn } from "@/lib/utils";

type CoursePrivateSection = "campus" | "tracking" | "forum";

type CoursePrivateHeaderProps = {
  fullName: string;
  roleLabel: string;
  courseSlug: string;
  activeSection: CoursePrivateSection;
  showTrackingNav: boolean;
  footerContent?: ReactNode;
};

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export function CoursePrivateHeader({
  fullName,
  roleLabel,
  courseSlug,
  activeSection,
  showTrackingNav,
  footerContent = null,
}: CoursePrivateHeaderProps) {
  const courseNavItems = [
    {
      label: "Campus",
      href: `/mis-cursos/${courseSlug}`,
      active: activeSection === "campus",
    },
    ...(showTrackingNav
      ? [
          {
            label: "Seguimiento",
            href: buildCourseTrackingHref({ courseSlug }),
            active: activeSection === "tracking",
          },
        ]
      : []),
    {
      label: "Foro",
      href: buildCourseForumHref(courseSlug),
      active: activeSection === "forum",
    },
  ];

  return (
    <AccountAuthHeader
      fullName={fullName}
      initials={getUserInitials(fullName)}
      navItems={getPrivateNavItems("courses")}
      roleLabel={roleLabel}
      footerContent={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Navegacion del curso
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Mantienes el mismo campus y cambias solo de contexto.
            </p>
          </div>

          <nav aria-label="Secciones del curso" className="flex flex-wrap gap-1.5">
            {courseNavItems.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                  item.active
                    ? "border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                    : "border-transparent bg-[rgba(255,255,255,0.32)] text-[var(--color-ink-soft)] hover:border-[rgba(22,60,88,0.08)] hover:bg-white hover:text-[var(--color-primary)]",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {footerContent}
        </div>
      }
    />
  );
}
