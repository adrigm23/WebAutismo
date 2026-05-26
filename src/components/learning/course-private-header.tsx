"use client";

import type { ReactNode } from "react";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import {
  buildCourseForumHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";

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
  return (
    <AccountAuthHeader
      footerContent={footerContent}
      fullName={fullName}
      initials={getUserInitials(fullName)}
      navItems={[
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
        {
          label: "Mis cursos",
          href: "/mis-cursos",
        },
        {
          label: "Mi cuenta",
          href: "/mi-cuenta",
        },
      ]}
      roleLabel={roleLabel}
    />
  );
}
