import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { DocenteShell } from "@/components/docente/docente-shell";
import { PublishResourcePage } from "@/components/platform/library/publish-resource-page";

export const metadata: Metadata = {
  title: "Publicar Nuevo Recurso — Docente",
  robots: { index: false, follow: false },
};

export default async function DocenteNuevoRecursoPage() {
  const user = await requireUser("/docente/biblioteca/nuevo");

  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  const teacherCourses = await getDb().courseTeacherAssignment.findMany({
    where: { userId: user.id },
    include: { course: { select: { id: true, title: true } } },
  });

  const courses = teacherCourses.map((a) => ({
    id: a.course.id,
    title: a.course.title,
  }));

  const viewerName = user.name ?? user.email;

  return (
    <DocenteShell
      viewerName={viewerName}
      viewerInitials={getInitials(viewerName)}
    >
      <PublishResourcePage
        backHref="/docente/biblioteca"
        courses={courses}
      />
    </DocenteShell>
  );
}
