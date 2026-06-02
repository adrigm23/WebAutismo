import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { CampusCommunity } from "@/components/platform/community/campus-community";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getInitials } from "@/lib/utils";
import { getAggregatedCommunityFeed } from "@/lib/forum-read";
import { buildCourseForumHref } from "@/lib/course-navigation";

export const metadata: Metadata = {
  title: "Comunidad | Campus",
  robots: { index: false, follow: false },
};

function buildNavItems(): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: "/comunidad", icon: "community" },
    { label: "Biblioteca", href: "/biblioteca", icon: "library" },
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

  const roleLabel =
    studentSpaces.length && staffSpaces.length
      ? "Alumno y docente"
      : staffSpaces.length
        ? "Docente"
        : "Alumno";

  const feedSpaces = spaces.map((s) => ({
    courseSlug: s.course.slug,
    courseTitle: s.course.title,
  }));

  const { threads, courses } = await getAggregatedCommunityFeed(feedSpaces);

  // "Nueva Consulta" → forum of the first course with an active space
  const primaryCourse = studentSpaces[0]?.course ?? staffSpaces[0]?.course ?? null;
  const newThreadHref = primaryCourse
    ? `${buildCourseForumHref(primaryCourse.slug)}/nuevo`
    : null;

  return (
    <StudentShell
      fullName={user.name}
      initials={getInitials(user.name)}
      navItems={buildNavItems()}
      notificationsCount={notificationSnapshot.unreadCount}
      roleLabel={roleLabel}
    >
      <CampusCommunity
        threads={threads}
        courses={courses}
        newThreadHref={newThreadHref}
        userInitials={getInitials(user.name)}
      />
    </StudentShell>
  );
}
