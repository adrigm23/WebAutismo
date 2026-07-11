import type { ForumNotificationListItem } from "@/lib/forum-types";
import { buildLegacyCourseInWhere, getCourseIdentitiesBySlugs, type CourseIdentity } from "@/lib/course-identity";
import { isDatabaseSchemaDriftError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { publishDueAnnouncementsForCourse } from "@/lib/forum-notifications";
import { getDb } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";

export async function getUserForumNotifications(input: {
  userId: string;
  courseSlugs: string[];
  limit?: number;
  skipPublishDueAnnouncements?: boolean;
  // Optional: pass {id, slug} pairs when the caller already resolved them
  // (e.g. from getUserCourseSpaces) to skip a redundant Course lookup.
  courseIdentities?: CourseIdentity[];
}) {
  if (isDemoUserId(input.userId)) {
    return {
      notifications: [],
      unreadCount: 0
    };
  }

  const courseSlugs = Array.from(new Set(input.courseSlugs.filter(Boolean)));
  const courseIdentities = input.courseIdentities?.length
    ? input.courseIdentities.filter((identity) => courseSlugs.includes(identity.slug))
    : await getCourseIdentitiesBySlugs(courseSlugs);

  if (!input.skipPublishDueAnnouncements) {
    await Promise.all(courseSlugs.map((courseSlug) => publishDueAnnouncementsForCourse(courseSlug)));
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getDb().forumNotification.findMany({
        where: {
          userId: input.userId,
          ...(courseSlugs.length
            ? {
                ...buildLegacyCourseInWhere(
                  courseIdentities.length
                    ? courseIdentities
                    : courseSlugs.map((courseSlug) => ({
                        slug: courseSlug
                      }))
                )
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
                ...buildLegacyCourseInWhere(
                  courseIdentities.length
                    ? courseIdentities
                    : courseSlugs.map((courseSlug) => ({
                        slug: courseSlug
                      }))
                )
              }
            : {}),
          readAt: null
        }
      })
    ]);

    return {
      notifications: notifications.map((notification) => ({
        ...notification,
        createdRelativeLabel: formatRelativeTime(notification.createdAt)
      })),
      unreadCount
    };
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
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
        notifications: notifications.map((notification) => ({
          ...notification,
          createdRelativeLabel: formatRelativeTime(notification.createdAt)
        })),
        unreadCount
      };
    }

    throw error;
  }
}

export async function markForumNotificationRead(input: { notificationId: string; userId: string }) {
  try {
    return await getDb().forumNotification.updateMany({
      where: {
        id: input.notificationId,
        userId: input.userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      return { count: 0 };
    }

    throw error;
  }
}

export async function markAllForumNotificationsRead(userId: string) {
  try {
    return await getDb().forumNotification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      return { count: 0 };
    }

    throw error;
  }
}
