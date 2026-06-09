import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunityForCourse,
  canModerateCourse,
  getRoleLabel,
} from "@/lib/course-community";
import { getCampusResources } from "@/lib/course-resources";
import { CourseWorkspaceShell } from "@/components/learning/course-workspace/course-workspace-shell";
import { CourseResourceManager } from "@/components/learning/course-resource-manager";
import { CourseMaterialsLibrary } from "@/components/learning/course-materials-library";
import { getInitials } from "@/lib/utils";
import { normalizeCourseResourceQueryValue } from "@/lib/course-navigation";

type ResourcesPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: ResourcesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);
  return {
    title: course ? `Biblioteca | ${course.title}` : "Biblioteca de Recursos",
    robots: { index: false, follow: false },
  };
}

export default async function CourseResourcesPage({ params, searchParams }: ResourcesPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawResource = typeof sp.resource === "string" ? sp.resource : Array.isArray(sp.resource) ? sp.resource[0] : null;
  const focusedResourceId = normalizeCourseResourceQueryValue(rawResource);
  // Course lookup and auth are independent — run in parallel
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/recursos`),
  ]);

  if (!course) notFound();
  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed) {
    redirect(`/mis-cursos/${course.slug}/renovar-acceso`);
  }

  const canModerate = canModerateCourse(access.role);
  const resources = await getCampusResources({
    course,
    viewerUserId: user.id,
    canModerate,
  });

  const viewerName = user.name ?? user.email;

  return (
    <CourseWorkspaceShell
      courseTitle={course.title}
      roleLabel={getRoleLabel(access.role)}
      viewerInitials={getInitials(viewerName)}
      viewerName={viewerName}
    >
      {canModerate ? (
        // Docentes y admin: gestor completo con materiales + ejercicios
        <CourseResourceManager
          canModerate={canModerate}
          course={course}
          focusedResourceId={focusedResourceId}
          resources={resources}
          roleLabel={getRoleLabel(access.role)}
        />
      ) : (
        // Alumnos: solo materiales de contenido, sin tareas ni ejercicios
        <CourseMaterialsLibrary
          course={course}
          resources={resources}
        />
      )}
    </CourseWorkspaceShell>
  );
}
