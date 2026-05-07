import type { ForumNotificationType, NotificationCategory } from "@prisma/client";
import { isDemoUserId } from "@/lib/demo-auth";
import { sendNotificationEmail } from "@/lib/email";
import { getDb } from "@/lib/prisma";

export async function ensureNotificationPreference(userId: string) {
  if (isDemoUserId(userId)) {
    return {
      userId,
      emailEnabled: true,
      webEnabled: true,
      createdAt: new Date("2026-05-07T09:00:00.000Z"),
      updatedAt: new Date("2026-05-07T09:00:00.000Z")
    };
  }

  return getDb().notificationPreference.upsert({
    where: {
      userId
    },
    update: {},
    create: {
      userId
    }
  });
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
  }

  if (preference.emailEnabled) {
    await sendNotificationEmail({
      email: user.email,
      name: user.name,
      subject: input.emailSubject ?? input.title,
      title: input.title,
      body: input.body,
      actionLabel: "Abrir notificacion",
      actionUrl: input.linkPath.startsWith("http")
        ? input.linkPath
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${input.linkPath}`
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

  if (preference.webEnabled) {
    await getDb().forumNotification.create({
      data: {
        userId: input.userId,
        courseSlug: input.courseSlug,
        type: input.type,
        title: input.title,
        body: input.body,
        linkPath: input.linkPath
      }
    });
  }

  if (preference.emailEnabled) {
    await sendNotificationEmail({
      email: user.email,
      name: user.name,
      subject: input.emailSubject ?? input.title,
      title: input.title,
      body: input.body,
      actionLabel: "Abrir foro",
      actionUrl: input.linkPath.startsWith("http")
        ? input.linkPath
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${input.linkPath}`
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
}

export async function markUserNotificationRead(input: {
  notificationId: string;
  userId: string;
}) {
  return getDb().userNotification.updateMany({
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

export async function markAllUserNotificationsRead(userId: string) {
  return getDb().userNotification.updateMany({
    where: {
      userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });
}
