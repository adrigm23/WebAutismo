import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { getAllCalendarEvents, getCalendarViewerContext } from "@/lib/calendar";
import { CalendarPage } from "@/components/platform/calendar/calendar-page";
import { DocenteShell } from "@/components/docente/docente-shell";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Calendario — Docente",
  robots: { index: false, follow: false },
};

export default async function DocenteCalendarioPage() {
  const user = await requireUser("/docente/calendario");

  if (user.globalRole !== "TEACHER" && user.globalRole !== "ADMIN") {
    redirect("/mis-cursos");
  }

  const viewerCtx = await getCalendarViewerContext({ userId: user.id, globalRole: user.globalRole });

  const [events, teacherCourses] = await Promise.all([
    getAllCalendarEvents(viewerCtx),
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
    <DocenteShell viewerName={viewerName} viewerInitials={getInitials(viewerName)}>
      <CalendarPage
        events={events}
        courses={courses}
        canManage={true}
      />
    </DocenteShell>
  );
}
