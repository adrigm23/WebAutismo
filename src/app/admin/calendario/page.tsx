import type { Metadata } from "next";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getDb } from "@/lib/prisma";
import { getAllCalendarEvents, getCalendarViewerContext } from "@/lib/calendar";
import { CalendarPageClient } from "@/components/platform/calendar/calendar-page-client";

export const metadata: Metadata = {
  title: "Calendario — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCalendarioPage() {
  const user = await requireAdminConsoleUser("/admin/calendario");

  const viewerCtx = await getCalendarViewerContext({ userId: user.id, globalRole: user.globalRole });

  const [events, allCourses] = await Promise.all([
    getAllCalendarEvents(viewerCtx),
    getDb().course.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const courses = allCourses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
  }));

  return (
    <CalendarPageClient
      events={events}
      courses={courses}
      canManage={true}
    />
  );
}
