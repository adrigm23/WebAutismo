import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getUserCourseSpaces } from "@/lib/course-community";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { CommunityThreadDetail } from "@/components/platform/community/community-thread-detail";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getInitials } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Discusión #${id} | Comunidad`,
    robots: { index: false, follow: false },
  };
}

function buildNavItems(): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: "/comunidad", icon: "community" },
    { label: "Biblioteca", href: "/app/recursos", icon: "library", disabled: true },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
    { label: "Soporte", href: "/soporte", icon: "support" },
  ];
}

export default async function CommunityThreadPage({ params }: Props) {
  const { id } = await params;

  // Only IDs 1–4 exist in mock data; return 404 for others
  const VALID_IDS = new Set(["1", "2", "3", "4"]);
  if (!VALID_IDS.has(id)) notFound();

  const user = await requireUser(`/comunidad/${id}`);

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

  return (
    <StudentShell
      fullName={user.name}
      initials={getInitials(user.name)}
      navItems={buildNavItems()}
      notificationsCount={notificationSnapshot.unreadCount}
      roleLabel={roleLabel}
    >
      <CommunityThreadDetail threadId={id} />
    </StudentShell>
  );
}
