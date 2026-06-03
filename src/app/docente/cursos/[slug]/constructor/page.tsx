import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  CourseBuilder,
  type BuilderCourse,
} from "@/components/docente/course-builder/course-builder";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { TeacherShell } from "@/components/docente/teacher-shell";
import { getInitials } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getDb().course.findUnique({
    where: { slug },
    select: { title: true },
  });
  return {
    title: course ? `Constructor: ${course.title}` : "Constructor de Curso",
    robots: { index: false, follow: false },
  };
}

export default async function CourseBuilderPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/docente/cursos/${slug}/constructor`);

  const db = getDb();

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: {
          resources: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      teacherAssignments: {
        where: { userId: user.id },
        select: { id: true },
      },
    },
  });

  if (!course) notFound();

  // Allow global admins and assigned teachers only
  const isGlobalAdmin = user.globalRole === "ADMIN";
  const isAssignedTeacher = course.teacherAssignments.length > 0;
  if (!isGlobalAdmin && !isAssignedTeacher) {
    redirect("/mis-cursos");
  }

  const viewerName = user.name ?? user.email;
  const viewerInitials = getInitials(viewerName);

  const builderCourse: BuilderCourse = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category,
    status: course.status,
    accentFrom: course.accentFrom,
    accentTo: course.accentTo,
    modules: course.modules.map((mod, idx) => ({
      id: mod.id,
      title: mod.title,
      position: mod.position ?? idx + 1,
      resources: mod.resources.map((res) => ({
        id: res.id,
        title: res.title,
        type: res.type,
        source: res.source,
        mimeType: res.mimeType,
        estimatedTime: mod.estimatedTime ?? null,
      })),
    })),
  };

  return (
    <TeacherShell
      viewerName={viewerName}
      viewerInitials={viewerInitials}
      roleLabel="Docente"
    >
      <CourseBuilder course={builderCourse} embedded={true} />
    </TeacherShell>
  );
}
