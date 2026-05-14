import type { ForumNotificationType, NotificationCategory } from "@prisma/client";
import { getCourseIdentityBySlug } from "@/lib/course-identity";
import { isDatabaseSchemaDriftError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { sendNotificationEmail } from "@/lib/email";
import { getDb } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

function buildDefaultNotificationPreference(userId: string) {
  return {
    userId,
    emailEnabled: true,
    webEnabled: true,
    createdAt: new Date("2026-05-07T09:00:00.000Z"),
    updatedAt: new Date("2026-05-07T09:00:00.000Z")
  };
}

export async function ensureNotificationPreference(userId: string) {
  if (isDemoUserId(userId)) {
    return buildDefaultNotificationPreference(userId);
  }

  try {
    const existingPreference = await getDb().notificationPreference.findUnique({
      where: {
        userId
      }
    });

    if (existingPreference) {
      return existingPreference;
    }

    return getDb().notificationPreference.create({
      data: {
        userId
      }
    });
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      return buildDefaultNotificationPreference(userId);
    }

    throw error;
  }
}

export async function getNotificationPreference(userId: string) {
  return ensureNotificationPreference(userId);
}

export async function sendPlatformNotification(input: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  linkPath: string;
  metadata?: Record<string, unknown>;
  emailSubject?: string;
}) {
  const [preference, user] = await Promise.all([
    ensureNotificationPreference(input.userId),
    getDb().user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        email: true,
        name: true,
        isActive: true
      }
    })
  ]);

  if (!user?.isActive) {
    return;
  }

  if (preference.webEnabled) {
    try {
      await getDb().userNotification.create({
        data: {
          userId: input.userId,
          category: input.category,
          title: input.title,
          body: input.body,
          linkPath: input.linkPath,
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
        }
      });
    } catch (error) {
      if (!isDatabaseSchemaDriftError(error)) {
        throw error;
      }
    }
  }

  if (preference.emailEnabled) {
    await sendNotificationEmail({
      email: user.email,
      name: user.name,
      subject: input.emailSubject ?? input.title,
      title: input.title,
      body: input.body,
      actionLabel: "Abrir notificacion",
      actionUrl: input.linkPath.startsWith("http") ? input.linkPath : absoluteUrl(input.linkPath)
    });
  }
}

export async function sendForumNotification(input: {
  userId: string;
  courseSlug: string;
  type: ForumNotificationType;
  title: string;
  body: string;
  linkPath: string;
  emailSubject?: string;
}) {
  const [preference, user] = await Promise.all([
    ensureNotificationPreference(input.userId),
    getDb().user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        email: true,
        name: true,
        isActive: true
      }
    })
  ]);

  if (!user?.isActive) {
    return;
  }

  const courseIdentity = await getCourseIdentityBySlug(input.courseSlug);

  if (preference.webEnabled) {
    try {
      await getDb().forumNotification.create({
        data: {
          userId: input.userId,
          courseId: courseIdentity?.id ?? null,
          courseSlug: input.courseSlug,
          type: input.type,
          title: input.title,
          body: input.body,
          linkPath: input.linkPath
        }
      });
    } catch (error) {
      if (!isDatabaseSchemaDriftError(error)) {
        throw error;
      }
    }
  }

  if (preference.emailEnabled) {
    await sendNotificationEmail({
      email: user.email,
      name: user.name,
      subject: input.emailSubject ?? input.title,
      title: input.title,
      body: input.body,
      actionLabel: "Abrir foro",
      actionUrl: input.linkPath.startsWith("http") ? input.linkPath : absoluteUrl(input.linkPath)
    });
  }
}

export async function getUserPlatformNotifications(input: {
  userId: string;
  limit?: number;
}) {
  if (isDemoUserId(input.userId)) {
    return {
      notifications: [],
      unreadCount: 0
    };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getDb().userNotification.findMany({
        where: {
          userId: input.userId
        },
        orderBy: {
          createdAt: "desc"
        },
        take: input.limit ?? 8
      }),
      getDb().userNotification.count({
        where: {
          userId: input.userId,
          readAt: null
        }
      })
    ]);

    return {
      notifications,
      unreadCount
    };
  } catch (error) {
    if (isDatabaseSchemaDriftError(error)) {
      return {
        notifications: [],
        unreadCount: 0
      };
    }

    throw error;
  }
}

export async function markUserNotificationRead(input: {
  notificationId: string;
  userId: string;
}) {
  try {
    return await getDb().userNotification.updateMany({
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

export async function markAllUserNotificationsRead(userId: string) {
  try {
    return await getDb().userNotification.updateMany({
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
