import { unlink } from "fs/promises";
import path from "path";
import type { ForumAuditAction, ForumNotificationType } from "@prisma/client";
import {
  createDefaultForumCategoriesForSpace,
  defaultCourseCategories,
  ensureActiveForumSpace,
  ensureCourseCommunity,
  getArchivedForumSpaces,
  getDeletedForumSpaces
} from "@/lib/course-community";
import { sendForumNotification } from "@/lib/notifications";
import { isStaffCourseRole, type CourseRole } from "@/lib/course-roles";
import { getDb } from "@/lib/prisma";
import { isDemoUserId } from "@/lib/demo-auth";

type ForumViewerRole = CourseRole | null | undefined;

export type ForumCategorySummary = {
  id: string;
  forumSpaceId: string | null;
  slug: string;
  title: string;
  description: string;
  _count: {
    threads: number;
  };
};

export type ForumThreadListItem = {
  id: string;
  title: string;
  body: string;
  type: "DISCUSSION" | "ANNOUNCEMENT";
  isPinned: boolean;
  isClosed: boolean;
  isResolved: boolean;
  isReadOnly: boolean;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  editedAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  authorRole: CourseRole;
  author: {
    id: string;
    name: string;
  };
  _count: {
    posts: number;
  };
};

export type ForumAttachmentItem = {
  id: string;
  kind: "FILE" | "IMAGE" | "LINK" | "VIDEO";
  label: string;
  url: string;
  mimeType: string | null;
  sizeInBytes: number | null;
};

export type ForumThreadPostItem = {
  id: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  attachments: ForumAttachmentItem[];
  authorRole: CourseRole;
  author: {
    id: string;
    name: string;
  };
};

export type ForumThreadDetail = {
  id: string;
  title: string;
  body: string;
  type: "DISCUSSION" | "ANNOUNCEMENT";
  isPinned: boolean;
  isClosed: boolean;
  isResolved: boolean;
  isReadOnly: boolean;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  editedAt: Date | null;
  resolvedPostId: string | null;
  createdAt: Date;
  attachments: ForumAttachmentItem[];
  authorRole: CourseRole;
  author: {
    id: string;
    name: string;
  };
  posts: ForumThreadPostItem[];
};

export type ForumThreadQuery = {
  q?: string;
  sort?: "recent" | "created" | "activity";
  status?: "open" | "closed" | "resolved";
  type?: "announcement" | "discussion";
  filter?: "unanswered";
};

export type ForumModerationReportItem = {
  id: string;
  reason: string;
  createdAt: Date;
  reportedById?: string;
  thread: {
    id: string;
    title: string;
    categorySlug: string;
  } | null;
  post: {
    id: string;
    threadId: string;
    threadTitle: string;
    categorySlug: string;
  } | null;
};

export type ForumScheduledAnnouncementItem = {
  id: string;
  title: string;
  categorySlug: string;
  scheduledFor: Date;
};

export type ForumDeletedThreadItem = {
  id: string;
  title: string;
  categorySlug: string;
  deletedAt: Date;
};

export type ForumDeletedPostItem = {
  id: string;
  threadId: string;
  threadTitle: string;
  categorySlug: string;
  deletedAt: Date;
};

export type ForumAuditActivityItem = {
  id: string;
  action: ForumAuditAction;
  actorRole: CourseRole;
  createdAt: Date;
  summary: string;
  linkPath: string | null;
};

export type ForumNotificationListItem = {
  id: string;
  courseSlug: string;
  type: ForumNotificationType;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
};

const FORUM_SELF_EDIT_WINDOW_MS = 15 * 60 * 1000;

function buildDemoForumSpaceHistory(courseSlug: string) {
  const now = new Date();

  return {
    activeSpace: {
      id: `demo-space-${courseSlug}`,
      courseSlug,
      editionNumber: 1,
      editionLabel: "Edicion demo",
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      deletedAt: null,
      categoryCount: defaultCourseCategories.length,
      threadCount: 0
    },
    archivedSpaces: [],
    deletedSpaces: []
  };
}

function buildDemoForumModerationDashboard(courseSlug: string) {
  const history = buildDemoForumSpaceHistory(courseSlug);

  return {
    activeSpace: history.activeSpace,
    stats: {
      threadCount: 4,
      pinnedCount: 1,
      closedCount: 1,
      resolvedCount: 2,
      reportCount: 1,
      scheduledCount: 1
    },
    openReports: [
      {
        id: `demo-report-${courseSlug}`,
        reason: "Revisar tono del mensaje",
        createdAt: new Date("2026-05-08T08:30:00.000Z"),
        thread: {
          id: `demo-thread-${courseSlug}`,
          title: "Consulta sobre apoyos visuales en aula ordinaria",
          categorySlug: defaultCourseCategories[0]?.slug ?? "anuncios"
        },
        post: null
      }
    ] satisfies ForumModerationReportItem[],
    scheduledAnnouncements: [
      {
        id: `demo-announcement-${courseSlug}`,
        title: "Recordatorio de sesion en directo",
        categorySlug: defaultCourseCategories[0]?.slug ?? "anuncios",
        scheduledFor: new Date("2026-05-10T09:00:00.000Z")
      }
    ] satisfies ForumScheduledAnnouncementItem[],
    recentActivity: [
      {
        id: `demo-activity-${courseSlug}-1`,
        action: "THREAD_CREATED",
        actorRole: "TEACHER",
        createdAt: new Date("2026-05-08T07:45:00.000Z"),
        summary: "Docente Demo publico un anuncio de seguimiento semanal.",
        linkPath: `/mis-cursos/${courseSlug}/foro`
      },
      {
        id: `demo-activity-${courseSlug}-2`,
        action: "REPORT_CREATED",
        actorRole: "STUDENT",
        createdAt: new Date("2026-05-08T08:30:00.000Z"),
        summary: "Alumno Demo marco un mensaje para revision del equipo docente.",
        linkPath: `/mis-cursos/${courseSlug}/foro`
      }
    ] satisfies ForumAuditActivityItem[],
    deletedThreads: [] satisfies ForumDeletedThreadItem[],
    deletedPosts: [] satisfies ForumDeletedPostItem[]
  };
}

export function canEditForumContent(input: {
  currentUserId: string;
  authorId: string;
  role: CourseRole;
  createdAt: Date;
}) {
  if (isStaffCourseRole(input.role)) {
    return true;
  }

  return (
    input.currentUserId === input.authorId &&
    Date.now() - input.createdAt.getTime() <= FORUM_SELF_EDIT_WINDOW_MS
  );
}

type ThreadContext = {
  threadId: string;
  threadTitle: string;
  threadType: "DISCUSSION" | "ANNOUNCEMENT";
  categorySlug: string;
  categoryTitle: string;
  courseSlug: string;
  forumSpaceId: string | null;
  threadAuthorId: string;
  threadAuthorName: string;
};

type PostContext = ThreadContext & {
  postId: string;
  postAuthorId: string;
  postAuthorName: string;
};

function canViewUnpublishedAnnouncements(viewerRole: ForumViewerRole) {
  return Boolean(viewerRole && isStaffCourseRole(viewerRole));
}

function normalizeScheduledFor(scheduledFor?: Date | null) {
  if (!scheduledFor) {
    return null;
  }

  return scheduledFor.getTime() > Date.now() ? scheduledFor : null;
}

