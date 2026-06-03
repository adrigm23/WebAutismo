import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import {
  getLibraryResources,
  getLibraryFolders,
  getViewerContext,
} from "@/lib/library";
import { LibraryPage } from "@/components/platform/library/library-page";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { getUserCourseSpaces } from "@/lib/course-community";
import { getInitials } from "@/lib/utils";
import { buildCourseForumHref } from "@/lib/course-navigation";

export const metadata: Metadata = {
  title: "Biblioteca Central",
  robots: { index: false, follow: false },
};

function buildStudentNavItems(communityHref: string): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: communityHref, icon: "community" },
    { label: "Calendario", href: "/calendario", icon: "calendar" },
    { label: "Biblioteca", href: "/biblioteca", icon: "library" },
    { label: "Certificados", href: "/certificados", icon: "certificates" },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
    { label: "Soporte", href: "/soporte", icon: "support" },
  ];
}

export default async function BibliotecaStudentPage() {
  const user = await requireUser("/biblioteca");

  const [viewerCtx, spaces] = await Promise.all([
    getViewerContext({ userId: user.id, globalRole: user.globalRole }),
    getUserCourseSpaces({
      userId: user.id,
      email: user.email,
      userGlobalRole: user.globalRole,
      userIsActive: user.isActive,
    }),
  ]);

  const [resources, folders] = await Promise.all([
    getLibraryResources({}, viewerCtx),
    getLibraryFolders(viewerCtx),
  ]);

  // Courses the student is enrolled in (for filter display)
  const enrolledCourses = await getDb().courseEnrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });

  const courses = enrolledCourses.map((e) => ({
    id: e.course.id,
    title: e.course.title,
    slug: e.course.slug,
  }));

  // Community href for nav
  const studentSpaces = spaces.filter((s) => s.role === "STUDENT");
  const communityHref =
    studentSpaces[0] ? buildCourseForumHref(studentSpaces[0].course.slug) : "/mis-cursos";

  const isManager = user.globalRole === "TEACHER" || user.globalRole === "ADMIN";
  const viewerName = user.name ?? user.email;
  const navItems = buildStudentNavItems(communityHref);

  return (
    <StudentShell
      fullName={viewerName}
      initials={getInitials(viewerName)}
      roleLabel={isManager ? "Docente" : "Alumno"}
      navItems={navItems}
    >
      <LibraryPage
        resources={resources}
        folders={folders}
        courses={courses}
        canManage={isManager}
        role={user.globalRole === "ADMIN" ? "admin" : isManager ? "teacher" : "student"}
        newResourceHref={isManager ? "/docente/biblioteca/nuevo" : undefined}
      />
    </StudentShell>
  );
}
