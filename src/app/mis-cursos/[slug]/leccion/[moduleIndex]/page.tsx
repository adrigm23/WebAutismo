import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { getCourseProgressDetailsForUser } from "@/lib/course-progress";
import {
  canAccessCourseCommunityForCourse,
  getRoleLabel,
} from "@/lib/course-community";
import { getCampusResources } from "@/lib/course-resources";
import { LessonPlayer } from "@/components/learning/lesson-player/lesson-player";

type Props = {
  params: Promise<{ slug: string; moduleIndex: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);
  return {
    title: course ? `Lección | ${course.title}` : "Lección",
    robots: { index: false, follow: false },
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug, moduleIndex: moduleIndexRaw } = await params;

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

  // FIX #1: si el curso no tiene módulos, no hay lección que mostrar
  if (course.modules.length === 0) {
    redirect(`/mis-cursos/${slug}`);
  }

  const parsed = Number.parseInt(moduleIndexRaw, 10);
  const clampedIndex =
    Number.isNaN(parsed) || parsed < 0
      ? 0
      : Math.min(parsed, course.modules.length - 1);

  if (String(clampedIndex) !== moduleIndexRaw) {
    redirect(`/mis-cursos/${slug}/leccion/${clampedIndex}`);
  }

  const [progress, resources] = await Promise.all([
    getCourseProgressDetailsForUser({ userId: user.id, course }),
    getCampusResources({ course, viewerUserId: user.id, canModerate: false }),
  ]);

  return (
    <LessonPlayer
      course={course}
      moduleIndex={clampedIndex}
      progress={progress}
      resources={resources}
      roleLabel={getRoleLabel(access.role)}
      viewerName={user.name ?? user.email}
    />
  );
}