function buildVisibilityWhere(viewerRole: ForumViewerRole) {
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

function buildThreadWhere(
  categoryId: string,
  query?: ForumThreadQuery,
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

function buildThreadOrderBy(sort: ForumThreadQuery["sort"]) {
  if (sort === "created") {
    return [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];
  }

  if (sort === "recent") {
    return [{ isPinned: "desc" as const }, { updatedAt: "desc" as const }];
  }

  return [{ isPinned: "desc" as const }, { lastActivityAt: "desc" as const }];
}

function safeParseMetadata(metadataJson: string | null) {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getAuditSummary(action: ForumAuditAction, metadataJson: string | null) {
  const metadata = safeParseMetadata(metadataJson);
  const threadTitle =
    typeof metadata?.threadTitle === "string" ? metadata.threadTitle : "contenido del foro";

  switch (action) {
    case "THREAD_CREATED":
      return `Hilo creado: ${threadTitle}`;
    case "THREAD_PINNED":
      return `Hilo fijado: ${threadTitle}`;
    case "THREAD_UNPINNED":
      return `Hilo desfijado: ${threadTitle}`;
    case "THREAD_CLOSED":
      return `Hilo cerrado: ${threadTitle}`;
    case "THREAD_REOPENED":
      return `Hilo reabierto: ${threadTitle}`;
    case "THREAD_DELETED":
      return `Hilo eliminado: ${threadTitle}`;
    case "POST_CREATED":
      return `Nueva respuesta en ${threadTitle}`;
    case "POST_DELETED":
      return `Respuesta eliminada en ${threadTitle}`;
    case "POST_MARKED_RESOLVED":
      return `Respuesta marcada como resuelta en ${threadTitle}`;
    case "POST_UNMARKED_RESOLVED":
      return `Marca de resuelta retirada en ${threadTitle}`;
    case "REPORT_CREATED":
      return `Reporte abierto en ${threadTitle}`;
    case "REPORT_REVIEWED":
      return typeof metadata?.reportStatus === "string" && metadata.reportStatus === "ACTION_TAKEN"
        ? `Reporte resuelto con acción en ${threadTitle}`
        : `Reporte revisado en ${threadTitle}`;
    case "REPORT_DISMISSED":
      return `Reporte descartado en ${threadTitle}`;
    case "THREAD_UPDATED":
      return `Hilo actualizado: ${threadTitle}`;
    default:
      return threadTitle;
  }
}

function buildAuditLinkPath(courseSlug: string, metadataJson: string | null, threadId?: string | null) {
  const metadata = safeParseMetadata(metadataJson);
  const categorySlug = typeof metadata?.categorySlug === "string" ? metadata.categorySlug : null;

  if (threadId && categorySlug) {
    return `/mis-cursos/${courseSlug}/foro/${categorySlug}/${threadId}`;
  }

  if (categorySlug) {
    return `/mis-cursos/${courseSlug}/foro/${categorySlug}`;
  }

  return `/mis-cursos/${courseSlug}/foro`;
}

async function writeForumAuditLog(input: {
  courseSlug: string;
  forumSpaceId?: string | null;
  threadId?: string | null;
  postId?: string | null;
  actorId: string;
  actorRole: CourseRole;
  action: ForumAuditAction;
  metadata?: Record<string, unknown>;
}) {
  await getDb().forumAuditLog.create({
    data: {
      courseSlug: input.courseSlug,
      forumSpaceId: input.forumSpaceId ?? null,
      threadId: input.threadId ?? null,
      postId: input.postId ?? null,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
    }
  });
}

async function createForumNotifications(
  notifications: Array<{
    userId: string;
    courseSlug: string;
    type: ForumNotificationType;
    title: string;
    body: string;
    linkPath: string;
  }>
) {
  if (!notifications.length) {
    return;
  }

  await Promise.all(notifications.map((notification) => sendForumNotification(notification)));
}

async function getThreadContext(threadId: string) {
  return (await getDb().forumThread.findUnique({
    where: {
      id: threadId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true
        }
      },
      category: {
        select: {
          slug: true,
          title: true,
          courseSlug: true,
          forumSpaceId: true
        }
      }
    }
  })) as
    | {
        id: string;
        title: string;
        type: "DISCUSSION" | "ANNOUNCEMENT";
        author: {
          id: string;
          name: string;
        };
        category: {
          slug: string;
          title: string;
          courseSlug: string;
          forumSpaceId: string | null;
        };
      }
    | null;
}

async function getPostContext(postId: string) {
  return (await getDb().forumPost.findUnique({
    where: {
      id: postId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true
        }
      },
      thread: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              slug: true,
              title: true,
              courseSlug: true,
              forumSpaceId: true
            }
          }
        }
      }
    }
  })) as
    | {
        id: string;
        author: {
          id: string;
          name: string;
        };
        thread: {
          id: string;
          title: string;
          type: "DISCUSSION" | "ANNOUNCEMENT";
          author: {
            id: string;
            name: string;
          };
          category: {
            slug: string;
            title: string;
            courseSlug: string;
            forumSpaceId: string | null;
          };
        };
      }
    | null;
}

async function getReportContext(reportId: string) {
  return (await getDb().forumReport.findUnique({
    where: {
      id: reportId
    },
    include: {
      thread: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              slug: true,
              title: true,
              courseSlug: true,
              forumSpaceId: true
            }
          }
        }
      },
      post: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          thread: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true
                }
              },
              category: {
                select: {
                  slug: true,
                  title: true,
                  courseSlug: true,
                  forumSpaceId: true
                }
              }
            }
          }
        }
      }
    }
  })) as
    | {
        id: string;
        reason: string;
        reportedById: string;
        thread: {
          id: string;
          title: string;
          author: {
            id: string;
            name: string;
          };
          category: {
            slug: string;
            title: string;
            courseSlug: string;
            forumSpaceId: string | null;
          };
        } | null;
        post:
          | {
              id: string;
              author: {
                id: string;
                name: string;
              };
              thread: {
                id: string;
                title: string;
                author: {
                  id: string;
                  name: string;
                };
                category: {
                  slug: string;
                  title: string;
                  courseSlug: string;
                  forumSpaceId: string | null;
                };
              };
            }
          | null;
      }
    | null;
}

async function getAttachmentContext(attachmentId: string) {
  return (await getDb().forumAttachment.findUnique({
    where: {
      id: attachmentId
    },
    include: {
      thread: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              slug: true,
              title: true,
              courseSlug: true,
              forumSpaceId: true
            }
          }
        }
      },
      post: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          thread: {
            include: {
              category: {
                select: {
                  slug: true,
                  title: true,
                  courseSlug: true,
                  forumSpaceId: true
                }
              }
            }
          }
        }
      }
    }
  })) as
    | {
        id: string;
        label: string;
        url: string;
        storageKey: string | null;
        thread:
          | {
              id: string;
              title: string;
              createdAt: Date;
              deletedAt: Date | null;
              author: {
                id: string;
                name: string;
              };
              category: {
                slug: string;
                title: string;
                courseSlug: string;
                forumSpaceId: string | null;
              };
            }
          | null;
        post:
          | {
              id: string;
              createdAt: Date;
              deletedAt: Date | null;
              author: {
                id: string;
                name: string;
              };
              thread: {
                id: string;
                title: string;
                category: {
                  slug: string;
                  title: string;
                  courseSlug: string;
                  forumSpaceId: string | null;
                };
              };
            }
          | null;
      }
    | null;
}

