import type { ForumNotificationType } from "@prisma/client";
import { ensureCourseCommunity } from "@/lib/course-community";
import type { CourseRole } from "@/lib/course-roles";
import { sendForumNotification } from "@/lib/notifications";
import { getDb } from "@/lib/prisma";
import { writeForumAuditLog } from "@/lib/forum-audit";

export async function createForumNotifications(
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

export async function notifyAnnouncementRecipients(input: {
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
      [
        ...enrollments.map((membership) => membership.userId),
        ...courseAssignments.map((membership) => membership.userId),
        ...admins.map((admin) => admin.id)
      ].filter((userId) => userId !== input.actorId)
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

export async function notifyReplyRecipients(input: {
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

export async function notifyModerationRecipient(input: {
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

export async function publishDueAnnouncementsForCourse(courseSlug: string) {
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
