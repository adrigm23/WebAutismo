import { isStaffCourseRole, type CourseRole } from "@/lib/course-roles";

type ForumViewerRole = CourseRole | null | undefined;

type ForumThreadQueryInput = {
  q?: string;
  sort?: "recent" | "created" | "activity";
  status?: "open" | "closed" | "resolved";
  type?: "announcement" | "discussion";
  filter?: "unanswered";
};

function canViewUnpublishedAnnouncements(viewerRole: ForumViewerRole) {
  return Boolean(viewerRole && isStaffCourseRole(viewerRole));
}

export function normalizeScheduledFor(scheduledFor?: Date | null) {
  if (!scheduledFor) {
    return null;
  }

  return scheduledFor.getTime() > Date.now() ? scheduledFor : null;
}

export function buildVisibilityWhere(viewerRole: ForumViewerRole) {
  if (canViewUnpublishedAnnouncements(viewerRole)) {
    return {};
  }

  return {
    OR: [
      {
        type: "DISCUSSION" as const
      },
      {
        type: "ANNOUNCEMENT" as const,
        publishedAt: {
          not: null,
          lte: new Date()
        }
      }
    ]
  };
}

export function buildThreadWhere(
  categoryId: string,
  query?: ForumThreadQueryInput,
  viewerRole?: ForumViewerRole
) {
  const visibilityWhere = buildVisibilityWhere(viewerRole);
  const andClauses: Array<Record<string, unknown>> = [];

  if ("OR" in visibilityWhere) {
    andClauses.push(visibilityWhere);
  }

  if (query?.filter === "unanswered") {
    andClauses.push({
      posts: {
        none: {
          deletedAt: null
        }
      }
    });
  }

  if (query?.q) {
    andClauses.push({
      OR: [
        {
          title: {
            contains: query.q
          }
        },
        {
          body: {
            contains: query.q
          }
        },
        {
          author: {
            is: {
              name: {
                contains: query.q
              }
            }
          }
        }
      ]
    });
  }

  return {
    categoryId,
    deletedAt: null,
    ...(andClauses.length ? { AND: andClauses } : {}),
    ...(query?.status === "open" ? { isClosed: false } : {}),
    ...(query?.status === "closed" ? { isClosed: true } : {}),
    ...(query?.status === "resolved" ? { isResolved: true } : {}),
    ...(query?.type === "announcement" ? { type: "ANNOUNCEMENT" as const } : {}),
    ...(query?.type === "discussion" ? { type: "DISCUSSION" as const } : {})
  };
}

export function buildThreadOrderBy(sort: ForumThreadQueryInput["sort"]) {
  if (sort === "created") {
    return [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];
  }

  if (sort === "recent") {
    return [{ isPinned: "desc" as const }, { updatedAt: "desc" as const }];
  }

  return [{ isPinned: "desc" as const }, { lastActivityAt: "desc" as const }];
}
