import { defaultCourseCategories } from "@/lib/course-community";

export function buildDemoForumSpaceHistory(courseSlug: string) {
  const now = new Date();

  return {
    activeSpace: {
      id: `demo-space-${courseSlug}`,
      courseSlug,
      editionNumber: 1,
      editionLabel: "Edición demo",
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      deletedAt: null,
      categoryCount: defaultCourseCategories.length,
      threadCount: 0,
    },
    archivedSpaces: [],
    deletedSpaces: [],
  };
}

export function buildDemoForumModerationDashboard(courseSlug: string) {
  const history = buildDemoForumSpaceHistory(courseSlug);

  return {
    activeSpace: history.activeSpace,
    stats: {
      threadCount: 4,
      pinnedCount: 1,
      closedCount: 1,
      resolvedCount: 2,
      reportCount: 1,
      scheduledCount: 1,
    },
    openReports: [
      {
        id: `demo-report-${courseSlug}`,
        reason: "Revisar tono del mensaje",
        createdAt: new Date("2026-05-08T08:30:00.000Z"),
        thread: {
          id: `demo-thread-${courseSlug}`,
          title: "Consulta sobre apoyos visuales en aula ordinaria",
          categorySlug: defaultCourseCategories[0]?.slug ?? "anuncios",
        },
        post: null,
      },
    ],
    scheduledAnnouncements: [
      {
        id: `demo-announcement-${courseSlug}`,
        title: "Recordatorio de sesion en directo",
        categorySlug: defaultCourseCategories[0]?.slug ?? "anuncios",
        scheduledFor: new Date("2026-05-10T09:00:00.000Z"),
      },
    ],
    recentActivity: [
      {
        id: `demo-activity-${courseSlug}-1`,
        action: "THREAD_CREATED" as const,
        actorRole: "TEACHER" as const,
        createdAt: new Date("2026-05-08T07:45:00.000Z"),
        summary: "Docente Demo publico un anuncio de seguimiento semanal.",
        linkPath: `/mis-cursos/${courseSlug}/foro`,
      },
      {
        id: `demo-activity-${courseSlug}-2`,
        action: "REPORT_CREATED" as const,
        actorRole: "STUDENT" as const,
        createdAt: new Date("2026-05-08T08:30:00.000Z"),
        summary:
          "Alumno Demo marco un mensaje para revision del equipo docente.",
        linkPath: `/mis-cursos/${courseSlug}/foro`,
      },
    ],
    deletedThreads: [],
    deletedPosts: [],
  };
}
