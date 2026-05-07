"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canModerateCourse, getCourseRoleForUser } from "@/lib/course-community";
import {
  persistForumAttachments,
  prepareForumAttachmentDrafts
} from "@/lib/forum-attachments";
import {
  canEditForumContent,
  archiveCurrentForumSpace,
  createForumReply,
  createForumThread,
  createPostReport,
  createThreadReport,
  deleteArchivedForumSpace,
  deleteForumAttachment,
  getForumThreadById,
  markAllForumNotificationsRead,
  markForumNotificationRead,
  markResolvedPost,
  resolveForumReport,
  restoreArchivedForumSpace,
  restorePost,
  restoreThread,
  setThreadClosed,
  setThreadPinned,
  softDeletePost,
  softDeleteThread,
  updateForumPost,
  updateForumThread,
  unmarkResolvedPost
} from "@/lib/forum";
import { getSafeRedirect } from "@/lib/redirect";

export type ForumFormState = {
  error?: string;
};

const createThreadSchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  title: z.string().min(6, "El titulo debe tener al menos 6 caracteres.").max(140),
  body: z.string().min(12, "Escribe un mensaje con mas contexto.").max(5000),
  threadType: z.enum(["DISCUSSION", "ANNOUNCEMENT"]).optional().default("DISCUSSION"),
  isPinned: z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional(),
  isReadOnly: z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional(),
  scheduledFor: z.string().optional()
});

const createReplySchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  threadId: z.string().min(1),
  body: z.string().min(2, "Escribe una respuesta antes de enviar.").max(5000),
  attachmentLinks: z.string().optional()
});

const editThreadSchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  threadId: z.string().min(1),
  title: z.string().min(6, "El titulo debe tener al menos 6 caracteres.").max(140),
  body: z.string().min(12, "Escribe un mensaje con mas contexto.").max(5000),
  threadType: z.enum(["DISCUSSION", "ANNOUNCEMENT"]).optional().default("DISCUSSION"),
  isPinned: z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional(),
  isReadOnly: z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional(),
  scheduledFor: z.string().optional()
});

const editPostSchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  threadId: z.string().min(1),
  postId: z.string().min(1),
  body: z.string().min(2, "Escribe una respuesta antes de guardar.").max(5000)
});

const moderateThreadSchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  threadId: z.string().min(1),
  nextPath: z.string().min(1)
});

const moderatePostSchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  threadId: z.string().min(1),
  postId: z.string().min(1),
  nextPath: z.string().min(1)
});

const reportSchema = z.object({
  courseSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  threadId: z.string().min(1),
  postId: z.string().optional(),
  reason: z.string().min(4).max(280).default("Revisar contenido por posible incumplimiento."),
  nextPath: z.string().min(1)
});

const notificationSchema = z.object({
  notificationId: z.string().min(1),
  nextPath: z.string().optional()
});

const bulkNotificationsSchema = z.object({
  nextPath: z.string().optional()
});

const historySchema = z.object({
  courseSlug: z.string().min(1),
  forumSpaceId: z.string().min(1).optional(),
  nextPath: z.string().min(1).optional()
});

const moderateReportSchema = z.object({
  courseSlug: z.string().min(1),
  reportId: z.string().min(1),
  outcome: z.enum(["REVIEWED", "DISMISSED", "ACTION_TAKEN"]),
  nextPath: z.string().min(1)
});

const attachmentSchema = z.object({
  courseSlug: z.string().min(1),
  attachmentId: z.string().min(1),
  nextPath: z.string().min(1)
});

