import type { ForumAuditAction, ForumNotificationType } from "@prisma/client";
import {
  defaultCourseCategories,
  ensureActiveForumSpace,
  ensureCourseCommunity,
  getArchivedForumSpaces,
  getDeletedForumSpaces
} from "@/lib/course-community";
import {
  buildAuditLinkPath,
  getAuditSummary
} from "@/lib/forum-audit";
import { getForumCategory } from "@/lib/forum-categories";
import {
  buildDemoForumModerationDashboard,
  buildDemoForumSpaceHistory
} from "@/lib/forum-demo";
import {
  buildThreadOrderBy,
  buildThreadWhere,
  buildVisibilityWhere
} from "@/lib/forum-query";
export { canEditForumContent } from "@/lib/forum-permissions";
import { publishDueAnnouncementsForCourse } from "@/lib/forum-notifications";
import type { CourseRole } from "@/lib/course-roles";
import { getDb } from "@/lib/prisma";

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

export { getForumCategory } from "@/lib/forum-categories";

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

export {
  archiveCurrentForumSpace,
  restoreArchivedForumSpace,
  deleteArchivedForumSpace,
  createForumThread,
  createForumReply,
  updateForumThread,
  updateForumPost,
  deleteForumAttachment
} from "@/lib/forum-content-ops";

export {
  setThreadPinned,
  setThreadClosed,
  softDeleteThread,
  restoreThread,
  softDeletePost,
  restorePost,
  markResolvedPost,
  unmarkResolvedPost
} from "@/lib/forum-moderation-ops";

export {
  createThreadReport,
  createPostReport,
  resolveForumReport
} from "@/lib/forum-report-ops";

export {
  getUserForumNotifications,
  markForumNotificationRead,
  markAllForumNotificationsRead
} from "@/lib/forum-user-notifications";