function toThreadContext(record: NonNullable<Awaited<ReturnType<typeof getThreadContext>>>): ThreadContext {
  return {
    threadId: record.id,
    threadTitle: record.title,
    threadType: record.type,
    categorySlug: record.category.slug,
    categoryTitle: record.category.title,
    courseSlug: record.category.courseSlug,
    forumSpaceId: record.category.forumSpaceId,
    threadAuthorId: record.author.id,
    threadAuthorName: record.author.name
  };
}

function toPostContext(record: NonNullable<Awaited<ReturnType<typeof getPostContext>>>): PostContext {
  return {
    threadId: record.thread.id,
    threadTitle: record.thread.title,
    threadType: record.thread.type,
    categorySlug: record.thread.category.slug,
    categoryTitle: record.thread.category.title,
    courseSlug: record.thread.category.courseSlug,
    forumSpaceId: record.thread.category.forumSpaceId,
    threadAuthorId: record.thread.author.id,
    threadAuthorName: record.thread.author.name,
    postId: record.id,
    postAuthorId: record.author.id,
    postAuthorName: record.author.name
  };
}

async function notifyAnnouncementRecipients(input: {
  courseSlug: string;
  categorySlug: string;
  categoryTitle: string;
  threadId: string;
  threadTitle: string;
  actorId: string;
  actorName: string;
}) {
  const course = await getDb().course.findUnique({
    where: {
      slug: input.courseSlug
    },
    select: {
      id: true
    }
  });

  if (!course) {
    return;
  }

  const [enrollments, courseAssignments, admins] = await Promise.all([
    getDb().courseEnrollment.findMany({
      where: {
        courseId: course.id
      },
      select: {
        userId: true
      }
    }),
    getDb().courseTeacherAssignment.findMany({
      where: {
        courseId: course.id
      },
      select: {
        userId: true
      }
    }),
    getDb().user.findMany({
      where: {
        globalRole: "ADMIN",
        isActive: true
      },
      select: {
        id: true
      }
    })
  ]);

  const recipientIds = Array.from(
    new Set(
      [...enrollments.map((membership) => membership.userId), ...courseAssignments.map((membership) => membership.userId), ...admins.map((admin) => admin.id)].filter(
        (userId) => userId !== input.actorId
      )
    )
  );

  await createForumNotifications(
    recipientIds.map((userId) => ({
      userId,
      courseSlug: input.courseSlug,
      type: "TEACHER_ANNOUNCEMENT",
      title: `Nuevo anuncio en ${input.categoryTitle}`,
      body: `${input.actorName} ha publicado "${input.threadTitle}".`,
      linkPath: `/mis-cursos/${input.courseSlug}/foro/${input.categorySlug}/${input.threadId}`
    }))
  );
}

async function notifyReplyRecipients(input: {
  threadId: string;
  actorId: string;
  actorName: string;
}) {
  const thread = (await getDb().forumThread.findUnique({
    where: {
      id: input.threadId
    },
    include: {
      author: {
        select: {
          id: true
        }
      },
      category: {
        select: {
          slug: true,
          title: true,
          courseSlug: true
        }
      },
      posts: {
        select: {
          authorId: true
        }
      }
    }
  })) as
    | {
        id: string;
        title: string;
        author: {
          id: string;
        };
        category: {
          slug: string;
          title: string;
          courseSlug: string;
        };
        posts: Array<{
          authorId: string;
        }>;
      }
    | null;

  if (!thread) {
    return;
  }

  const recipientIds = Array.from(
    new Set(
      [thread.author.id, ...thread.posts.map((post) => post.authorId)].filter(
        (userId) => userId && userId !== input.actorId
      )
    )
  );

  await createForumNotifications(
    recipientIds.map((userId) => ({
      userId,
      courseSlug: thread.category.courseSlug,
      type: "THREAD_REPLY",
      title: `Nueva respuesta en "${thread.title}"`,
      body: `${input.actorName} ha respondido en ${thread.category.title}.`,
      linkPath: `/mis-cursos/${thread.category.courseSlug}/foro/${thread.category.slug}/${thread.id}`
    }))
  );
}

async function notifyModerationRecipient(input: {
  userId: string;
  courseSlug: string;
  categorySlug: string;
  threadId: string;
  title: string;
  body: string;
}) {
  await createForumNotifications([
    {
      userId: input.userId,
      courseSlug: input.courseSlug,
      type: "MODERATION_ACTION",
      title: input.title,
      body: input.body,
      linkPath: `/mis-cursos/${input.courseSlug}/foro/${input.categorySlug}/${input.threadId}`
    }
  ]);
}

async function publishDueAnnouncementsForCourse(courseSlug: string) {
  const activeSpace = await ensureCourseCommunity(courseSlug);
  const dueAnnouncements = (await getDb().forumThread.findMany({
    where: {
      category: {
        is: {
          forumSpaceId: activeSpace.id
        }
      },
      type: "ANNOUNCEMENT",
      scheduledFor: {
        lte: new Date()
      },
      publishedAt: null,
      deletedAt: null
    },
    include: {
      author: {
        select: {
          id: true,
          name: true
        }
      },
      category: {
        select: {
          slug: true,
          title: true
        }
      }
    }
  })) as Array<{
    id: string;
    title: string;
    authorRole: CourseRole;
    author: {
      id: string;
      name: string;
    };
    category: {
      slug: string;
      title: string;
    };
  }>;

  for (const thread of dueAnnouncements) {
    const updateResult = (await getDb().forumThread.updateMany({
      where: {
        id: thread.id,
        publishedAt: null
      },
      data: {
        publishedAt: new Date(),
        lastActivityAt: new Date()
      }
    })) as { count: number };

    if (updateResult.count === 0) {
      continue;
    }

    await writeForumAuditLog({
      courseSlug,
      forumSpaceId: activeSpace.id,
      threadId: thread.id,
      actorId: thread.author.id,
      actorRole: thread.authorRole,
      action: "THREAD_UPDATED",
      metadata: {
        categorySlug: thread.category.slug,
        threadTitle: thread.title,
        reason: "scheduled_publish"
      }
    });

    await notifyAnnouncementRecipients({
      courseSlug,
      categorySlug: thread.category.slug,
      categoryTitle: thread.category.title,
      threadId: thread.id,
      threadTitle: thread.title,
      actorId: thread.author.id,
      actorName: thread.author.name
    });
  }
}

export async function getForumCategories(
  courseSlug: string,
  viewerRole?: ForumViewerRole
): Promise<ForumCategorySummary[]> {
  try {
    await publishDueAnnouncementsForCourse(courseSlug);
    const activeSpace = await ensureCourseCommunity(courseSlug);

    const categories = (await getDb().forumCategory.findMany({
      where: {
        forumSpaceId: activeSpace.id
      },
      orderBy: {
        sortOrder: "asc"
      }
    })) as Array<{
      id: string;
      forumSpaceId: string | null;
      slug: string;
      title: string;
      description: string;
    }>;

    const visibleCounts = await Promise.all(
      categories.map((category) =>
        getDb().forumThread.count({
          where: buildThreadWhere(category.id, undefined, viewerRole)
        })
      )
    );

    return categories.map((category, index) => ({
      ...category,
      _count: {
        threads: visibleCounts[index]
      }
    })) as ForumCategorySummary[];
  } catch {
    return defaultCourseCategories.map((category) => ({
      id: `demo-${courseSlug}-${category.slug}`,
      forumSpaceId: null,
      slug: category.slug,
      title: category.title,
      description: category.description,
      _count: {
        threads: 0
      }
    }));
  }
}

