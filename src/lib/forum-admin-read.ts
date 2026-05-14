import type { ForumAuditAction } from "@prisma/client";
import {
  ensureActiveForumSpace,
  getArchivedForumSpaces,
  getDeletedForumSpaces
} from "@/lib/course-community";
import {
  buildAuditLinkPath,
  getAuditSummary
} from "@/lib/forum-audit";
import {
  buildDemoForumModerationDashboard,
  buildDemoForumSpaceHistory
} from "@/lib/forum-demo";
import { publishDueAnnouncementsForCourse } from "@/lib/forum-notifications";
import { getDb } from "@/lib/prisma";
import {
  canUseForumFallback,
  logForumFallback,
  type ForumAuditActivityItem,
  type ForumDeletedPostItem,
  type ForumDeletedThreadItem,
  type ForumModerationReportItem,
  type ForumScheduledAnnouncementItem
} from "@/lib/forum-types";
import type { CourseRole } from "@/lib/course-roles";

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
  } catch (error) {
    if (!canUseForumFallback(error)) {
      throw error;
    }

    logForumFallback("getForumSpaceHistory", courseSlug, error);
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
  } catch (error) {
    if (!canUseForumFallback(error)) {
      throw error;
    }

    logForumFallback("getForumModerationDashboard", courseSlug, error);
    return buildDemoForumModerationDashboard(courseSlug);
  }
}
