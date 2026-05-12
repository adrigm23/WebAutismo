import type { CourseRole } from "@/lib/course-roles";
import {
  getPostContext,
  getThreadContext,
  toPostContext,
  toThreadContext
} from "@/lib/forum-context";
import {
  notifyModerationRecipient
} from "@/lib/forum-notifications";
import { writeForumAuditLog } from "@/lib/forum-audit";
import { getDb } from "@/lib/prisma";

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
