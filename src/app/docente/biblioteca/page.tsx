import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import {
  getLibraryResources,
  getLibraryFolders,
  getViewerContext,
} from "@/lib/library";
import { LibraryPage } from "@/components/platform/library/library-page";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Biblioteca Central — Docente",
  robots: { index: false, follow: false },
};

export default async function DocenteBibliotecaPage() {
  const user = await requireUser("/docente/biblioteca");

  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  const viewerCtx = await getViewerContext({ userId: user.id, globalRole: user.globalRole });

  const [resources, folders, teacherCourses] = await Promise.all([
    getLibraryResources({}, viewerCtx),
    getLibraryFolders(viewerCtx),
    getDb().courseTeacherAssignment.findMany({
      where: { userId: user.id },
      include: { course: { select: { id: true, title: true, slug: true } } },
    }),
  ]);

  const courses = teacherCourses.map((a) => ({
    id: a.course.id,
    title: a.course.title,
    slug: a.course.slug,
  }));

  const viewerName = user.name ?? user.email;

  return (
    <TeacherShell viewerName={viewerName} viewerInitials={getInitials(viewerName)} roleLabel="Docente">
      <LibraryPage
        resources={resources}
        folders={folders}
        courses={courses}
        canManage={true}
        role="teacher"
        newResourceHref="/docente/biblioteca/nuevo"
      />
    </TeacherShell>
  );
}
