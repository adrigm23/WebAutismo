import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CourseLearningShell } from "@/components/learning/course-learning-shell";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getCourseProgressDetailsForUser } from "@/lib/course-progress";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getCampusResources,
  getRoleLabel
} from "@/lib/course-community";
import { getForumCategories } from "@/lib/forum";

type MyCoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: MyCoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Mi curso | ${course.title}` : "Mi curso",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function MyCoursePage({ params }: MyCoursePageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const forumCategories = await getForumCategories(course.slug, access.role);
  const resources = getCampusResources(course);
  const canModerate = canModerateCourse(access.role);
  const progress = await getCourseProgressDetailsForUser({
    userId: user.id,
    course
  });

  return (
    <CourseLearningShell
      course={course}
      forumCategories={forumCategories}
      canModerate={canModerate}
      progress={progress}
      resources={resources}
      roleLabel={getRoleLabel(access.role)}
      editionLabel={course.activeEdition?.label ?? null}
      accessUntil={access.enrollment?.accessUntil ?? course.activeEdition?.accessUntil ?? null}
    />
  );
}