export async function getForumCategory(courseSlug: string, categorySlug: string) {
  try {
    const activeSpace = await ensureCourseCommunity(courseSlug);

    return getDb().forumCategory.findFirst({
      where: {
        forumSpaceId: activeSpace.id,
        slug: categorySlug
      }
    });
  } catch {
    const fallback = defaultCourseCategories.find((category) => category.slug === categorySlug);

    if (!fallback) {
      return null;
    }

    return {
      id: `demo-${courseSlug}-${fallback.slug}`,
      courseSlug,
      forumSpaceId: null,
      slug: fallback.slug,
      title: fallback.title,
      description: fallback.description,
      sortOrder: fallback.sortOrder
    };
  }
}

export async function getForumThreads(
  courseSlug: string,
  categorySlug: string,
  query?: ForumThreadQuery,
  viewerRole?: ForumViewerRole
) {
  try {
    await publishDueAnnouncementsForCourse(courseSlug);
    const category = await getForumCategory(courseSlug, categorySlug);

    if (!category) {
      return null;
    }

    const threads = (await getDb().forumThread.findMany({
      where: buildThreadWhere(category.id, query, viewerRole),
      orderBy: buildThreadOrderBy(query?.sort),
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })) as ForumThreadListItem[];

    return {
      category,
      threads
    };
  } catch {
    const fallback = defaultCourseCategories.find((category) => category.slug === categorySlug);

    if (!fallback) {
      return null;
    }

    return {
      category: {
        id: `demo-${courseSlug}-${fallback.slug}`,
        courseSlug,
        forumSpaceId: null,
        slug: fallback.slug,
        title: fallback.title,
        description: fallback.description,
        sortOrder: fallback.sortOrder
      },
      threads: []
    };
  }
}

