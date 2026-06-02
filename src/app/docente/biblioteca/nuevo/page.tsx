import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { PublishResourcePage } from "@/components/platform/library/publish-resource-page";

export const metadata: Metadata = {
  title: "Publicar Nuevo Recurso — Docente",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ courseSlug?: string; back?: string }>;
};

export default async function DocenteNuevoRecursoPage({ searchParams }: Props) {
  const user = await requireUser("/docente/biblioteca/nuevo");

  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  const { courseSlug, back } = await searchParams;

  const teacherCourses = await getDb().courseTeacherAssignment.findMany({
    where: { userId: user.id },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });

  const courses = teacherCourses.map((a) => ({
    id: a.course.id,
    title: a.course.title,
  }));

  // Resolve preselected course from slug
  const preselectedCourse = courseSlug
    ? teacherCourses.find((a) => a.course.slug === courseSlug)?.course ?? null
    : null;

  // Safe back URL: only allow relative paths on this domain
  const backHref =
    back && back.startsWith("/") ? back : "/docente/biblioteca";

  return (
    <PublishResourcePage
      backHref={backHref}
      courses={courses}
      preselectedCourseId={preselectedCourse?.id ?? null}
      standalone
    />
  );
}