async function requireCourseRole(courseSlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/acceder?next=${encodeURIComponent(`/mis-cursos/${courseSlug}`)}`);
  }

  const role = await getCourseRoleForUser({
    userId: user.id,
    email: user.email,
    courseSlug
  });

  if (!role) {
    redirect(`/checkout/${courseSlug}`);
  }

  return { user, role };
}

async function requireAuthenticatedUser(nextPath = "/mi-cuenta") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/acceder?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

function revalidateForumPaths(courseSlug: string, categorySlug: string, threadId?: string) {
  revalidatePath("/mi-cuenta");
  revalidatePath(`/mis-cursos/${courseSlug}`);
  revalidatePath(`/mis-cursos/${courseSlug}/foro`);
  revalidatePath(`/mis-cursos/${courseSlug}/foro/${categorySlug}`);

  if (threadId) {
    revalidatePath(`/mis-cursos/${courseSlug}/foro/${categorySlug}/${threadId}`);
  }

  revalidatePath(`/mis-cursos/${courseSlug}/foro/moderacion`);
  revalidatePath(`/mis-cursos/${courseSlug}/foro/historico`);
}

function revalidateNotificationPath() {
  revalidatePath("/mi-cuenta");
}

function parseScheduledFor(rawValue: string | null | undefined) {
  const value = rawValue?.trim();

  if (!value) {
    return { value: null as Date | null };
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "La fecha de programacion no es valida." };
  }

  return { value: parsedDate };
}

function parseAttachmentDrafts(formData: FormData) {
  try {
    return {
      drafts: prepareForumAttachmentDrafts({
        files: formData.getAll("attachments").filter((item): item is File => item instanceof File),
        resourceLinksText: formData.get("attachmentLinks")?.toString() || ""
      })
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No hemos podido procesar los adjuntos."
    };
  }
}

export async function createForumThreadAction(
  _: ForumFormState,
  formData: FormData
): Promise<ForumFormState> {
  const parsed = createThreadSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    title: formData.get("title"),
    body: formData.get("body"),
    threadType: formData.get("threadType") || "DISCUSSION",
    isPinned: formData.get("isPinned") || undefined,
    isReadOnly: formData.get("isReadOnly") || undefined,
    scheduledFor: formData.get("scheduledFor")?.toString() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Revisa los datos del hilo." };
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (parsed.data.threadType === "ANNOUNCEMENT" && !canModerateCourse(role)) {
    return { error: "Solo el profesorado o la administracion pueden publicar anuncios." };
  }

  const attachmentDrafts = parseAttachmentDrafts(formData);

  if ("error" in attachmentDrafts) {
    return { error: attachmentDrafts.error };
  }

  const scheduledForResult = parseScheduledFor(parsed.data.scheduledFor);

  if ("error" in scheduledForResult) {
    return { error: scheduledForResult.error };
  }

  const thread = await createForumThread({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    authorId: user.id,
    authorRole: role,
    authorName: user.name,
    title: parsed.data.title.trim(),
    body: parsed.data.body.trim(),
    type: parsed.data.threadType,
    isPinned: canModerateCourse(role) && Boolean(parsed.data.isPinned),
    isReadOnly: Boolean(parsed.data.isReadOnly),
    scheduledFor:
      parsed.data.threadType === "ANNOUNCEMENT" ? scheduledForResult.value : null
  });

  await persistForumAttachments({
    courseSlug: parsed.data.courseSlug,
    parentType: "thread",
    parentId: thread.id,
    createdById: user.id,
    attachments: attachmentDrafts.drafts
  });

  const nextPath = `/mis-cursos/${parsed.data.courseSlug}/foro/${parsed.data.categorySlug}/${thread.id}`;
  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, thread.id);
  redirect(nextPath);
}

export async function createForumReplyAction(
  _: ForumFormState,
  formData: FormData
): Promise<ForumFormState> {
  const parsed = createReplySchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    body: formData.get("body"),
    attachmentLinks: formData.get("attachmentLinks")?.toString() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "No hemos podido enviar la respuesta." };
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);
  const threadRecord = await getForumThreadById({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    threadId: parsed.data.threadId,
    viewerRole: role
  });

  if (!threadRecord) {
    return { error: "El hilo no existe o no pertenece a esta categoria." };
  }

  if ((threadRecord.thread.isClosed || threadRecord.thread.isReadOnly) && !canModerateCourse(role)) {
    return { error: "Este hilo no admite nuevas respuestas." };
  }

  const attachmentDrafts = parseAttachmentDrafts(formData);

  if ("error" in attachmentDrafts) {
    return { error: attachmentDrafts.error };
  }

  const post = await createForumReply({
    threadId: parsed.data.threadId,
    authorId: user.id,
    authorRole: role,
    authorName: user.name,
    body: parsed.data.body.trim()
  });

  await persistForumAttachments({
    courseSlug: parsed.data.courseSlug,
    parentType: "post",
    parentId: post.id,
    createdById: user.id,
    attachments: attachmentDrafts.drafts
  });

  const nextPath = `/mis-cursos/${parsed.data.courseSlug}/foro/${parsed.data.categorySlug}/${parsed.data.threadId}`;
  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(nextPath);
}

export async function editForumThreadAction(
  _: ForumFormState,
  formData: FormData
): Promise<ForumFormState> {
  const parsed = editThreadSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    title: formData.get("title"),
    body: formData.get("body"),
    threadType: formData.get("threadType") || "DISCUSSION",
    isPinned: formData.get("isPinned") || undefined,
    isReadOnly: formData.get("isReadOnly") || undefined,
    scheduledFor: formData.get("scheduledFor")?.toString() || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Revisa los datos del hilo." };
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);
  const threadRecord = await getForumThreadById({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    threadId: parsed.data.threadId,
    viewerRole: role
  });

  if (!threadRecord) {
    return { error: "El hilo no existe o no pertenece a esta categoria." };
  }

  if (
    !canEditForumContent({
      currentUserId: user.id,
      authorId: threadRecord.thread.author.id,
      role,
      createdAt: threadRecord.thread.createdAt
    })
  ) {
    return { error: "Ya no tienes permiso para editar este hilo." };
  }

  if (parsed.data.threadType === "ANNOUNCEMENT" && !canModerateCourse(role)) {
    return { error: "Solo el profesorado o la administracion pueden convertir un hilo en anuncio." };
  }

  const attachmentDrafts = parseAttachmentDrafts(formData);

  if ("error" in attachmentDrafts) {
    return { error: attachmentDrafts.error };
  }

  const scheduledForResult = parseScheduledFor(parsed.data.scheduledFor);

  if ("error" in scheduledForResult) {
    return { error: scheduledForResult.error };
  }

  await updateForumThread({
    threadId: parsed.data.threadId,
    title: parsed.data.title.trim(),
    body: parsed.data.body.trim(),
    editorId: user.id,
    editorRole: role,
    editorName: user.name,
    type: canModerateCourse(role) ? parsed.data.threadType : threadRecord.thread.type,
    isPinned: canModerateCourse(role)
      ? Boolean(parsed.data.isPinned)
      : threadRecord.thread.isPinned,
    isReadOnly: canModerateCourse(role)
      ? Boolean(parsed.data.isReadOnly)
      : threadRecord.thread.isReadOnly,
    scheduledFor:
      canModerateCourse(role) && parsed.data.threadType === "ANNOUNCEMENT"
        ? scheduledForResult.value
        : threadRecord.thread.scheduledFor
  });

  await persistForumAttachments({
    courseSlug: parsed.data.courseSlug,
    parentType: "thread",
    parentId: parsed.data.threadId,
    createdById: user.id,
    attachments: attachmentDrafts.drafts
  });

  const nextPath = `/mis-cursos/${parsed.data.courseSlug}/foro/${parsed.data.categorySlug}/${parsed.data.threadId}`;
  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(nextPath);
}

export async function editForumPostAction(
  _: ForumFormState,
  formData: FormData
): Promise<ForumFormState> {
  const parsed = editPostSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    postId: formData.get("postId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "No hemos podido guardar la respuesta." };
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);
  const threadRecord = await getForumThreadById({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    threadId: parsed.data.threadId,
    viewerRole: role
  });

  if (!threadRecord) {
    return { error: "El hilo no existe o no pertenece a esta categoria." };
  }

  const postRecord = threadRecord.thread.posts.find((post) => post.id === parsed.data.postId);

  if (!postRecord || postRecord.deletedAt) {
    return { error: "La respuesta no existe o ya no se puede editar." };
  }

  if (
    !canEditForumContent({
      currentUserId: user.id,
      authorId: postRecord.author.id,
      role,
      createdAt: postRecord.createdAt
    })
  ) {
    return { error: "Ya no tienes permiso para editar esta respuesta." };
  }

  const attachmentDrafts = parseAttachmentDrafts(formData);

  if ("error" in attachmentDrafts) {
    return { error: attachmentDrafts.error };
  }

  await updateForumPost({
    postId: parsed.data.postId,
    body: parsed.data.body.trim(),
    editorId: user.id,
    editorRole: role
  });

  await persistForumAttachments({
    courseSlug: parsed.data.courseSlug,
    parentType: "post",
    parentId: parsed.data.postId,
    createdById: user.id,
    attachments: attachmentDrafts.drafts
  });

  const nextPath = `/mis-cursos/${parsed.data.courseSlug}/foro/${parsed.data.categorySlug}/${parsed.data.threadId}`;
  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(nextPath);
}

export async function toggleThreadPinnedAction(formData: FormData) {
  const parsed = moderateThreadSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  const current = await getForumThreadById({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    threadId: parsed.data.threadId,
    viewerRole: role
  });

  if (!current) {
    return;
  }

  await setThreadPinned({
    threadId: parsed.data.threadId,
    pinned: !current.thread.isPinned,
    actorId: user.id,
    actorRole: role
  });
  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}`));
}

