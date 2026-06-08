import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import {
  getLibraryResources,
  getViewerContext,
  inferResourceType,
} from "@/lib/library";
import { buildProtectedCourseResourceUrl } from "@/lib/course-resource-storage";
import { StudentLibraryPage, type StudentCourseGroup, type StudentMaterial } from "@/components/platform/library/student-library-page";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { getUserCourseSpaces } from "@/lib/course-community";
import { getInitials } from "@/lib/utils";
import { buildCourseForumHref } from "@/lib/course-navigation";

export const metadata: Metadata = {
  title: "Biblioteca — Materiales",
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
  ];
}

export default async function BibliotecaStudentPage() {
  const user = await requireUser("/biblioteca");

  const [viewerCtx, spaces, enrolledCourses] = await Promise.all([
    getViewerContext({ userId: user.id, globalRole: user.globalRole }),
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

  const enrolledCourseIds = enrolledCourses.map((e) => e.course.id);

  // Course materials (non-exercise, published) from enrolled courses
  // + public LibraryResources without a course for "general resources"
  const [courseMaterialRows, libraryResources] = await Promise.all([
    enrolledCourseIds.length > 0
      ? getDb().courseResource.findMany({
          where: {
            courseId: { in: enrolledCourseIds },
            isPublished: true,
            type: "MATERIAL",
          },
          include: {
            module: { select: { title: true } },
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    getLibraryResources({}, viewerCtx),
  ]);

  // Build course groups preserving enrollment order
  const materialsByCourse = new Map<string, StudentMaterial[]>();
  for (const row of courseMaterialRows) {
    if (!materialsByCourse.has(row.courseId)) {
      materialsByCourse.set(row.courseId, []);
    }
    const displayType =
      row.source === "LINK" ? "LINK" : inferResourceType(row.mimeType ?? "");

    materialsByCourse.get(row.courseId)!.push({
      id: row.id,
      title: row.title,
      description: row.description,
      source: row.source,
      displayType,
      mimeType: row.mimeType,
      sizeInBytes: row.sizeInBytes,
      href:
        row.source === "FILE"
          ? buildProtectedCourseResourceUrl(row.id)
          : row.linkUrl,
      externalUrl: row.linkUrl,
      moduleTitle: row.module?.title ?? null,
      createdAt: row.createdAt,
    });
  }

  const courseGroups: StudentCourseGroup[] = enrolledCourses
    .map((e) => ({
      course: e.course,
      materials: materialsByCourse.get(e.course.id) ?? [],
    }))
    .filter((g) => g.materials.length > 0);

  // General resources: public LibraryResources not tied to any course
  const generalResources = libraryResources.filter((r) => !r.courseId);

  const studentSpaces = spaces.filter((s) => s.role === "STUDENT");
  const communityHref =
    studentSpaces[0] ? buildCourseForumHref(studentSpaces[0].course.slug) : "/mis-cursos";

  const viewerName = user.name ?? user.email;
  const isManager = user.globalRole === "TEACHER" || user.globalRole === "ADMIN";
  const navItems = buildStudentNavItems(communityHref);

  return (
    <StudentShell
      fullName={viewerName}
      initials={getInitials(viewerName)}
      roleLabel={isManager ? "Docente" : "Alumno"}
      navItems={navItems}
    >
      <StudentLibraryPage courseGroups={courseGroups} generalResources={generalResources} />
    </StudentShell>
  );
}