export async function getForumThreadById(input: {
  courseSlug: string;
  categorySlug: string;
  threadId: string;
  viewerRole?: ForumViewerRole;
}) {
  try {
    await publishDueAnnouncementsForCourse(input.courseSlug);
    const category = await getForumCategory(input.courseSlug, input.categorySlug);

    if (!category) {
      return null;
    }

    const thread = (await getDb().forumThread.findFirst({
      where: {
        id: input.threadId,
        categoryId: category.id,
        deletedAt: null,
        ...buildVisibilityWhere(input.viewerRole)
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        attachments: {
          select: {
            id: true,
            kind: true,
            label: true,
            url: true,
            mimeType: true,
            sizeInBytes: true
          }
        },
        posts: {
          orderBy: {
            createdAt: "asc"
          },
          include: {
            attachments: {
              select: {
                id: true,
                kind: true,
                label: true,
                url: true,
                mimeType: true,
                sizeInBytes: true
              }
            },
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })) as ForumThreadDetail | null;

    if (!thread) {
      return null;
    }

    return {
      category,
      thread
    };
  } catch {
    return null;
  }
}

export async function getForumSpaceHistory(courseSlug: string) {
  try {
    await publishDueAnnouncementsForCourse(courseSlug);
    const activeSpace = await ensureActiveForumSpace(courseSlug);
    const [archivedSpaces, deletedSpaces] = await Promise.all([
      getArchivedForumSpaces(courseSlug),
      getDeletedForumSpaces(courseSlug)
    ]);

    const [activeCategories, activeThreads] = await Promise.all([
      getDb().forumCategory.count({
        where: {
          forumSpaceId: activeSpace.id
        }
      }),
      getDb().forumThread.count({
        where: {
          category: {
            is: {
              forumSpaceId: activeSpace.id
            }
          },
          deletedAt: null
        }
      })
    ]);

    const archivedSummaries = await Promise.all(
      archivedSpaces.map(async (space) => {
        const [categoryCount, threadCount] = await Promise.all([
          getDb().forumCategory.count({
            where: {
              forumSpaceId: space.id
            }
          }),
          getDb().forumThread.count({
            where: {
              category: {
                is: {
                  forumSpaceId: space.id
                }
              },
              deletedAt: null
            }
          })
        ]);

        return {
          ...space,
          categoryCount,
          threadCount
        };
      })
    );

    return {
      activeSpace: {
        ...activeSpace,
        categoryCount: activeCategories,
        threadCount: activeThreads
      },
      archivedSpaces: archivedSummaries,
      deletedSpaces
    };
  } catch {
    return buildDemoForumSpaceHistory(courseSlug);
  }
}

export async function getForumModerationDashboard(courseSlug: string) {
  try {
    await publishDueAnnouncementsForCourse(courseSlug);
    const activeSpace = await ensureActiveForumSpace(courseSlug);

    const [threadCount, pinnedCount, closedCount, resolvedCount, reportCount, scheduledCount] =
      await Promise.all([
        getDb().forumThread.count({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            deletedAt: null
          }
        }),
        getDb().forumThread.count({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            isPinned: true,
            deletedAt: null
          }
        }),
        getDb().forumThread.count({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            isClosed: true,
            deletedAt: null
          }
        }),
        getDb().forumThread.count({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            isResolved: true,
            deletedAt: null
          }
        }),
        getDb().forumReport.count({
          where: {
            status: "OPEN",
            OR: [
              {
                thread: {
                  is: {
                    category: {
                      is: {
                        forumSpaceId: activeSpace.id
                      }
                    }
                  }
                }
              },
              {
                post: {
                  is: {
                    thread: {
                      is: {
                        category: {
                          is: {
                            forumSpaceId: activeSpace.id
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        }),
        getDb().forumThread.count({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            type: "ANNOUNCEMENT",
            scheduledFor: {
              not: null
            },
            publishedAt: null,
            deletedAt: null
          }
        })
      ]);

    const [openReports, scheduledAnnouncements, recentAuditLogs, deletedThreads, deletedPosts] =
      await Promise.all([
        getDb().forumReport.findMany({
          where: {
            status: "OPEN",
            OR: [
              {
                thread: {
                  is: {
                    category: {
                      is: {
                        forumSpaceId: activeSpace.id
                      }
                    }
                  }
                }
              },
              {
                post: {
                  is: {
                    thread: {
                      is: {
                        category: {
                          is: {
                            forumSpaceId: activeSpace.id
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 6,
          include: {
            thread: {
              include: {
                category: {
                  select: {
                    slug: true
                  }
                }
              }
            },
            post: {
              include: {
                thread: {
                  include: {
                    category: {
                      select: {
                        slug: true
                      }
                    }
                  }
                }
              }
            }
          }
        }) as Promise<
          Array<{
            id: string;
            reason: string;
            createdAt: Date;
            thread: { id: string; title: string; category: { slug: string } } | null;
            post:
              | {
                  id: string;
                  thread: {
                    id: string;
                    title: string;
                    category: { slug: string };
                  };
                }
              | null;
          }>
        >,
        getDb().forumThread.findMany({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            type: "ANNOUNCEMENT",
            scheduledFor: {
              not: null
            },
            publishedAt: null,
            deletedAt: null
          },
          orderBy: {
            scheduledFor: "asc"
          },
          take: 6,
          include: {
            category: {
              select: {
                slug: true
              }
            }
          }
        }) as Promise<
          Array<{
            id: string;
            title: string;
            scheduledFor: Date;
            category: {
              slug: string;
            };
          }>
        >,
        getDb().forumAuditLog.findMany({
          where: {
            forumSpaceId: activeSpace.id
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 8
        }) as Promise<
          Array<{
            id: string;
            action: ForumAuditAction;
            actorRole: CourseRole;
            threadId: string | null;
            metadataJson: string | null;
            createdAt: Date;
          }>
        >,
        getDb().forumThread.findMany({
          where: {
            category: {
              is: {
                forumSpaceId: activeSpace.id
              }
            },
            deletedAt: {
              not: null
            }
          },
          orderBy: {
            deletedAt: "desc"
          },
          take: 6,
          include: {
            category: {
              select: {
                slug: true
              }
            }
          }
        }) as Promise<
          Array<{
            id: string;
            title: string;
            deletedAt: Date;
            category: {
              slug: string;
            };
          }>
        >,
        getDb().forumPost.findMany({
          where: {
            deletedAt: {
              not: null
            },
            thread: {
              is: {
                deletedAt: null,
                category: {
                  is: {
                    forumSpaceId: activeSpace.id
                  }
                }
              }
            }
          },
          orderBy: {
            deletedAt: "desc"
          },
          take: 6,
          include: {
            thread: {
              include: {
                category: {
                  select: {
                    slug: true
                  }
                }
              }
            }
          }
        }) as Promise<
          Array<{
            id: string;
            deletedAt: Date;
            thread: {
              id: string;
              title: string;
              category: {
                slug: string;
              };
            };
          }>
        >
      ]);

    return {
      activeSpace,
      stats: {
        threadCount,
        pinnedCount,
        closedCount,
        resolvedCount,
        reportCount,
        scheduledCount
      },
      openReports: openReports.map((report) => ({
        id: report.id,
        reason: report.reason,
        createdAt: report.createdAt,
        thread: report.thread
          ? {
              id: report.thread.id,
              title: report.thread.title,
              categorySlug: report.thread.category.slug
            }
          : null,
        post: report.post
          ? {
              id: report.post.id,
              threadId: report.post.thread.id,
              threadTitle: report.post.thread.title,
              categorySlug: report.post.thread.category.slug
            }
          : null
      })) as ForumModerationReportItem[],
      scheduledAnnouncements: scheduledAnnouncements.map((thread) => ({
        id: thread.id,
        title: thread.title,
        categorySlug: thread.category.slug,
        scheduledFor: thread.scheduledFor
      })) as ForumScheduledAnnouncementItem[],
      recentActivity: recentAuditLogs.map((entry) => ({
        id: entry.id,
        action: entry.action,
        actorRole: entry.actorRole,
        createdAt: entry.createdAt,
        summary: getAuditSummary(entry.action, entry.metadataJson),
        linkPath: buildAuditLinkPath(courseSlug, entry.metadataJson, entry.threadId)
      })) as ForumAuditActivityItem[],
      deletedThreads: deletedThreads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        categorySlug: thread.category.slug,
        deletedAt: thread.deletedAt
      })) as ForumDeletedThreadItem[],
      deletedPosts: deletedPosts.map((post) => ({
        id: post.id,
        threadId: post.thread.id,
        threadTitle: post.thread.title,
        categorySlug: post.thread.category.slug,
        deletedAt: post.deletedAt
      })) as ForumDeletedPostItem[]
    };
  } catch {
    return buildDemoForumModerationDashboard(courseSlug);
  }
}

export async function archiveCurrentForumSpace(input: {
  courseSlug: string;
  actorId: string;
  actorRole: CourseRole;
}) {
  await publishDueAnnouncementsForCourse(input.courseSlug);
  const db = getDb();
  const activeSpace = await ensureActiveForumSpace(input.courseSlug);
  const editionNumberRecord = (await db.forumSpace.findFirst({
    where: {
      courseSlug: input.courseSlug
    },
    orderBy: {
      editionNumber: "desc"
    },
    select: {
      editionNumber: true
    }
  })) as { editionNumber: number } | null;
  const nextEditionNumber = (editionNumberRecord?.editionNumber ?? activeSpace.editionNumber) + 1;
  const archivedAt = new Date();

  const newActiveSpace = await db.$transaction(async (tx) => {
    await tx.forumSpace.update({
      where: {
        id: activeSpace.id
      },
      data: {
        status: "ARCHIVED",
        archivedAt,
        archivedById: input.actorId
      }
    });

    return tx.forumSpace.create({
      data: {
        courseSlug: input.courseSlug,
        editionNumber: nextEditionNumber,
        editionLabel: `Edicion ${nextEditionNumber}`,
        status: "ACTIVE"
      }
    });
  });

  await createDefaultForumCategoriesForSpace({
    courseSlug: input.courseSlug,
    forumSpaceId: newActiveSpace.id
  });

  await writeForumAuditLog({
    courseSlug: input.courseSlug,
    forumSpaceId: activeSpace.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "SPACE_ARCHIVED",
    metadata: {
      editionLabel: activeSpace.editionLabel
    }
  });

  return newActiveSpace;
}

export async function restoreArchivedForumSpace(input: {
  courseSlug: string;
  forumSpaceId: string;
  actorId: string;
  actorRole: CourseRole;
}) {
  const db = getDb();
  const [targetSpace, currentActiveSpace] = await Promise.all([
    db.forumSpace.findFirst({
      where: {
        id: input.forumSpaceId,
        courseSlug: input.courseSlug,
        status: "ARCHIVED"
      }
    }),
    db.forumSpace.findFirst({
      where: {
        courseSlug: input.courseSlug,
        status: "ACTIVE"
      },
      orderBy: {
        editionNumber: "desc"
      }
    })
  ]);

  if (!targetSpace || !currentActiveSpace) {
    throw new Error("No hemos encontrado la edicion solicitada.");
  }

  const archivedAt = new Date();

  await db.$transaction(async (tx) => {
    await tx.forumSpace.update({
      where: {
        id: currentActiveSpace.id
      },
      data: {
        status: "ARCHIVED",
        archivedAt,
        archivedById: input.actorId
      }
    });

    await tx.forumSpace.update({
      where: {
        id: targetSpace.id
      },
      data: {
        status: "ACTIVE",
        archivedAt: null,
        archivedById: null
      }
    });
  });

  await writeForumAuditLog({
    courseSlug: input.courseSlug,
    forumSpaceId: currentActiveSpace.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "SPACE_ARCHIVED",
    metadata: {
      editionLabel: currentActiveSpace.editionLabel
    }
  });

  await writeForumAuditLog({
    courseSlug: input.courseSlug,
    forumSpaceId: targetSpace.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "SPACE_RESTORED",
    metadata: {
      editionLabel: targetSpace.editionLabel
    }
  });

  return targetSpace;
}

export async function deleteArchivedForumSpace(input: {
  courseSlug: string;
  forumSpaceId: string;
  actorId: string;
  actorRole: CourseRole;
}) {
  const archivedSpace = (await getDb().forumSpace.findFirst({
    where: {
      id: input.forumSpaceId,
      courseSlug: input.courseSlug,
      status: "ARCHIVED"
    }
  })) as
    | {
        id: string;
        editionLabel: string;
      }
    | null;

  if (!archivedSpace) {
    throw new Error("La edicion archivada no existe.");
  }

  const deletedSpace = await getDb().forumSpace.update({
    where: {
      id: archivedSpace.id
    },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      deletedById: input.actorId
    }
  });

  await writeForumAuditLog({
    courseSlug: input.courseSlug,
    forumSpaceId: archivedSpace.id,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "SPACE_DELETED",
    metadata: {
      editionLabel: archivedSpace.editionLabel
    }
  });

  return deletedSpace;
}

export async function createForumThread(input: {
  courseSlug: string;
  categorySlug: string;
  authorId: string;
  authorRole: CourseRole;
  authorName: string;
  title: string;
  body: string;
  type?: "DISCUSSION" | "ANNOUNCEMENT";
  isPinned?: boolean;
  isReadOnly?: boolean;
  scheduledFor?: Date | null;
}) {
  const category = await getForumCategory(input.courseSlug, input.categorySlug);

  if (!category) {
    throw new Error("La categoria del foro no existe.");
  }

  const type = input.type ?? "DISCUSSION";
  const scheduledFor = type === "ANNOUNCEMENT" ? normalizeScheduledFor(input.scheduledFor) : null;
  const publishedAt = scheduledFor ? null : new Date();

  const thread = await getDb().forumThread.create({
    data: {
      categoryId: category.id,
      authorId: input.authorId,
      authorRole: input.authorRole,
      type,
      title: input.title,
      body: input.body,
      isPinned: Boolean(input.isPinned),
      isReadOnly: Boolean(input.isReadOnly && type === "ANNOUNCEMENT"),
      scheduledFor,
      publishedAt
    }
  });

  await writeForumAuditLog({
    courseSlug: input.courseSlug,
    forumSpaceId: category.forumSpaceId,
    threadId: thread.id,
    actorId: input.authorId,
    actorRole: input.authorRole,
    action: "THREAD_CREATED",
    metadata: {
      categorySlug: category.slug,
      categoryTitle: category.title,
      threadTitle: input.title,
      threadType: type,
      isPinned: Boolean(input.isPinned),
      scheduledFor: scheduledFor?.toISOString() ?? null
    }
  });

  if (type === "ANNOUNCEMENT" && publishedAt) {
    await notifyAnnouncementRecipients({
      courseSlug: input.courseSlug,
      categorySlug: category.slug,
      categoryTitle: category.title,
      threadId: thread.id,
      threadTitle: input.title,
      actorId: input.authorId,
      actorName: input.authorName
    });
  }

  return thread;
}

export async function createForumReply(input: {
  threadId: string;
  authorId: string;
  authorRole: CourseRole;
  authorName: string;
  body: string;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const post = await getDb().forumPost.create({
    data: {
      threadId: input.threadId,
      authorId: input.authorId,
      authorRole: input.authorRole,
      body: input.body
    }
  });

  await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      lastActivityAt: new Date()
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    postId: post.id,
    actorId: input.authorId,
    actorRole: input.authorRole,
    action: "POST_CREATED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle
    }
  });

  await notifyReplyRecipients({
    threadId: input.threadId,
    actorId: input.authorId,
    actorName: input.authorName
  });

  return post;
}

export async function updateForumThread(input: {
  threadId: string;
  title: string;
  body: string;
  editorId: string;
  editorRole: CourseRole;
  editorName: string;
  type?: "DISCUSSION" | "ANNOUNCEMENT";
  isPinned?: boolean;
  isReadOnly?: boolean;
  scheduledFor?: Date | null;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const currentThread = await getDb().forumThread.findUnique({
    where: {
      id: input.threadId
    },
    select: {
      type: true,
      isPinned: true,
      isReadOnly: true,
      scheduledFor: true,
      publishedAt: true,
      createdAt: true
    }
  });

  if (!currentThread) {
    throw new Error("El hilo no existe.");
  }
  const nextType = input.type ?? currentThread.type;
  const scheduledFor =
    nextType === "ANNOUNCEMENT" ? normalizeScheduledFor(input.scheduledFor) : null;
  const nextPublishedAt =
    nextType === "ANNOUNCEMENT"
      ? scheduledFor
        ? null
        : currentThread.publishedAt ?? new Date()
      : currentThread.publishedAt ?? currentThread.createdAt;

  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      title: input.title,
      body: input.body,
      type: nextType,
      isPinned:
        typeof input.isPinned === "boolean" ? input.isPinned : currentThread.isPinned,
      isReadOnly:
        nextType === "ANNOUNCEMENT"
          ? Boolean(input.isReadOnly)
          : false,
      scheduledFor,
      publishedAt: nextPublishedAt,
      editedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.editorId,
    actorRole: input.editorRole,
    action: "THREAD_UPDATED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: input.title,
      threadType: nextType,
      isPinned: thread.isPinned,
      scheduledFor: scheduledFor?.toISOString() ?? null
    }
  });

  if (
    nextType === "ANNOUNCEMENT" &&
    nextPublishedAt &&
    !currentThread.publishedAt
  ) {
    await notifyAnnouncementRecipients({
      courseSlug: threadContext.courseSlug,
      categorySlug: threadContext.categorySlug,
      categoryTitle: threadContext.categoryTitle,
      threadId: threadContext.threadId,
      threadTitle: input.title,
      actorId: input.editorId,
      actorName: input.editorName
    });
  }

  return thread;
}

export async function updateForumPost(input: {
  postId: string;
  body: string;
  editorId: string;
  editorRole: CourseRole;
}) {
  const postContextRecord = await getPostContext(input.postId);

  if (!postContextRecord) {
    throw new Error("La respuesta no existe.");
  }

  const postContext = toPostContext(postContextRecord);
  const post = await getDb().forumPost.update({
    where: {
      id: input.postId
    },
    data: {
      body: input.body,
      editedAt: new Date()
    }
  });

  await getDb().forumThread.update({
    where: {
      id: postContext.threadId
    },
    data: {
      lastActivityAt: new Date()
    }
  });

  await writeForumAuditLog({
    courseSlug: postContext.courseSlug,
    forumSpaceId: postContext.forumSpaceId,
    threadId: postContext.threadId,
    postId: postContext.postId,
    actorId: input.editorId,
    actorRole: input.editorRole,
    action: "POST_UPDATED",
    metadata: {
      categorySlug: postContext.categorySlug,
      threadTitle: postContext.threadTitle
    }
  });

  return post;
}

export async function deleteForumAttachment(input: {
  attachmentId: string;
  actorId: string;
  actorRole: CourseRole;
}) {
  const attachmentContext = await getAttachmentContext(input.attachmentId);

  if (!attachmentContext) {
    throw new Error("El adjunto no existe.");
  }

  const parentContext = attachmentContext.thread
    ? {
        type: "thread" as const,
        authorId: attachmentContext.thread.author.id,
        createdAt: attachmentContext.thread.createdAt,
        deletedAt: attachmentContext.thread.deletedAt,
        courseSlug: attachmentContext.thread.category.courseSlug,
        categorySlug: attachmentContext.thread.category.slug,
        categoryTitle: attachmentContext.thread.category.title,
        forumSpaceId: attachmentContext.thread.category.forumSpaceId,
        threadId: attachmentContext.thread.id,
        threadTitle: attachmentContext.thread.title,
        postId: null as string | null
      }
    : attachmentContext.post
      ? {
          type: "post" as const,
          authorId: attachmentContext.post.author.id,
          createdAt: attachmentContext.post.createdAt,
          deletedAt: attachmentContext.post.deletedAt,
          courseSlug: attachmentContext.post.thread.category.courseSlug,
          categorySlug: attachmentContext.post.thread.category.slug,
          categoryTitle: attachmentContext.post.thread.category.title,
          forumSpaceId: attachmentContext.post.thread.category.forumSpaceId,
          threadId: attachmentContext.post.thread.id,
          threadTitle: attachmentContext.post.thread.title,
          postId: attachmentContext.post.id
        }
      : null;

  if (!parentContext) {
    throw new Error("El adjunto no tiene contenido asociado.");
  }

  if (parentContext.deletedAt) {
    throw new Error("No se pueden modificar adjuntos de contenido eliminado.");
  }

  if (
    !canEditForumContent({
      currentUserId: input.actorId,
      authorId: parentContext.authorId,
      role: input.actorRole,
      createdAt: parentContext.createdAt
    })
  ) {
    throw new Error("Ya no tienes permiso para modificar este adjunto.");
  }

  const deletedAttachment = await getDb().forumAttachment.delete({
    where: {
      id: input.attachmentId
    }
  });

  if (deletedAttachment.storageKey) {
    const filePath = path.join(process.cwd(), "public", deletedAttachment.storageKey);

    try {
      await unlink(filePath);
    } catch {
      // Ignore missing file cleanup failures to avoid blocking attachment removal.
    }
  }

  await writeForumAuditLog({
    courseSlug: parentContext.courseSlug,
    forumSpaceId: parentContext.forumSpaceId,
    threadId: parentContext.threadId,
    postId: parentContext.postId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: parentContext.type === "thread" ? "THREAD_UPDATED" : "POST_UPDATED",
    metadata: {
      categorySlug: parentContext.categorySlug,
      threadTitle: parentContext.threadTitle,
      attachmentLabel: attachmentContext.label,
      attachmentRemoved: true
    }
  });

  return deletedAttachment;
}

export async function setThreadPinned(input: {
  threadId: string;
  pinned: boolean;
  actorId: string;
  actorRole: CourseRole;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      isPinned: input.pinned
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.pinned ? "THREAD_PINNED" : "THREAD_UNPINNED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle
    }
  });

  return thread;
}

export async function setThreadClosed(input: {
  threadId: string;
  closed: boolean;
  actorId: string;
  actorRole: CourseRole;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      isClosed: input.closed
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.closed ? "THREAD_CLOSED" : "THREAD_REOPENED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle
    }
  });

  return thread;
}

export async function softDeleteThread(input: {
  threadId: string;
  deletedById: string;
  actorRole: CourseRole;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      deletedAt: new Date(),
      deletedById: input.deletedById
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.deletedById,
    actorRole: input.actorRole,
    action: "THREAD_DELETED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle
    }
  });

  if (threadContext.threadAuthorId !== input.deletedById) {
    await notifyModerationRecipient({
      userId: threadContext.threadAuthorId,
      courseSlug: threadContext.courseSlug,
      categorySlug: threadContext.categorySlug,
      threadId: threadContext.threadId,
      title: "Tu hilo ha sido moderado",
      body: `El equipo docente ha retirado "${threadContext.threadTitle}".`
    });
  }

  return thread;
}

export async function restoreThread(input: {
  threadId: string;
  restoredById: string;
  actorRole: CourseRole;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      deletedAt: null,
      deletedById: null
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.restoredById,
    actorRole: input.actorRole,
    action: "THREAD_RESTORED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle
    }
  });

  if (threadContext.threadAuthorId !== input.restoredById) {
    await notifyModerationRecipient({
      userId: threadContext.threadAuthorId,
      courseSlug: threadContext.courseSlug,
      categorySlug: threadContext.categorySlug,
      threadId: threadContext.threadId,
      title: "Tu hilo ha sido restaurado",
      body: `El equipo docente ha restaurado "${threadContext.threadTitle}".`
    });
  }

  return thread;
}

