import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { getAllCalendarEvents, getCalendarViewerContext } from "@/lib/calendar";
import { CalendarPage } from "@/components/platform/calendar/calendar-page";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { getUserCourseSpaces } from "@/lib/course-community";
import { buildCourseForumHref } from "@/lib/course-navigation";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Calendario",
  robots: { index: false, follow: false },
};

function buildStudentNavItems(communityHref: string): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: communityHref, icon: "community" },
    { label: "Calendario", href: "/calendario", icon: "calendar" },
    { label: "Biblioteca", href: "/biblioteca", icon: "library" },
    { label: "Certificados", href: "/app/certificados", icon: "certificates", disabled: true },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
    { label: "Soporte", href: "/soporte", icon: "support" },
  ];
}

export default async function CalendarioStudentPage() {
  const user = await requireUser("/calendario");

  const [viewerCtx, spaces, enrollments] = await Promise.all([
    getCalendarViewerContext({ userId: user.id, globalRole: user.globalRole }),
    getUserCourseSpaces({
      userId: user.id,
      email: user.email,
      userGlobalRole: user.globalRole,
      userIsActive: user.isActive,
    }),
    getDb().courseEnrollment.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { course: { select: { id: true, title: true, slug: true } } },
    }),
  ]);

  const events = await getAllCalendarEvents(viewerCtx);

  const courses = enrollments.map((e) => ({
    id: e.course.id,
    title: e.course.title,
    slug: e.course.slug,
  }));

  const studentSpaces = spaces.filter((s) => s.role === "STUDENT");
  const communityHref = studentSpaces[0]
    ? buildCourseForumHref(studentSpaces[0].course.slug)
    : "/mis-cursos";

  const viewerName = user.name ?? user.email;

  return (
    <StudentShell
      fullName={viewerName}
      initials={getInitials(viewerName)}
      roleLabel="Alumno"
      navItems={buildStudentNavItems(communityHref)}
    >
      <CalendarPage
        events={events}
        courses={courses}
        canManage={false}
      />
    </StudentShell>
  );
}
