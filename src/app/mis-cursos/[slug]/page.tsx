import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getCourseProgressDetailsForUser } from "@/lib/course-progress";
import { canAccessCourseCommunityForCourse, getRoleLabel } from "@/lib/course-community";
import { getCampusResources } from "@/lib/course-resources";
import { CourseWorkspaceShell } from "@/components/learning/course-workspace/course-workspace-shell";
import { CourseWorkspacePage } from "@/components/learning/course-workspace/course-workspace-page";
import { getInitials } from "@/lib/utils";

type MyCoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MyCoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);
  return {
    title: course ? `Mi curso | ${course.title}` : "Mi curso",
    robots: { index: false, follow: false },
  };
}

export default async function MyCoursePage({ params }: MyCoursePageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) notFound();

  const user = await requireUser(`/mis-cursos/${course.slug}`);

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

  const [progress, resources] = await Promise.all([
    getCourseProgressDetailsForUser({ userId: user.id, course }),
    getCampusResources({ course, viewerUserId: user.id, canModerate: false }),
  ]);

  const viewerName = user.name ?? user.email;

  return (
    <CourseWorkspaceShell
      courseTitle={course.title}
      roleLabel={getRoleLabel(access.role)}
      viewerInitials={getInitials(viewerName)}
      viewerName={viewerName}
    >
      <CourseWorkspacePage
        course={course}
        progress={progress}
        resources={resources}
      />
    </CourseWorkspaceShell>
  );
}