export async function softDeletePost(input: {
  postId: string;
  deletedById: string;
  actorRole: CourseRole;
}) {
  const postContextRecord = await getPostContext(input.postId);

  if (!postContextRecord) {
    throw new Error("La respuesta no existe.");
  }

  const postContext = toPostContext(postContextRecord);
  const post = (await getDb().forumPost.update({
    where: {
      id: input.postId
    },
    data: {
      deletedAt: new Date(),
      deletedById: input.deletedById
    }
  })) as { id: string; threadId: string };

  await getDb().forumThread.updateMany({
    where: {
      resolvedPostId: input.postId
    },
    data: {
      resolvedPostId: null,
      isResolved: false
    }
  });

  await writeForumAuditLog({
    courseSlug: postContext.courseSlug,
    forumSpaceId: postContext.forumSpaceId,
    threadId: postContext.threadId,
    postId: postContext.postId,
    actorId: input.deletedById,
    actorRole: input.actorRole,
    action: "POST_DELETED",
    metadata: {
      categorySlug: postContext.categorySlug,
      threadTitle: postContext.threadTitle
    }
  });

  if (postContext.postAuthorId !== input.deletedById) {
    await notifyModerationRecipient({
      userId: postContext.postAuthorId,
      courseSlug: postContext.courseSlug,
      categorySlug: postContext.categorySlug,
      threadId: postContext.threadId,
      title: "Tu respuesta ha sido moderada",
      body: `El equipo docente ha retirado una respuesta en "${postContext.threadTitle}".`
    });
  }

  return post;
}

