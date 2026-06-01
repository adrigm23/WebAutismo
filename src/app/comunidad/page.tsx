import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { CampusCommunity } from "@/components/platform/community/campus-community";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Comunidad | Campus",
  robots: { index: false, follow: false },
};

function buildNavItems(): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: "/comunidad", icon: "community" },
    { label: "Biblioteca", href: "/app/recursos", icon: "library", disabled: true },
    { label: "Certificados", href: "/app/certificados", icon: "certificates", disabled: true },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
    { label: "Soporte", href: "/soporte", icon: "support" },
  ];
}

export default async function CommunityPage() {
  const user = await requireUser("/comunidad");

  const spaces = await getUserCourseSpaces({
    userId: user.id,
    email: user.email,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  const courseSlugs = spaces.map((s) => s.course.slug);
  const notificationSnapshot = await getDashboardNotificationSnapshot({
    userId: user.id,
    courseSlugs,
  });

  const studentSpaces = spaces.filter((s) => !isStaffCourseRole(s.role));
  const staffSpaces = spaces.filter((s) => isStaffCourseRole(s.role));
  const primaryCourse = studentSpaces[0]?.course ?? staffSpaces[0]?.course ?? null;

  const roleLabel =
    studentSpaces.length && staffSpaces.length
      ? "Alumno y docente"
      : staffSpaces.length
        ? "Docente"
        : "Alumno";

  return (
    <StudentShell
      fullName={user.name}
      initials={getInitials(user.name)}
      navItems={buildNavItems()}
      notificationsCount={notificationSnapshot.unreadCount}
      roleLabel={roleLabel}
    >
      <CampusCommunity primaryCourseTitle={primaryCourse?.title ?? null} />
    </StudentShell>
  );
}
