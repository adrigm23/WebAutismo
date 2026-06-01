import type {
  CalendarEventStatus,
  CalendarEventType,
  CalendarEventVisibility,
  UserGlobalRole,
} from "@prisma/client";
import { getDb } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  status: CalendarEventStatus;
  startsAt: Date;
  endsAt: Date;
  courseId: string | null;
  courseTitle: string | null;
  courseSlug: string | null;
  meetingUrl: string | null;
  location: string | null;
  visibility: CalendarEventVisibility;
  createdById: string;
  createdByName: string;
  /** true = real CalendarEvent; false = derived from CourseResource.dueAt */
  isManaged: boolean;
};

export type CalendarViewerContext = {
  userId: string;
  globalRole: UserGlobalRole;
  enrolledCourseIds: string[];
  teachingCourseIds: string[];
};

// ─── Viewer context ───────────────────────────────────────────────────────────

export async function getCalendarViewerContext(input: {
  userId: string;
  globalRole: UserGlobalRole;
}): Promise<CalendarViewerContext> {
  if (input.globalRole === "ADMIN") {
    return { userId: input.userId, globalRole: input.globalRole, enrolledCourseIds: [], teachingCourseIds: [] };
  }

  const [enrollments, assignments] = await Promise.all([
    getDb().courseEnrollment.findMany({
      where: { userId: input.userId, status: "ACTIVE" },
      select: { courseId: true },
    }),
    input.globalRole === "TEACHER"
      ? getDb().courseTeacherAssignment.findMany({
          where: { userId: input.userId },
          select: { courseId: true },
        })
      : Promise.resolve([] as { courseId: string }[]),
  ]);

  return {
    userId: input.userId,
    globalRole: input.globalRole,
    enrolledCourseIds: enrollments.map((e) => e.courseId),
    teachingCourseIds: assignments.map((a) => a.courseId),
  };
}

// ─── Visibility filter ────────────────────────────────────────────────────────

function buildCalendarVisibilityFilter(ctx: CalendarViewerContext) {
  if (ctx.globalRole === "ADMIN") return {};

  const visibleCourseIds = ctx.globalRole === "TEACHER"
    ? [...new Set([...ctx.enrolledCourseIds, ...ctx.teachingCourseIds])]
    : ctx.enrolledCourseIds;

  if (ctx.globalRole === "TEACHER") {
    return {
      OR: [
        { visibility: "PUBLIC" as CalendarEventVisibility },
        { visibility: "COURSE" as CalendarEventVisibility, courseId: { in: visibleCourseIds } },
        { visibility: "TEACHERS_ONLY" as CalendarEventVisibility },
      ],
    };
  }

  // STUDENT
  return {
    OR: [
      { visibility: "PUBLIC" as CalendarEventVisibility },
      { visibility: "COURSE" as CalendarEventVisibility, courseId: { in: visibleCourseIds } },
    ],
  };
}

// ─── Event status resolver ────────────────────────────────────────────────────

function resolveEventStatus(
  dbStatus: CalendarEventStatus,
  startsAt: Date,
  endsAt: Date,
  now = new Date()
): CalendarEventStatus {
  if (dbStatus === "CANCELLED") return "CANCELLED";
  if (now >= startsAt && now <= endsAt) return "LIVE";
  if (now > endsAt) return "FINISHED";
  return "SCHEDULED";
}

// ─── Fetch events ─────────────────────────────────────────────────────────────

export type CalendarFilters = {
  /** ISO date strings for window */
  from?: Date;
  to?: Date;
  types?: CalendarEventType[];
  courseId?: string;
  statuses?: CalendarEventStatus[];
};