export async function restorePost(input: {
  postId: string;
  restoredById: string;
  actorRole: CourseRole;
}) {
  const postContextRecord = await getPostContext(input.postId);

  if (!postContextRecord) {
    throw new Error("La respuesta no existe.");
  }

  const postContext = toPostContext(postContextRecord);
  const post = await getDb().forumPost.update({
    where: {
      id: input.postId
    },
    data: {
      deletedAt: null,
      deletedById: null
    }
  });

  await writeForumAuditLog({
    courseSlug: postContext.courseSlug,
    forumSpaceId: postContext.forumSpaceId,
    threadId: postContext.threadId,
    postId: postContext.postId,
    actorId: input.restoredById,
    actorRole: input.actorRole,
    action: "POST_RESTORED",
    metadata: {
      categorySlug: postContext.categorySlug,
      threadTitle: postContext.threadTitle
    }
  });

  if (postContext.postAuthorId !== input.restoredById) {
    await notifyModerationRecipient({
      userId: postContext.postAuthorId,
      courseSlug: postContext.courseSlug,
      categorySlug: postContext.categorySlug,
      threadId: postContext.threadId,
      title: "Tu respuesta ha sido restaurada",
      body: `El equipo docente ha restaurado una respuesta tuya en "${postContext.threadTitle}".`
    });
  }

  return post;
}

