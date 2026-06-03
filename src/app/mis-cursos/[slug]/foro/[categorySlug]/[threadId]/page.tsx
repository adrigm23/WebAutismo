import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  ImageIcon,
  Lock,
  MessageSquare,
  Paperclip,
  PencilLine,
  Pin,
  PinOff,
  PlayCircle,
  Unlock
} from "lucide-react";
import {
  deletePostAction,
  deleteThreadAction,
  reportPostAction,
  reportThreadAction,
  restorePostAction,
  toggleResolvedPostAction,
  toggleThreadClosedAction,
  toggleThreadPinnedAction
} from "@/actions/forum";
import { ThreadReplyForm } from "@/components/forum/thread-reply-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse
} from "@/lib/course-community";
import { isSafeHttpUrl } from "@/lib/file-security";
import { canEditForumContent, getForumThreadById } from "@/lib/forum";
import { getDb } from "@/lib/prisma";
import { cn, formatRelativeTime } from "@/lib/utils";

type ForumThreadPageProps = {
  params: Promise<{ slug: string; categorySlug: string; threadId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params }: ForumThreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Hilo | ${course.title}` : "Hilo",
    robots: {
      index: false,
      follow: false
    }
  };
}

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForumThreadPage({ params, searchParams }: ForumThreadPageProps) {
  const { slug, categorySlug, threadId } = await params;
  const currentPage = Math.max(
    Number.parseInt(firstValue((await searchParams).page) ?? "1", 10) || 1,
    1
  );
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const forumData = await getForumThreadById({
    courseSlug: course.slug,
    categorySlug,
    threadId,
    viewerRole: access.role,
    page: currentPage
  });

  if (!forumData) {
    notFound();
  }

  // Temas relacionados en la misma categoría
  const relatedThreads = await getDb().forumThread.findMany({
    where: {
      categoryId: forumData.category.id,
      id: { not: threadId },
      deletedAt: null,
      publishedAt: { not: null }
    },
    orderBy: { lastActivityAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      _count: { select: { posts: true } }
    }
  });

  const nextPath = `/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`;
  const canModerate = canModerateCourse(access.role);
  const replies = forumData.thread.posts;
  const repliesPagination = forumData.postsPagination;
  const canEditThread = canEditForumContent({
    currentUserId: user.id,
    authorId: forumData.thread.author.id,
    role: access.role,
    createdAt: forumData.thread.createdAt
  });

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
        <Link href={`/mis-cursos/${course.slug}/foro`} className="text-[#43474e] hover:text-[#022448] transition-colors">
          Comunidad
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#74777f]" />
        <Link href={`/mis-cursos/${course.slug}/foro/${categorySlug}`} className="text-[#43474e] hover:text-[#022448] transition-colors">
          {forumData.category.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#74777f]" />
        <span className="text-[#111c2c] font-medium">Hilo</span>
      </nav>

      {/* Two-column layout */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">

        {/* ── Main content ── */}
        <div className="space-y-5">

          {/* ── Thread post ── */}
          <article className="bg-white rounded-xl border border-[#c4c6cf]" style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}>
            {/* Thread header: category badge + title + status badges */}
            <div className="px-6 pt-6 pb-4 border-b border-[#c4c6cf]">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[12px] font-medium bg-[#adf0df] text-[#2c6f62] border border-[#91d3c3]">
                  {forumData.category.title}
                </span>
                {forumData.thread.isPinned && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Pin className="h-3 w-3" /> Fijado
                  </span>
                )}
                {forumData.thread.type === "ANNOUNCEMENT" && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#e7eeff] text-[#022448] border border-[#c4c6cf]">
                    Anuncio
                  </span>
                )}
                {forumData.thread.isResolved && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
                    <CheckCircle2 className="h-3 w-3" /> Resuelto
                  </span>
                )}
                {forumData.thread.isClosed && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                    <Lock className="h-3 w-3" /> Cerrado
                  </span>
                )}
                <span className="ml-auto text-xs text-[#74777f]">
                  {forumData.thread.isClosed ? "Cerrado" : forumData.thread.isResolved ? "Resuelto" : "Abierto"}
                </span>
              </div>
              <h1 className="text-2xl md:text-[28px] font-bold text-[#111c2c] leading-tight mb-1">
                {forumData.thread.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-[#74777f]">
                <span>{repliesPagination.totalItems} respuesta{repliesPagination.totalItems !== 1 ? "s" : ""}</span>
                {canEditThread && (
                  <>
                    <span>·</span>
                    <Link
                      href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}/editar`}
                      className="flex items-center gap-1 text-[#022448] hover:underline"
                    >
                      <PencilLine className="h-3.5 w-3.5" /> Editar
                    </Link>
                  </>
                )}
                <Link
                  href={`/mis-cursos/${course.slug}/foro/${categorySlug}`}
                  className="ml-auto text-[#43474e] hover:text-[#022448] transition-colors"
                >
                  Volver a la categoría
                </Link>
              </div>
            </div>

            {/* Author + body */}
            <div className="px-6 py-5">
              {/* Author row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    canModerateCourse(forumData.thread.authorRole)
                      ? "bg-[#adf0df] text-[#2c6f62] border border-[#91d3c3]"
                      : "bg-[#e7eeff] text-[#022448] border border-[#c4c6cf]"
                  )}>
                    {forumData.thread.author.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111c2c]">{forumData.thread.author.name}</p>
                    <p className="text-xs text-[#74777f]">
                      {canModerateCourse(forumData.thread.authorRole) ? "Docente Experto" : "Miembro"}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#74777f] shrink-0 mt-1">
                  {formatRelativeTime(forumData.thread.createdAt)}
                  {forumData.thread.editedAt && ` · editado ${formatRelativeTime(forumData.thread.editedAt)}`}
                </span>
              </div>

              {/* Body */}
              <div className="text-[#111c2c] text-base leading-7 whitespace-pre-line break-words">
                {forumData.thread.body}
              </div>

              {/* Attachments */}
              {forumData.thread.attachments.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {forumData.thread.attachments.map((att) => {
                    const Icon =
                      att.kind === "IMAGE" ? ImageIcon
                      : att.kind === "VIDEO" ? PlayCircle
                      : att.kind === "LINK" ? Paperclip
                      : FileText;
                    const isExternal = (att.kind === "LINK" || att.kind === "VIDEO") && isSafeHttpUrl(att.url);
                    const href =
                      att.kind === "FILE" || att.kind === "IMAGE"
                        ? `/api/forum/attachments/${att.id}`
                        : isExternal
                          ? att.url
                          : null;
                    if (!href) return null;
                    return (
                      <a
                        key={att.id}
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="inline-flex items-center gap-3 rounded-xl border border-[#c4c6cf] bg-[#f8fafc] px-4 py-3 text-sm text-[#111c2c] hover:border-[#022448] hover:bg-white transition-all"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e7eeff] text-[#022448]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{att.label}</p>
                          {att.sizeInBytes && att.kind === "FILE" && (
                            <p className="text-xs text-[#74777f]">
                              {att.sizeInBytes < 1024 * 1024
                                ? `${(att.sizeInBytes / 1024).toFixed(1)} KB`
                                : `${(att.sizeInBytes / (1024 * 1024)).toFixed(1)} MB`}
                              {att.mimeType === "application/pdf" ? " · Documento PDF" : ""}
                            </p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Actions bar */}
              <div className="mt-5 pt-4 border-t border-[#e8e8e8] flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-[#74777f]">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    {repliesPagination.totalItems} respuesta{repliesPagination.totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
                <form action={reportThreadAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <input name="reason" type="hidden" value="Revisar hilo por posible incumplimiento de las normas del foro." />
                  <button type="submit" className="text-xs text-[#74777f] hover:text-[#022448] transition-colors">
                    Reportar hilo
                  </button>
                </form>
              </div>
            </div>
          </article>

          {/* ── Closed/read-only banner ── */}
          {(forumData.thread.isClosed || forumData.thread.isReadOnly) && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <Lock className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                {forumData.thread.isReadOnly
                  ? "Este hilo está en modo solo lectura. El alumnado puede consultarlo, pero no añadir nuevas respuestas."
                  : "Este hilo ha sido cerrado por el equipo docente y ya no admite nuevas respuestas."}
              </p>
            </div>
          )}

          {/* ── Moderator actions ── */}
          {canModerate && (
            <div className="bg-white rounded-xl border border-[#c4c6cf] px-5 py-4" style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#74777f] mb-3">Gestión del hilo</p>
              <div className="flex flex-wrap gap-2">
                <form action={toggleThreadPinnedAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-[#c4c6cf] px-3 py-1.5 text-sm text-[#43474e] hover:border-[#022448] hover:text-[#022448] transition-colors">
                    {forumData.thread.isPinned
                      ? <><PinOff className="h-3.5 w-3.5" /> Quitar fijado</>
                      : <><Pin className="h-3.5 w-3.5" /> Fijar hilo</>}
                  </button>
                </form>
                <form action={toggleThreadClosedAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-[#c4c6cf] px-3 py-1.5 text-sm text-[#43474e] hover:border-[#022448] hover:text-[#022448] transition-colors">
                    {forumData.thread.isClosed
                      ? <><Unlock className="h-3.5 w-3.5" /> Reabrir hilo</>
                      : <><Lock className="h-3.5 w-3.5" /> Cerrar hilo</>}
                  </button>
                </form>
                <form action={deleteThreadAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <ConfirmSubmitButton
                    message="Se eliminará el hilo. ¿Quieres continuar?"
                    pendingLabel="Eliminando..."
                    variant="secondary"
                  >
                    Eliminar hilo
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          )}

          {/* ── Replies ── */}
          {replies.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-[#111c2c] mb-4">
                Respuestas ({repliesPagination.totalItems})
              </h2>
              <div className="space-y-4">
                {replies.map((post) => {
                  const canEditPost = canEditForumContent({
                    currentUserId: user.id,
                    authorId: post.author.id,
                    role: access.role,
                    createdAt: post.createdAt
                  });

                  if (post.deletedAt) {
                    return (
                      <div key={post.id} className="bg-white rounded-xl border border-[#c4c6cf] px-5 py-4">
                        <p className="text-sm text-[#74777f] italic">Esta respuesta ha sido eliminada.</p>
                        {canModerate && (
                          <form action={restorePostAction} className="mt-2">
                            <input name="courseSlug" type="hidden" value={course.slug} />
                            <input name="categorySlug" type="hidden" value={categorySlug} />
                            <input name="threadId" type="hidden" value={threadId} />
                            <input name="postId" type="hidden" value={post.id} />
                            <input name="nextPath" type="hidden" value={nextPath} />
                            <button type="submit" className="text-xs text-[#022448] hover:underline">Restaurar</button>
                          </form>
                        )}
                      </div>
                    );
                  }

                  return (
                    <article
                      key={post.id}
                      id={`post-${post.id}`}
                      className="bg-white rounded-xl border border-[#c4c6cf]"
                      style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}
                    >
                      <div className="px-5 py-5">
                        {/* Author row */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                              canModerateCourse(post.authorRole)
                                ? "bg-[#adf0df] text-[#2c6f62] border border-[#91d3c3]"
                                : "bg-[#e7eeff] text-[#022448] border border-[#c4c6cf]"
                            )}>
                              {post.author.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#111c2c]">{post.author.name}</p>
                              <p className="text-xs text-[#74777f]">
                                {canModerateCourse(post.authorRole) ? "Docente Experto" : "Miembro"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[#74777f]">
                              {formatRelativeTime(post.createdAt)}
                              {post.editedAt ? ` · editado` : ""}
                            </span>
                            {forumData.thread.resolvedPostId === post.id && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#dcfce7] text-[#166534]">
                                <CheckCircle2 className="h-3 w-3" /> Resuelto
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Body */}
                        <div className="text-[#111c2c] text-sm leading-7 whitespace-pre-line break-words">
                          {post.body}
                        </div>

                        {/* Attachments */}
                        {post.attachments.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {post.attachments.map((att) => {
                              const Icon =
                                att.kind === "IMAGE" ? ImageIcon
                                : att.kind === "VIDEO" ? PlayCircle
                                : att.kind === "LINK" ? Paperclip
                                : FileText;
                              const isExternal = (att.kind === "LINK" || att.kind === "VIDEO") && isSafeHttpUrl(att.url);
                              const href =
                                att.kind === "FILE" || att.kind === "IMAGE"
                                  ? `/api/forum/attachments/${att.id}`
                                  : isExternal
                                    ? att.url
                                    : null;
                              if (!href) return null;
                              return (
                                <a
                                  key={att.id}
                                  href={href}
                                  target={isExternal ? "_blank" : undefined}
                                  rel={isExternal ? "noreferrer" : undefined}
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#c4c6cf] bg-[#f8fafc] px-3 py-2 text-sm text-[#111c2c] hover:border-[#022448] transition-all"
                                >
                                  <Icon className="h-4 w-4 text-[#022448]" />
                                  <span className="text-sm font-medium">{att.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Post actions */}
                        <div className="mt-4 pt-3 border-t border-[#e8e8e8] flex flex-wrap items-center gap-3">
                          {canEditPost && (
                            <Link
                              href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}/respuesta/${post.id}/editar`}
                              className="flex items-center gap-1 text-xs text-[#74777f] hover:text-[#022448] transition-colors"
                            >
                              <PencilLine className="h-3.5 w-3.5" /> Editar
                            </Link>
                          )}
                          {canModerate && (
                            <>
                              <form action={toggleResolvedPostAction}>
                                <input name="courseSlug" type="hidden" value={course.slug} />
                                <input name="categorySlug" type="hidden" value={categorySlug} />
                                <input name="threadId" type="hidden" value={threadId} />
                                <input name="postId" type="hidden" value={post.id} />
                                <input name="nextPath" type="hidden" value={nextPath} />
                                <button type="submit" className="flex items-center gap-1 text-xs text-[#74777f] hover:text-[#022448] transition-colors">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {forumData.thread.resolvedPostId === post.id ? "Quitar resolución" : "Marcar resuelto"}
                                </button>
                              </form>
                              <form action={deletePostAction}>
                                <input name="courseSlug" type="hidden" value={course.slug} />
                                <input name="categorySlug" type="hidden" value={categorySlug} />
                                <input name="threadId" type="hidden" value={threadId} />
                                <input name="postId" type="hidden" value={post.id} />
                                <input name="nextPath" type="hidden" value={nextPath} />
                                <ConfirmSubmitButton
                                  message="¿Eliminar esta respuesta?"
                                  pendingLabel="Eliminando..."
                                  variant="secondary"
                                >
                                  Eliminar
                                </ConfirmSubmitButton>
                              </form>
                            </>
                          )}
                          <form action={reportPostAction} className="ml-auto">
                            <input name="courseSlug" type="hidden" value={course.slug} />
                            <input name="categorySlug" type="hidden" value={categorySlug} />
                            <input name="threadId" type="hidden" value={threadId} />
                            <input name="postId" type="hidden" value={post.id} />
                            <input name="nextPath" type="hidden" value={nextPath} />
                            <input name="reason" type="hidden" value="Revisar respuesta por posible incumplimiento." />
                            <button type="submit" className="text-xs text-[#74777f] hover:text-[#022448] transition-colors">
                              Reportar
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {repliesPagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {repliesPagination.page > 1 && (
                    <Link
                      href={`?page=${repliesPagination.page - 1}`}
                      className="px-4 py-2 rounded-lg border border-[#c4c6cf] text-sm text-[#43474e] hover:border-[#022448] hover:text-[#022448] transition-colors"
                    >
                      Anterior
                    </Link>
                  )}
                  <span className="text-sm text-[#74777f]">
                    Página {repliesPagination.page} de {repliesPagination.totalPages}
                  </span>
                  {repliesPagination.page < repliesPagination.totalPages && (
                    <Link
                      href={`?page=${repliesPagination.page + 1}`}
                      className="px-4 py-2 rounded-lg border border-[#c4c6cf] text-sm text-[#43474e] hover:border-[#022448] hover:text-[#022448] transition-colors"
                    >
                      Siguiente
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Reply form ── */}
          {!forumData.thread.isClosed && !forumData.thread.isReadOnly && (
            <div className="bg-white rounded-xl border border-[#c4c6cf]" style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}>
              <div className="px-5 pt-5 pb-1">
                <h3 className="text-base font-semibold text-[#111c2c]">Añadir una respuesta</h3>
              </div>
              <div className="px-5 pb-5 pt-3">
                <ThreadReplyForm
                  courseSlug={course.slug}
                  categorySlug={categorySlug}
                  threadId={threadId}
                />
              </div>
            </div>
          )}

        </div>

        {/* ── Right sidebar ── */}
        <div className="hidden lg:block space-y-4 mt-0">

          {/* Participantes en el debate */}
          <div className="bg-white rounded-xl border border-[#c4c6cf] p-4" style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}>
            <h3 className="text-sm font-semibold text-[#111c2c] mb-3">Participantes en el debate</h3>
            <div className="space-y-3">
              {[
                { id: forumData.thread.author.id, name: forumData.thread.author.name, role: forumData.thread.authorRole, label: "Autor" },
                ...replies
                  .filter((p) => !p.deletedAt && p.author.id !== forumData.thread.author.id)
                  .reduce<Array<{ id: string; name: string; role: typeof forumData.thread.authorRole; label: string }>>((acc, p) => {
                    if (!acc.find((x) => x.id === p.author.id)) {
                      acc.push({
                        id: p.author.id,
                        name: p.author.name,
                        role: p.authorRole,
                        label: canModerateCourse(p.authorRole) ? "Docente Experto" : "Miembro"
                      });
                    }
                    return acc;
                  }, [])
              ].map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    canModerateCourse(participant.role)
                      ? "bg-[#adf0df] text-[#2c6f62] border border-[#91d3c3]"
                      : "bg-[#e7eeff] text-[#022448] border border-[#c4c6cf]"
                  )}>
                    {participant.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111c2c]">{participant.name}</p>
                    <p className="text-xs text-[#74777f]">{participant.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Temas Relacionados */}
          {relatedThreads.length > 0 && (
            <div className="bg-white rounded-xl border border-[#c4c6cf] p-4" style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.03)" }}>
              <h3 className="text-sm font-semibold text-[#111c2c] mb-3">Temas Relacionados</h3>
              <div className="space-y-3">
                {relatedThreads.map((related) => (
                  <Link
                    key={related.id}
                    href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${related.id}`}
                    className="block group"
                  >
                    <p className="text-sm font-medium text-[#111c2c] group-hover:text-[#022448] transition-colors line-clamp-2 leading-snug">
                      {related.title}
                    </p>
                    <p className="text-xs text-[#74777f] mt-1">
                      {forumData.category.title} · {related._count.posts} respuesta{related._count.posts !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
