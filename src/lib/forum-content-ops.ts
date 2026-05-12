import type { CourseRole } from "@/lib/course-roles";
import { createDefaultForumCategoriesForSpace, ensureActiveForumSpace } from "@/lib/course-community";
import { removeStoredForumAttachment } from "@/lib/forum-attachment-storage";
import { writeForumAuditLog } from "@/lib/forum-audit";
import { getAttachmentContext, getPostContext, getThreadContext, toPostContext, toThreadContext } from "@/lib/forum-context";
import { getForumCategory } from "@/lib/forum-categories";
import { notifyAnnouncementRecipients, notifyReplyRecipients, publishDueAnnouncementsForCourse } from "@/lib/forum-notifications";
import { canEditForumContent } from "@/lib/forum-permissions";
import { normalizeScheduledFor } from "@/lib/forum-query";
import { getDb } from "@/lib/prisma";

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
    try {
      await removeStoredForumAttachment(deletedAttachment.storageKey);
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