export async function markResolvedPost(input: {
  threadId: string;
  postId: string;
  actorId: string;
  actorRole: CourseRole;
}) {
  const postContextRecord = await getPostContext(input.postId);

  if (!postContextRecord || postContextRecord.thread.id !== input.threadId) {
    throw new Error("La respuesta no pertenece al hilo indicado.");
  }

  const postContext = toPostContext(postContextRecord);
  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      resolvedPostId: input.postId,
      isResolved: true
    }
  });

  await writeForumAuditLog({
    courseSlug: postContext.courseSlug,
    forumSpaceId: postContext.forumSpaceId,
    threadId: postContext.threadId,
    postId: postContext.postId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "POST_MARKED_RESOLVED",
    metadata: {
      categorySlug: postContext.categorySlug,
      threadTitle: postContext.threadTitle
    }
  });

  if (postContext.postAuthorId !== input.actorId) {
    await notifyModerationRecipient({
      userId: postContext.postAuthorId,
      courseSlug: postContext.courseSlug,
      categorySlug: postContext.categorySlug,
      threadId: postContext.threadId,
      title: "Tu respuesta ha sido marcada como resuelta",
      body: `Una respuesta tuya en "${postContext.threadTitle}" se ha marcado como resuelta.`
    });
  }

  return thread;
}

export async function unmarkResolvedPost(input: {
  threadId: string;
  actorId: string;
  actorRole: CourseRole;
}) {
  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const thread = await getDb().forumThread.update({
    where: {
      id: input.threadId
    },
    data: {
      resolvedPostId: null,
      isResolved: false
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "POST_UNMARKED_RESOLVED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle
    }
  });

  return thread;
}

export async function createThreadReport(input: {
  threadId: string;
  reportedById: string;
  reportedByRole: CourseRole;
  reason: string;
}) {
  const existing = await getDb().forumReport.findFirst({
    where: {
      threadId: input.threadId,
      reportedById: input.reportedById,
      status: "OPEN"
    }
  });

  if (existing) {
    return existing;
  }

  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const report = await getDb().forumReport.create({
    data: {
      threadId: input.threadId,
      reportedById: input.reportedById,
      reason: input.reason
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.reportedById,
    actorRole: input.reportedByRole,
    action: "REPORT_CREATED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle,
      reason: input.reason
    }
  });

  return report;
}

export async function createPostReport(input: {
  postId: string;
  reportedById: string;
  reportedByRole: CourseRole;
  reason: string;
}) {
  const existing = await getDb().forumReport.findFirst({
    where: {
      postId: input.postId,
      reportedById: input.reportedById,
      status: "OPEN"
    }
  });

  if (existing) {
    return existing;
  }

  const postContextRecord = await getPostContext(input.postId);

  if (!postContextRecord) {
    throw new Error("La respuesta no existe.");
  }

  const postContext = toPostContext(postContextRecord);
  const report = await getDb().forumReport.create({
    data: {
      postId: input.postId,
      reportedById: input.reportedById,
      reason: input.reason
    }
  });

  await writeForumAuditLog({
    courseSlug: postContext.courseSlug,
    forumSpaceId: postContext.forumSpaceId,
    threadId: postContext.threadId,
    postId: postContext.postId,
    actorId: input.reportedById,
    actorRole: input.reportedByRole,
    action: "REPORT_CREATED",
    metadata: {
      categorySlug: postContext.categorySlug,
      threadTitle: postContext.threadTitle,
      reason: input.reason
    }
  });

  return report;
}

export async function resolveForumReport(input: {
  reportId: string;
  status: "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";
  actorId: string;
  actorRole: CourseRole;
}) {
  const reportContext = await getReportContext(input.reportId);

  if (!reportContext) {
    throw new Error("El reporte no existe.");
  }

  const threadContext = reportContext.thread
    ? {
        threadId: reportContext.thread.id,
        threadTitle: reportContext.thread.title,
        categorySlug: reportContext.thread.category.slug,
        categoryTitle: reportContext.thread.category.title,
        courseSlug: reportContext.thread.category.courseSlug,
        forumSpaceId: reportContext.thread.category.forumSpaceId
      }
    : reportContext.post
      ? {
          threadId: reportContext.post.thread.id,
          threadTitle: reportContext.post.thread.title,
          categorySlug: reportContext.post.thread.category.slug,
          categoryTitle: reportContext.post.thread.category.title,
          courseSlug: reportContext.post.thread.category.courseSlug,
          forumSpaceId: reportContext.post.thread.category.forumSpaceId
        }
      : null;

  if (!threadContext) {
    throw new Error("El reporte no tiene contexto de foro asociado.");
  }

  const report = await getDb().forumReport.update({
    where: {
      id: input.reportId
    },
    data: {
      status: input.status,
      resolvedAt: new Date(),
      resolvedById: input.actorId
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    postId: reportContext.post?.id ?? null,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.status === "DISMISSED" ? "REPORT_DISMISSED" : "REPORT_REVIEWED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle,
      reason: reportContext.reason,
      reportStatus: input.status
    }
  });

  if (reportContext.reportedById !== input.actorId) {
    const statusCopy =
      input.status === "DISMISSED"
        ? {
            title: "Tu reporte ha sido descartado",
            body: `El equipo docente ha revisado el reporte sobre "${threadContext.threadTitle}" y lo ha descartado.`
          }
        : input.status === "ACTION_TAKEN"
          ? {
              title: "Tu reporte ha sido resuelto",
              body: `El equipo docente ha tomado medidas sobre "${threadContext.threadTitle}".`
            }
          : {
              title: "Tu reporte ha sido revisado",
              body: `El equipo docente ha revisado el reporte sobre "${threadContext.threadTitle}".`
            };

    await createForumNotifications([
      {
        userId: reportContext.reportedById,
        courseSlug: threadContext.courseSlug,
        type: "MODERATION_ACTION",
        title: statusCopy.title,
        body: statusCopy.body,
        linkPath: `/mis-cursos/${threadContext.courseSlug}/foro/${threadContext.categorySlug}/${threadContext.threadId}`
      }
    ]);
  }

  return report;
}

export async function getUserForumNotifications(input: {
  userId: string;
  courseSlugs: string[];
  limit?: number;
}) {
  if (isDemoUserId(input.userId)) {
    return {
      notifications: [],
      unreadCount: 0
    };
  }

  const courseSlugs = Array.from(new Set(input.courseSlugs.filter(Boolean)));

  await Promise.all(courseSlugs.map((courseSlug) => publishDueAnnouncementsForCourse(courseSlug)));

  const [notifications, unreadCount] = await Promise.all([
    getDb().forumNotification.findMany({
      where: {
        userId: input.userId,
        ...(courseSlugs.length
          ? {
              courseSlug: {
                in: courseSlugs
              }
            }
          : {})
      },
      orderBy: {
        createdAt: "desc"
      },
      take: input.limit ?? 8
    }) as Promise<ForumNotificationListItem[]>,
    getDb().forumNotification.count({
      where: {
        userId: input.userId,
        ...(courseSlugs.length
          ? {
              courseSlug: {
                in: courseSlugs
              }
            }
          : {}),
        readAt: null
      }
    })
  ]);

  return {
    notifications,
    unreadCount
  };
}

export async function markForumNotificationRead(input: { notificationId: string; userId: string }) {
  return getDb().forumNotification.updateMany({
    where: {
      id: input.notificationId,
      userId: input.userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });
}

export async function markAllForumNotificationsRead(userId: string) {
  return getDb().forumNotification.updateMany({
    where: {
      userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });
}