export async function toggleThreadClosedAction(formData: FormData) {
  const parsed = moderateThreadSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  const current = await getForumThreadById({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    threadId: parsed.data.threadId,
    viewerRole: role
  });

  if (!current) {
    return;
  }

  await setThreadClosed({
    threadId: parsed.data.threadId,
    closed: !current.thread.isClosed,
    actorId: user.id,
    actorRole: role
  });
  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}`));
}

export async function reportThreadAction(formData: FormData) {
  const parsed = reportSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    reason: formData.get("reason") || "Revisar contenido por posible incumplimiento.",
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  await createThreadReport({
    threadId: parsed.data.threadId,
    reportedById: user.id,
    reportedByRole: role,
    reason: parsed.data.reason.trim()
  });

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}`));
}

export async function reportPostAction(formData: FormData) {
  const parsed = reportSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    postId: formData.get("postId") || undefined,
    reason: formData.get("reason") || "Revisar contenido por posible incumplimiento.",
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success || !parsed.data.postId) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  await createPostReport({
    postId: parsed.data.postId,
    reportedById: user.id,
    reportedByRole: role,
    reason: parsed.data.reason.trim()
  });

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}`));
}

export async function deleteThreadAction(formData: FormData) {
  const parsed = moderateThreadSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await softDeleteThread({
    threadId: parsed.data.threadId,
    deletedById: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(`/mis-cursos/${parsed.data.courseSlug}/foro/${parsed.data.categorySlug}`);
}

export async function deletePostAction(formData: FormData) {
  const parsed = moderatePostSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    postId: formData.get("postId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await softDeletePost({
    postId: parsed.data.postId,
    deletedById: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}`));
}

