import type { CourseRole } from "@/lib/course-roles";
import { getPostContext, getReportContext, getThreadContext, toPostContext, toThreadContext } from "@/lib/forum-context";
import { writeForumAuditLog } from "@/lib/forum-audit";
import { createForumNotifications } from "@/lib/forum-notifications";
import { getDb } from "@/lib/prisma";

export async function createThreadReport(input: {
  threadId: string;
  reportedById: string;
  reportedByRole: CourseRole;
  reason: string;
}) {
  const existing = await getDb().forumReport.findFirst({
    where: {
      threadId: input.threadId,
      reportedById: input.reportedById,
      status: "OPEN"
    }
  });

  if (existing) {
    return existing;
  }

  const threadContextRecord = await getThreadContext(input.threadId);

  if (!threadContextRecord) {
    throw new Error("El hilo no existe.");
  }

  const threadContext = toThreadContext(threadContextRecord);
  const report = await getDb().forumReport.create({
    data: {
      threadId: input.threadId,
      reportedById: input.reportedById,
      reason: input.reason
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    actorId: input.reportedById,
    actorRole: input.reportedByRole,
    action: "REPORT_CREATED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle,
      reason: input.reason
    }
  });

  return report;
}

export async function createPostReport(input: {
  postId: string;
  reportedById: string;
  reportedByRole: CourseRole;
  reason: string;
}) {
  const existing = await getDb().forumReport.findFirst({
    where: {
      postId: input.postId,
      reportedById: input.reportedById,
      status: "OPEN"
    }
  });

  if (existing) {
    return existing;
  }

  const postContextRecord = await getPostContext(input.postId);

  if (!postContextRecord) {
    throw new Error("La respuesta no existe.");
  }

  const postContext = toPostContext(postContextRecord);
  const report = await getDb().forumReport.create({
    data: {
      postId: input.postId,
      reportedById: input.reportedById,
      reason: input.reason
    }
  });

  await writeForumAuditLog({
    courseSlug: postContext.courseSlug,
    forumSpaceId: postContext.forumSpaceId,
    threadId: postContext.threadId,
    postId: postContext.postId,
    actorId: input.reportedById,
    actorRole: input.reportedByRole,
    action: "REPORT_CREATED",
    metadata: {
      categorySlug: postContext.categorySlug,
      threadTitle: postContext.threadTitle,
      reason: input.reason
    }
  });

  return report;
}

export async function resolveForumReport(input: {
  reportId: string;
  status: "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";
  actorId: string;
  actorRole: CourseRole;
}) {
  const reportContext = await getReportContext(input.reportId);

  if (!reportContext) {
    throw new Error("El reporte no existe.");
  }

  const threadContext = reportContext.thread
    ? {
        threadId: reportContext.thread.id,
        threadTitle: reportContext.thread.title,
        categorySlug: reportContext.thread.category.slug,
        categoryTitle: reportContext.thread.category.title,
        courseSlug: reportContext.thread.category.courseSlug,
        forumSpaceId: reportContext.thread.category.forumSpaceId
      }
    : reportContext.post
      ? {
          threadId: reportContext.post.thread.id,
          threadTitle: reportContext.post.thread.title,
          categorySlug: reportContext.post.thread.category.slug,
          categoryTitle: reportContext.post.thread.category.title,
          courseSlug: reportContext.post.thread.category.courseSlug,
          forumSpaceId: reportContext.post.thread.category.forumSpaceId
        }
      : null;

  if (!threadContext) {
    throw new Error("El reporte no tiene contexto de foro asociado.");
  }

  const report = await getDb().forumReport.update({
    where: {
      id: input.reportId
    },
    data: {
      status: input.status,
      resolvedAt: new Date(),
      resolvedById: input.actorId
    }
  });

  await writeForumAuditLog({
    courseSlug: threadContext.courseSlug,
    forumSpaceId: threadContext.forumSpaceId,
    threadId: threadContext.threadId,
    postId: reportContext.post?.id ?? null,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.status === "DISMISSED" ? "REPORT_DISMISSED" : "REPORT_REVIEWED",
    metadata: {
      categorySlug: threadContext.categorySlug,
      threadTitle: threadContext.threadTitle,
      reason: reportContext.reason,
      reportStatus: input.status
    }
  });

  if (reportContext.reportedById !== input.actorId) {
    const statusCopy =
      input.status === "DISMISSED"
        ? {
            title: "Tu reporte ha sido descartado",
            body: `El equipo docente ha revisado el reporte sobre "${threadContext.threadTitle}" y lo ha descartado.`
          }
        : input.status === "ACTION_TAKEN"
          ? {
              title: "Tu reporte ha sido resuelto",
              body: `El equipo docente ha tomado medidas sobre "${threadContext.threadTitle}".`
            }
          : {
              title: "Tu reporte ha sido revisado",
              body: `El equipo docente ha revisado el reporte sobre "${threadContext.threadTitle}".`
            };

    await createForumNotifications([
      {
        userId: reportContext.reportedById,
        courseSlug: threadContext.courseSlug,
        type: "MODERATION_ACTION",
        title: statusCopy.title,
        body: statusCopy.body,
        linkPath: `/mis-cursos/${threadContext.courseSlug}/foro/${threadContext.categorySlug}/${threadContext.threadId}`
      }
    ]);
  }

  return report;
}
