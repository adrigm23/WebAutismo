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
import { CourseResourceLibrary } from "@/components/platform/course-resources/course-resource-library";
import { getInitials } from "@/lib/utils";

type ResourcesPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ResourcesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);
  return {
    title: course ? `Biblioteca | ${course.title}` : "Biblioteca de Recursos",
    robots: { index: false, follow: false },
  };
}

export default async function CourseResourcesPage({ params }: ResourcesPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) notFound();

  const user = await requireUser(`/mis-cursos/${course.slug}/recursos`);
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
      <CourseResourceLibrary
        canModerate={canModerate}
        course={course}
        resources={resources}
        role={access.role}
      />
    </CourseWorkspaceShell>
  );
}
