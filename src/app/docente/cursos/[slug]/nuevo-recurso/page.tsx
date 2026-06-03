import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { NuevoRecursoForm } from "@/components/docente/nuevo-recurso-form";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Añadir recurso — Portal Docente",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NuevoRecursoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const moduleId = typeof sp.moduleId === "string" ? sp.moduleId : null;
  const back =
    typeof sp.back === "string" && sp.back.startsWith("/")
      ? sp.back
      : `/docente/cursos/${slug}`;

  const user = await requireUser(`/docente/cursos/${slug}/nuevo-recurso`);
  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  const course = await getCatalogCourseBySlug(slug);
  if (!course) notFound();

  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });
  if (!access.allowed || !canModerateCourse(access.role)) {
    redirect("/mis-cursos");
  }

  const courseModule = moduleId
    ? await getDb().courseModule.findFirst({
        where: { id: moduleId, courseId: course.id },
        select: { id: true, title: true },
      })
    : null;

  const viewerName = user.name ?? user.email;

  return (
    <TeacherShell
      viewerName={viewerName}
      viewerInitials={getInitials(viewerName)}
      roleLabel="Docente"
    >
      <NuevoRecursoForm
        backHref={back}
        courseId={course.id}
        courseSlug={slug}
        moduleId={courseModule?.id ?? null}
        moduleTitle={courseModule?.title ?? null}
        redirectTo={`/docente/cursos/${slug}?tab=contenido`}
      />
    </TeacherShell>
  );
}
