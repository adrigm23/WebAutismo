import type { ForumAuditAction } from "@prisma/client";
import type { CourseRole } from "@/lib/course-roles";
import { getDb } from "@/lib/prisma";

export function safeParseMetadata(metadataJson: string | null) {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function getAuditSummary(action: ForumAuditAction, metadataJson: string | null) {
  const metadata = safeParseMetadata(metadataJson);
  const threadTitle =
    typeof metadata?.threadTitle === "string" ? metadata.threadTitle : "contenido del foro";

  switch (action) {
    case "THREAD_CREATED":
      return `Hilo creado: ${threadTitle}`;
    case "THREAD_PINNED":
      return `Hilo fijado: ${threadTitle}`;
    case "THREAD_UNPINNED":
      return `Hilo desfijado: ${threadTitle}`;
    case "THREAD_CLOSED":
      return `Hilo cerrado: ${threadTitle}`;
    case "THREAD_REOPENED":
      return `Hilo reabierto: ${threadTitle}`;
    case "THREAD_DELETED":
      return `Hilo eliminado: ${threadTitle}`;
    case "POST_CREATED":
      return `Nueva respuesta en ${threadTitle}`;
    case "POST_DELETED":
      return `Respuesta eliminada en ${threadTitle}`;
    case "POST_MARKED_RESOLVED":
      return `Respuesta marcada como resuelta en ${threadTitle}`;
    case "POST_UNMARKED_RESOLVED":
      return `Marca de resuelta retirada en ${threadTitle}`;
    case "REPORT_CREATED":
      return `Reporte abierto en ${threadTitle}`;
    case "REPORT_REVIEWED":
      return typeof metadata?.reportStatus === "string" && metadata.reportStatus === "ACTION_TAKEN"
        ? `Reporte resuelto con accion en ${threadTitle}`
        : `Reporte revisado en ${threadTitle}`;
    case "REPORT_DISMISSED":
      return `Reporte descartado en ${threadTitle}`;
    case "THREAD_UPDATED":
      return `Hilo actualizado: ${threadTitle}`;
    default:
      return threadTitle;
  }
}

export function buildAuditLinkPath(
  courseSlug: string,
  metadataJson: string | null,
  threadId?: string | null
) {
  const metadata = safeParseMetadata(metadataJson);
  const categorySlug = typeof metadata?.categorySlug === "string" ? metadata.categorySlug : null;

  if (threadId && categorySlug) {
    return `/mis-cursos/${courseSlug}/foro/${categorySlug}/${threadId}`;
  }

  if (categorySlug) {
    return `/mis-cursos/${courseSlug}/foro/${categorySlug}`;
  }

  return `/mis-cursos/${courseSlug}/foro`;
}

export async function writeForumAuditLog(input: {
  courseSlug: string;
  forumSpaceId?: string | null;
  threadId?: string | null;
  postId?: string | null;
  actorId: string;
  actorRole: CourseRole;
  action: ForumAuditAction;
  metadata?: Record<string, unknown>;
}) {
  await getDb().forumAuditLog.create({
    data: {
      courseSlug: input.courseSlug,
      forumSpaceId: input.forumSpaceId ?? null,
      threadId: input.threadId ?? null,
      postId: input.postId ?? null,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
    }
  });
}