export async function getCalendarEvents(
  filters: CalendarFilters,
  ctx: CalendarViewerContext
): Promise<CalendarEventItem[]> {
  const visFilter = buildCalendarVisibilityFilter(ctx);
  const now = new Date();

  const where: Record<string, unknown> = { ...visFilter };

  if (filters.from || filters.to) {
    where.startsAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  if (filters.types?.length) where.type = { in: filters.types };
  if (filters.courseId) where.courseId = filters.courseId;

  const events = await getDb().calendarEvent.findMany({
    where,
    include: {
      course: { select: { id: true, title: true, slug: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const mapped: CalendarEventItem[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    status: resolveEventStatus(e.status, e.startsAt, e.endsAt, now),
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    courseId: e.courseId,
    courseTitle: e.course?.title ?? null,
    courseSlug: e.course?.slug ?? null,
    meetingUrl: e.meetingUrl,
    location: e.location,
    visibility: e.visibility,
    createdById: e.createdById,
    createdByName: e.createdBy.name,
    isManaged: true,
  }));

  // Filter by computed status if requested
  if (filters.statuses?.length) {
    return mapped.filter((e) => filters.statuses!.includes(e.status));
  }
  return mapped;
}

/** Derive ASSIGNMENT_DEADLINE pseudo-events from CourseResource.dueAt */
export async function getDerivedDeadlineEvents(
  ctx: CalendarViewerContext,
  window: { from: Date; to: Date }
): Promise<CalendarEventItem[]> {
  const visibleCourseIds =
    ctx.globalRole === "ADMIN"
      ? undefined
      : ctx.globalRole === "TEACHER"
        ? [...new Set([...ctx.enrolledCourseIds, ...ctx.teachingCourseIds])]
        : ctx.enrolledCourseIds;

  const resources = await getDb().courseResource.findMany({
    where: {
      type: "EXERCISE",
      isPublished: true,
      dueAt: { gte: window.from, lte: window.to, not: null },
      ...(visibleCourseIds !== undefined ? { courseId: { in: visibleCourseIds } } : {}),
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      createdBy: { select: { name: true } },
    },
  });

  return resources.map((r) => {
    const due = r.dueAt!;
    return {
      id: `deadline-${r.id}`,
      title: r.title,
      description: r.description ?? null,
      type: "ASSIGNMENT_DEADLINE" as CalendarEventType,
      status: due < new Date() ? ("EXPIRED" as CalendarEventStatus) : ("SCHEDULED" as CalendarEventStatus),
      startsAt: due,
      endsAt: due,
      courseId: r.courseId,
      courseTitle: r.course?.title ?? null,
      courseSlug: r.course?.slug ?? null,
      meetingUrl: null,
      location: null,
      visibility: "COURSE" as CalendarEventVisibility,
      createdById: r.createdById,
      createdByName: r.createdBy.name,
      isManaged: false,
    };
  });
}

/** Get all events + derived deadlines for a date window */
export async function getAllCalendarEvents(
  ctx: CalendarViewerContext,
  window?: { from: Date; to: Date }
): Promise<CalendarEventItem[]> {
  // Default: load 2 months back + 3 months forward
  const from = window?.from ?? new Date(new Date().setMonth(new Date().getMonth() - 2));
  const to = window?.to ?? new Date(new Date().setMonth(new Date().getMonth() + 3));

  const [managed, deadlines] = await Promise.all([
    getCalendarEvents({ from, to }, ctx),
    getDerivedDeadlineEvents(ctx, { from, to }),
  ]);

  // Merge, deduplicating by id
  const seen = new Set<string>();
  const all: CalendarEventItem[] = [];
  for (const e of [...managed, ...deadlines]) {
    if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
  }
  return all.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

// ─── Get event by id ──────────────────────────────────────────────────────────

export async function getCalendarEventById(id: string) {
  return getDb().calendarEvent.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      createdBy: { select: { name: true } },
    },
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createCalendarEvent(input: {
  title: string;
  description?: string | null;
  type: CalendarEventType;
  startsAt: Date;
  endsAt: Date;
  courseId?: string | null;
  meetingUrl?: string | null;
  location?: string | null;
  visibility: CalendarEventVisibility;
  createdById: string;
}) {
  return getDb().calendarEvent.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      courseId: input.courseId ?? null,
      meetingUrl: input.meetingUrl?.trim() || null,
      location: input.location?.trim() || null,
      visibility: input.visibility,
      createdById: input.createdById,
    },
  });
}

export async function updateCalendarEvent(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    type?: CalendarEventType;
    startsAt?: Date;
    endsAt?: Date;
    courseId?: string | null;
    meetingUrl?: string | null;
    location?: string | null;
    visibility?: CalendarEventVisibility;
  }
) {
  return getDb().calendarEvent.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
      ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
      ...(input.courseId !== undefined && { courseId: input.courseId ?? null }),
      ...(input.meetingUrl !== undefined && { meetingUrl: input.meetingUrl?.trim() || null }),
      ...(input.location !== undefined && { location: input.location?.trim() || null }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
    },
  });
}

export async function cancelCalendarEvent(id: string) {
  return getDb().calendarEvent.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}
