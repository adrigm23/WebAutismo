import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  PencilLine,
  CheckCircle2,
  ChevronRight,
  FileText,
  ImageIcon,
  Lock,
  Paperclip,
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
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel
} from "@/lib/course-community";
import { canEditForumContent, getForumThreadById } from "@/lib/forum";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

type ForumThreadPageProps = {
  params: Promise<{ slug: string; categorySlug: string; threadId: string }>;
};

export async function generateMetadata({
  params
}: ForumThreadPageProps): Promise<Metadata> {
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

function AttachmentList({
  attachments
}: {
  attachments: Array<{
    id: string;
    kind: "FILE" | "IMAGE" | "LINK" | "VIDEO";
    label: string;
    url: string;
  }>;
}) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {attachments.map((attachment) => {
        const Icon =
          attachment.kind === "IMAGE"
            ? ImageIcon
            : attachment.kind === "VIDEO"
              ? PlayCircle
              : attachment.kind === "LINK"
                ? Paperclip
                : FileText;
        const isExternal = /^https?:\/\//i.test(attachment.url);
        const href =
          attachment.kind === "FILE" || attachment.kind === "IMAGE"
            ? `/api/forum/attachments/${attachment.id}`
            : attachment.url;

        return (
          <a
            className="flex min-w-[16rem] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] transition hover:border-[var(--color-primary)]"
            href={href}
            key={attachment.id}
            rel={isExternal ? "noreferrer" : undefined}
            target={isExternal ? "_blank" : undefined}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Icon className="h-4 w-4" />
            </div>
            <span className="truncate">{attachment.label}</span>
          </a>
        );
      })}
    </div>
  );
}

