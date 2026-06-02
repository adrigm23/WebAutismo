import { defaultCourseCategories, ensureCourseCommunity } from "@/lib/course-community";
import { getForumCategory } from "@/lib/forum-categories";
import {
  buildThreadOrderBy,
  buildThreadWhere,
  buildVisibilityWhere
} from "@/lib/forum-query";

export type RecentForumThreadItem = {
  id: string;
  title: string;
  lastActivityAt: Date;
  postCount: number;
  category: {
    slug: string;
    title: string;
  };
};

export type CommunityFeedThread = {
  id: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  categoryTitle: string;
  courseSlug: string;
  courseTitle: string;
  authorName: string;
  authorInitials: string;
  isStaff: boolean;
  isResolved: boolean;
  isPinned: boolean;
  replyCount: number;
  lastActivityAt: Date;
};

export type CommunityFeedCourse = {
  courseSlug: string;
  courseTitle: string;
  threadCount: number;
};

export async function getAggregatedCommunityFeed(
  spaces: Array<{ courseSlug: string; courseTitle: string }>,
  limit = 24
): Promise<{ threads: CommunityFeedThread[]; courses: CommunityFeedCourse[] }> {
  if (spaces.length === 0) return { threads: [], courses: [] };

  const db = getDb();
  const courseSlugs = spaces.map((s) => s.courseSlug);

  // Get active forum spaces for enrolled courses
  const activeSpaces = await db.forumSpace.findMany({
    where: { courseSlug: { in: courseSlugs }, status: "ACTIVE", deletedAt: null },
    select: { id: true, courseSlug: true },
  });

  if (activeSpaces.length === 0) return { threads: [], courses: [] };

  const spaceIds = activeSpaces.map((s) => s.id);

  const rawThreads = await db.forumThread.findMany({
    where: {
      category: { forumSpaceId: { in: spaceIds } },
      publishedAt: { not: null },
      deletedAt: null,
    },
    orderBy: { lastActivityAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      isPinned: true,
      isResolved: true,
      lastActivityAt: true,
      authorRole: true,
      author: { select: { name: true } },
      category: { select: { slug: true, title: true, courseSlug: true } },
      _count: { select: { posts: true } },
    },
  });

  const courseThreadCounts: Record<string, number> = {};
  for (const space of activeSpaces) {
    const spaceThreads = await db.forumThread.count({
      where: {
        category: { forumSpaceId: space.id },
        publishedAt: { not: null },
        deletedAt: null,
      },
    });
    courseThreadCounts[space.courseSlug] = spaceThreads;
  }

  function initials(name: string): string {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  const threads: CommunityFeedThread[] = rawThreads.map((t) => {
    const courseSpace = spaces.find((s) => s.courseSlug === t.category.courseSlug);
    const plainExcerpt = t.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
    return {
      id: t.id,
      title: t.title,
      excerpt: plainExcerpt,
      categorySlug: t.category.slug,
      categoryTitle: t.category.title,
      courseSlug: t.category.courseSlug,
      courseTitle: courseSpace?.courseTitle ?? t.category.courseSlug,
      authorName: t.author.name,
      authorInitials: initials(t.author.name),
      isStaff: t.authorRole === "TEACHER" || t.authorRole === "ADMIN",
      isResolved: t.isResolved,
      isPinned: t.isPinned,
      replyCount: t._count.posts,
      lastActivityAt: t.lastActivityAt,
    };
  });

  const courses: CommunityFeedCourse[] = spaces.map((s) => ({
    courseSlug: s.courseSlug,
    courseTitle: s.courseTitle,
    threadCount: courseThreadCounts[s.courseSlug] ?? 0,
  }));

  return { threads, courses };
}
import { publishDueAnnouncementsForCourse } from "@/lib/forum-notifications";
import { getDb } from "@/lib/prisma";
import {
  buildPagination,
  canUseForumFallback,
  logForumFallback,
  sanitizeForumAttachment,
  type ForumAttachmentItem,
  type ForumCategorySummary,
  type ForumThreadDetail,
  type ForumThreadListItem,
  type ForumThreadPostItem,
  type ForumThreadQuery,
  type ForumViewerRole
} from "@/lib/forum-types";

export async function getForumCategories(
  courseSlug: string,
  viewerRole?: ForumViewerRole
): Promise<ForumCategorySummary[]> {
  try {
    await publishDueAnnouncementsForCourse(courseSlug);
    const activeSpace = await ensureCourseCommunity(courseSlug);

    const categories = await getDb().forumCategory.findMany({
      where: {
        forumSpaceId: activeSpace.id
      },
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        forumSpaceId: true,
        slug: true,
        title: true,
        description: true,
        _count: {
          select: {
            threads: {
              where: {
                deletedAt: null,
                ...buildVisibilityWhere(viewerRole)
              }
            }
          }
        }
      }
    });

    return categories.map((category) => ({
      ...category,
      _count: {
        threads: category._count.threads
      }
    })) as ForumCategorySummary[];
  } catch (error) {
    if (!canUseForumFallback(error)) {
      throw error;
    }

    logForumFallback("getForumCategories", courseSlug, error);
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

    const where = buildThreadWhere(category.id, query, viewerRole);
    const totalItems = await getDb().forumThread.count({
      where
    });
    const pagination = buildPagination({
      page: query?.page,
      pageSize: query?.pageSize,
      totalItems,
      mode: "threads"
    });
    const threads = (await getDb().forumThread.findMany({
      where,
      orderBy: buildThreadOrderBy(query?.sort),
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
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
      threads,
      pagination
    };
  } catch (error) {
    if (!canUseForumFallback(error)) {
      throw error;
    }

    logForumFallback("getForumThreads", courseSlug, error);
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
      threads: [],
      pagination: buildPagination({
        page: query?.page,
        pageSize: query?.pageSize,
        totalItems: 0,
        mode: "threads"
      })
    };
  }
}

export async function getForumThreadById(input: {
  courseSlug: string;
  categorySlug: string;
  threadId: string;
  viewerRole?: ForumViewerRole;
  page?: number;
  pageSize?: number;
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
        _count: {
          select: {
            posts: true
          }
        }
      }
    })) as (Omit<ForumThreadDetail, "posts"> & { _count: { posts: number } }) | null;

    if (!thread) {
      return null;
    }

    const shouldPaginatePosts =
      typeof input.page === "number" || typeof input.pageSize === "number";
    const postsPagination = shouldPaginatePosts
      ? buildPagination({
          page: input.page,
          pageSize: input.pageSize,
          totalItems: thread._count.posts,
          mode: "posts"
        })
      : buildPagination({
          page: 1,
          pageSize: Math.max(thread._count.posts, 1),
          totalItems: thread._count.posts,
          maxPageSize: Number.MAX_SAFE_INTEGER,
          fallbackPageSize: Math.max(thread._count.posts, 1)
        });
    const posts = (await getDb().forumPost.findMany({
      where: {
        threadId: thread.id
      },
      orderBy: {
        createdAt: "asc"
      },
      ...(shouldPaginatePosts
        ? {
            skip: (postsPagination.page - 1) * postsPagination.pageSize,
            take: postsPagination.pageSize
          }
        : {}),
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
    })) as ForumThreadPostItem[];

    const sanitizedThread = {
      ...thread,
      attachments: thread.attachments
        .map((attachment) => sanitizeForumAttachment(attachment))
        .filter((attachment): attachment is ForumAttachmentItem => Boolean(attachment)),
      posts: posts.map((post) => ({
        ...post,
        attachments: post.attachments
          .map((attachment) => sanitizeForumAttachment(attachment))
          .filter((attachment): attachment is ForumAttachmentItem => Boolean(attachment))
      }))
    };

    return {
      category,
      thread: sanitizedThread,
      postsPagination
    };
  } catch (error) {
    if (!canUseForumFallback(error)) {
      throw error;
    }

    logForumFallback("getForumThreadById", input.courseSlug, error);
    return null;
  }
}

export async function getRecentForumThreads(
  courseSlug: string,
  viewerRole?: ForumViewerRole,
  limit = 5
): Promise<RecentForumThreadItem[]> {
  try {
    const activeSpace = await ensureCourseCommunity(courseSlug);
    const threads = await getDb().forumThread.findMany({
      where: {
        category: {
          forumSpaceId: activeSpace.id,
        },
        deletedAt: null,
        publishedAt: { not: null },
        ...buildVisibilityWhere(viewerRole),
      },
      orderBy: { lastActivityAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        lastActivityAt: true,
        category: {
          select: {
            slug: true,
            title: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    return threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      lastActivityAt: thread.lastActivityAt,
      postCount: thread._count.posts,
      category: thread.category,
    }));
  } catch (error) {
    if (!canUseForumFallback(error)) {
      throw error;
    }

    logForumFallback("getRecentForumThreads", courseSlug, error);
    return [];
  }
}
