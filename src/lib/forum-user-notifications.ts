import { buildLegacyCourseInWhere, getCourseIdentitiesBySlugs } from "@/lib/course-identity";
import { isDemoUserId } from "@/lib/demo-auth";
import { publishDueAnnouncementsForCourse } from "@/lib/forum-notifications";
import { getDb } from "@/lib/prisma";

type ForumNotificationListItem = {
  id: string;
  courseSlug: string;
  type: import("@prisma/client").ForumNotificationType;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
};

export async function getUserForumNotifications(input: {
  userId: string;
  courseSlugs: string[];
  limit?: number;
  skipPublishDueAnnouncements?: boolean;
}) {
  if (isDemoUserId(input.userId)) {
    return {
      notifications: [],
      unreadCount: 0
    };
  }

  const courseSlugs = Array.from(new Set(input.courseSlugs.filter(Boolean)));
  const courseIdentities = await getCourseIdentitiesBySlugs(courseSlugs);

  if (!input.skipPublishDueAnnouncements) {
    await Promise.all(courseSlugs.map((courseSlug) => publishDueAnnouncementsForCourse(courseSlug)));
  }

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