export async function toggleResolvedPostAction(formData: FormData) {
  const parsed = moderatePostSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    postId: formData.get("postId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  const current = await getForumThreadById({
    courseSlug: parsed.data.courseSlug,
    categorySlug: parsed.data.categorySlug,
    threadId: parsed.data.threadId,
    viewerRole: role
  });

  if (!current) {
    return;
  }

  if (current.thread.resolvedPostId === parsed.data.postId) {
    await unmarkResolvedPost({
      threadId: parsed.data.threadId,
      actorId: user.id,
      actorRole: role
    });
  } else {
    await markResolvedPost({
      threadId: parsed.data.threadId,
      postId: parsed.data.postId,
      actorId: user.id,
      actorRole: role
    });
  }

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}`));
}

export async function restoreThreadAction(formData: FormData) {
  const parsed = moderateThreadSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await restoreThread({
    threadId: parsed.data.threadId,
    restoredById: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro/moderacion`));
}

export async function restorePostAction(formData: FormData) {
  const parsed = moderatePostSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    categorySlug: formData.get("categorySlug"),
    threadId: formData.get("threadId"),
    postId: formData.get("postId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await restorePost({
    postId: parsed.data.postId,
    restoredById: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, parsed.data.categorySlug, parsed.data.threadId);
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro/moderacion`));
}

export async function resolveForumReportAction(formData: FormData) {
  const parsed = moderateReportSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    reportId: formData.get("reportId"),
    outcome: formData.get("outcome"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await resolveForumReport({
    reportId: parsed.data.reportId,
    status: parsed.data.outcome,
    actorId: user.id,
    actorRole: role
  });

  revalidatePath(`/mis-cursos/${parsed.data.courseSlug}/foro/moderacion`);
  revalidatePath("/mi-cuenta");
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro/moderacion`));
}

