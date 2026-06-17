import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { ForumShell } from "@/components/forum/forum-shell";
import { CourseWorkspaceShell } from "@/components/learning/course-workspace/course-workspace-shell";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel,
} from "@/lib/course-community";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getForumCategories, getUserForumNotifications } from "@/lib/forum";
import { getInitials } from "@/lib/utils";

type ForumLayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ForumLayout({
  children,
  params,
}: ForumLayoutProps) {
  const { slug } = await params;
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/foro`),
  ]);

  if (!course) {
    notFound();
  }
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const [categories, forumNotifications] = await Promise.all([
    getForumCategories(course.slug, access.role),
    getUserForumNotifications({
      userId: user.id,
      courseSlugs: [course.slug],
      limit: 5,
    }),
  ]);

  const viewerName = user.name ?? user.email;
  const roleLabel = getRoleLabel(access.role);

  return (
    <CourseWorkspaceShell
      courseTitle={course.title}
      roleLabel={roleLabel}
      viewerInitials={getInitials(viewerName)}
      viewerName={viewerName}
    >
      <ForumShell
        canModerate={canModerateCourse(access.role)}
        categories={categories}
        course={course}
        forumNotifications={forumNotifications}
        roleLabel={roleLabel}
        showTrackingNav={canViewCourseProgress({
          globalRole: user.globalRole,
          viewerRole: access.role,
        })}
        user={user}
      >
        {children}
      </ForumShell>
    </CourseWorkspaceShell>
  );
}
