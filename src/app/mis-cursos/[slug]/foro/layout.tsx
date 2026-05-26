import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { ForumShell } from "@/components/forum/forum-shell";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel,
} from "@/lib/course-community";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getForumCategories, getUserForumNotifications } from "@/lib/forum";

type ForumLayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ForumLayout({
  children,
  params,
}: ForumLayoutProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro`);
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

  return (
    <ForumShell
      canModerate={canModerateCourse(access.role)}
      categories={categories}
      course={course}
      forumNotifications={forumNotifications}
      roleLabel={getRoleLabel(access.role)}
      showTrackingNav={canViewCourseProgress({
        globalRole: user.globalRole,
        viewerRole: access.role,
      })}
      user={user}
    >
      {children}
    </ForumShell>
  );
}