export async function deleteForumAttachmentAction(formData: FormData) {
  const parsed = attachmentSchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    attachmentId: formData.get("attachmentId"),
    nextPath: formData.get("nextPath")
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  await deleteForumAttachment({
    attachmentId: parsed.data.attachmentId,
    actorId: user.id,
    actorRole: role
  });

  revalidatePath(parsed.data.nextPath);
  revalidatePath("/mi-cuenta");
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro`));
}

export async function archiveForumSpaceAction(formData: FormData) {
  const parsed = historySchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    nextPath: formData.get("nextPath")?.toString()
  });

  if (!parsed.success) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await archiveCurrentForumSpace({
    courseSlug: parsed.data.courseSlug,
    actorId: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, "general");
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro/historico`));
}

export async function restoreForumSpaceAction(formData: FormData) {
  const parsed = historySchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    forumSpaceId: formData.get("forumSpaceId")?.toString(),
    nextPath: formData.get("nextPath")?.toString()
  });

  if (!parsed.success || !parsed.data.forumSpaceId) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await restoreArchivedForumSpace({
    courseSlug: parsed.data.courseSlug,
    forumSpaceId: parsed.data.forumSpaceId,
    actorId: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, "general");
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro/historico`));
}

export async function deleteForumSpaceAction(formData: FormData) {
  const parsed = historySchema.safeParse({
    courseSlug: formData.get("courseSlug"),
    forumSpaceId: formData.get("forumSpaceId")?.toString(),
    nextPath: formData.get("nextPath")?.toString()
  });

  if (!parsed.success || !parsed.data.forumSpaceId) {
    return;
  }

  const { user, role } = await requireCourseRole(parsed.data.courseSlug);

  if (!canModerateCourse(role)) {
    return;
  }

  await deleteArchivedForumSpace({
    courseSlug: parsed.data.courseSlug,
    forumSpaceId: parsed.data.forumSpaceId,
    actorId: user.id,
    actorRole: role
  });

  revalidateForumPaths(parsed.data.courseSlug, "general");
  redirect(getSafeRedirect(parsed.data.nextPath, `/mis-cursos/${parsed.data.courseSlug}/foro/historico`));
}

export async function markForumNotificationReadAction(formData: FormData) {
  const parsed = notificationSchema.safeParse({
    notificationId: formData.get("notificationId"),
    nextPath: formData.get("nextPath")?.toString()
  });

  if (!parsed.success) {
    return;
  }

  const user = await requireAuthenticatedUser("/mi-cuenta");
  await markForumNotificationRead({
    notificationId: parsed.data.notificationId,
    userId: user.id
  });
  revalidateNotificationPath();
  redirect(getSafeRedirect(parsed.data.nextPath, "/mi-cuenta"));
}

export async function markAllForumNotificationsReadAction(formData: FormData) {
  const parsed = bulkNotificationsSchema.safeParse({
    nextPath: formData.get("nextPath")?.toString()
  });

  if (!parsed.success) {
    return;
  }

  const user = await requireAuthenticatedUser("/mi-cuenta");
  await markAllForumNotificationsRead(user.id);
  revalidateNotificationPath();
  redirect(getSafeRedirect(parsed.data.nextPath, "/mi-cuenta"));
}