export default async function ForumThreadPage({ params }: ForumThreadPageProps) {
  const { slug, categorySlug, threadId } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const forumData = await getForumThreadById({
    courseSlug: course.slug,
    categorySlug,
    threadId,
    viewerRole: access.role
  });

  if (!forumData) {
    notFound();
  }

  const nextPath = `/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}`;
  const canModerate = canModerateCourse(access.role);
  const replies = forumData.thread.posts;
  const canEditThread = canEditForumContent({
    currentUserId: user.id,
    authorId: forumData.thread.author.id,
    role: access.role,
    createdAt: forumData.thread.createdAt
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Foro
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          className="hover:text-[var(--color-primary)]"
          href={`/mis-cursos/${course.slug}/foro/${categorySlug}`}
        >
          {forumData.category.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Detalle</span>
      </div>

      <article className="overflow-hidden rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white shadow-[0_22px_48px_rgba(34,34,33,0.06)]">
        <div
          className={`h-1 ${
            forumData.thread.isResolved
              ? "bg-[linear-gradient(90deg,#ffb606,#f7d986,#0c71c3)]"
              : forumData.thread.type === "ANNOUNCEMENT"
                ? "bg-[linear-gradient(90deg,#ffb606,#f7d986)]"
                : "bg-[linear-gradient(90deg,#0c71c3,#69b4ff)]"
          }`}
        />
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {forumData.thread.isPinned ? <Badge tone="accent">Fijado</Badge> : null}
                {forumData.thread.type === "ANNOUNCEMENT" ? <Badge tone="default">Anuncio</Badge> : null}
                {forumData.thread.isResolved ? <Badge tone="teacher">Resuelto</Badge> : null}
                {forumData.thread.isClosed ? <Badge tone="muted">Cerrado</Badge> : null}
                {forumData.thread.isReadOnly ? <Badge tone="muted">Solo lectura</Badge> : null}
                <Badge tone={canModerateCourse(forumData.thread.authorRole) ? "teacher" : "student"}>
                  {getRoleLabel(forumData.thread.authorRole)}
                </Badge>
              </div>

              <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[3.5rem]">
                {forumData.thread.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                <span>{forumData.thread.author.name}</span>
                <span>•</span>
                <span>{formatRelativeTime(forumData.thread.createdAt)}</span>
                {forumData.thread.type === "ANNOUNCEMENT" &&
                forumData.thread.scheduledFor &&
                !forumData.thread.publishedAt ? (
                  <>
                    <span>•</span>
                    <span>Programado para {formatDateTime(forumData.thread.scheduledFor)}</span>
                  </>
                ) : null}
                {forumData.thread.editedAt ? (
                  <>
                    <span>•</span>
                    <span>Editado {formatRelativeTime(forumData.thread.editedAt)}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#faf8f4] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Respuestas
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  {replies.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#faf8f4] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Estado
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                  {forumData.thread.isClosed
                    ? "Cerrado"
                    : forumData.thread.isResolved
                      ? "Resuelto"
                      : "Abierto"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-[rgba(12,113,195,0.1)] bg-[#fcfbf8] px-6 py-6">
            <div className="whitespace-pre-line text-lg leading-9 text-[var(--color-ink)]">
              {forumData.thread.body}
            </div>
            <AttachmentList attachments={forumData.thread.attachments} />
          </div>

          {forumData.thread.isClosed || forumData.thread.isReadOnly ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#f7f4ef] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
              {forumData.thread.isReadOnly
                ? "Este hilo está en modo solo lectura. El alumnado puede consultarlo, pero no añadir nuevas respuestas."
                : "Este hilo ha sido cerrado por el equipo docente y ya no admite nuevas respuestas."}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {canEditThread ? (
              <ButtonLink
                href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}/editar`}
                variant="ghost"
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Editar hilo
              </ButtonLink>
            ) : null}
            <form action={reportThreadAction}>
              <input name="courseSlug" type="hidden" value={course.slug} />
              <input name="categorySlug" type="hidden" value={categorySlug} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="nextPath" type="hidden" value={nextPath} />
              <input
                name="reason"
                type="hidden"
                value="Revisar hilo por posible incumplimiento de las normas del foro."
              />
              <Button type="submit" variant="ghost">
                Reportar hilo
              </Button>
            </form>

            {canModerate ? (
              <>
                <form action={toggleThreadPinnedAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <Button type="submit" variant="ghost">
                    {forumData.thread.isPinned ? (
                      <>
                        <PinOff className="mr-2 h-4 w-4" />
                        Quitar fijado
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" />
                        Fijar hilo
                      </>
                    )}
                  </Button>
                </form>

                <form action={toggleThreadClosedAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <Button type="submit" variant="ghost">
                    {forumData.thread.isClosed ? (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Reabrir hilo
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Cerrar hilo
                      </>
                    )}
                  </Button>
                </form>

                <form action={deleteThreadAction}>
                  <input name="courseSlug" type="hidden" value={course.slug} />
                  <input name="categorySlug" type="hidden" value={categorySlug} />
                  <input name="threadId" type="hidden" value={threadId} />
                  <input name="nextPath" type="hidden" value={nextPath} />
                  <ConfirmSubmitButton
                    message="Se eliminará el hilo y dejará de estar visible. ¿Quieres continuar?"
                    pendingLabel="Eliminando..."
                    variant="secondary"
                  >
                    Eliminar hilo
                  </ConfirmSubmitButton>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </article>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              Respuestas ({replies.length})
            </h2>
            <p className="mt-2 text-base text-[var(--color-muted)]">
              Ordenadas cronológicamente para seguir el contexto del hilo.
            </p>
          </div>
          <p className="text-sm text-[var(--color-muted)]">Ordenado por: más recientes al final</p>
        </div>

        <div className="space-y-4">
          {replies.length ? (
            replies.map((post) => {
              const isResolved = forumData.thread.resolvedPostId === post.id;
              const canEditPost = canEditForumContent({
                currentUserId: user.id,
                authorId: post.author.id,
                role: access.role,
                createdAt: post.createdAt
              });

              return (
                <article
                  className={`overflow-hidden rounded-[28px] border px-6 py-6 shadow-[0_18px_40px_rgba(34,34,33,0.05)] ${
                    isResolved
                      ? "border-[rgba(255,182,6,0.36)] bg-[rgba(255,182,6,0.1)]"
                      : post.deletedAt
                        ? "border-dashed border-[rgba(12,113,195,0.16)] bg-[#f7f4ef]"
                        : "border-[rgba(12,113,195,0.14)] bg-white"
                  }`}
                  key={post.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-[var(--color-ink)]">
                      {post.author.name}
                    </span>
                    <Badge tone={canModerateCourse(post.authorRole) ? "teacher" : "student"}>
                      {getRoleLabel(post.authorRole)}
                    </Badge>
                    {isResolved ? (
                      <Badge tone="accent">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Solución útil
                      </Badge>
                    ) : null}
                    <span className="text-sm text-[var(--color-muted)]">
                      {formatRelativeTime(post.createdAt)}
                    </span>
                    {post.editedAt ? (
                      <span className="text-sm text-[var(--color-muted)]">
                        · editado {formatRelativeTime(post.editedAt)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 whitespace-pre-line text-base leading-8 text-[var(--color-ink)]">
                    {post.deletedAt
                      ? "Mensaje eliminado por moderación. Se conserva el rastro para auditoría del hilo."
                      : post.body}
                  </div>

                  {!post.deletedAt ? <AttachmentList attachments={post.attachments} /> : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {canEditPost && !post.deletedAt ? (
                      <ButtonLink
                        href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}/respuesta/${post.id}/editar`}
                        variant="ghost"
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar respuesta
                      </ButtonLink>
                    ) : null}
                    {!post.deletedAt ? (
                      <form action={reportPostAction}>
                        <input name="courseSlug" type="hidden" value={course.slug} />
                        <input name="categorySlug" type="hidden" value={categorySlug} />
                        <input name="threadId" type="hidden" value={threadId} />
                        <input name="postId" type="hidden" value={post.id} />
                        <input name="nextPath" type="hidden" value={nextPath} />
                        <input
                          name="reason"
                          type="hidden"
                          value="Revisar respuesta por posible incumplimiento de las normas del foro."
                        />
                        <Button type="submit" variant="ghost">
                          Reportar respuesta
                        </Button>
                      </form>
                    ) : null}

                    {canModerate && !post.deletedAt ? (
                      <>
                        <form action={toggleResolvedPostAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="categorySlug" type="hidden" value={categorySlug} />
                          <input name="threadId" type="hidden" value={threadId} />
                          <input name="postId" type="hidden" value={post.id} />
                          <input name="nextPath" type="hidden" value={nextPath} />
                          <Button type="submit" variant="ghost">
                            {isResolved ? "Quitar resuelta" : "Marcar resuelta"}
                          </Button>
                        </form>

                        <form action={deletePostAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="categorySlug" type="hidden" value={categorySlug} />
                          <input name="threadId" type="hidden" value={threadId} />
                          <input name="postId" type="hidden" value={post.id} />
                          <input name="nextPath" type="hidden" value={nextPath} />
                          <ConfirmSubmitButton
                            message="Se eliminará la respuesta del hilo. ¿Quieres continuar?"
                            pendingLabel="Eliminando..."
                            variant="secondary"
                          >
                            Eliminar respuesta
                          </ConfirmSubmitButton>
                        </form>
                      </>
                    ) : null}

                    {canModerate && post.deletedAt ? (
                      <form action={restorePostAction}>
                        <input name="courseSlug" type="hidden" value={course.slug} />
                        <input name="categorySlug" type="hidden" value={categorySlug} />
                        <input name="threadId" type="hidden" value={threadId} />
                        <input name="postId" type="hidden" value={post.id} />
                        <input name="nextPath" type="hidden" value={nextPath} />
                        <Button type="submit" variant="ghost">
                          Restaurar respuesta
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-dashed border-[rgba(12,113,195,0.16)] bg-white px-6 py-10 text-[var(--color-muted)]">
              Todavía no hay respuestas en este hilo.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              Añadir respuesta
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              Responde con contexto y deja claro a qué parte del hilo haces referencia.
            </p>
          </div>

          <ButtonLink href={`/mis-cursos/${course.slug}/foro/${categorySlug}`} variant="ghost">
            Volver a la categoría
          </ButtonLink>
        </div>

        <div className="mt-6">
          <ThreadReplyForm
            categorySlug={categorySlug}
            courseSlug={course.slug}
            disabled={(forumData.thread.isClosed || forumData.thread.isReadOnly) && !canModerate}
            threadId={threadId}
          />
        </div>
      </section>
    </div>
  );
}
