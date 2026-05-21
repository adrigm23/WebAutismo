import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  ImageIcon,
  Lock,
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
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel
} from "@/lib/course-community";
import { isSafeHttpUrl } from "@/lib/file-security";
import { canEditForumContent, getForumThreadById } from "@/lib/forum";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

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
        const isExternal =
          (attachment.kind === "LINK" || attachment.kind === "VIDEO") &&
          isSafeHttpUrl(attachment.url);
        const href =
          attachment.kind === "FILE" || attachment.kind === "IMAGE"
            ? `/api/forum/attachments/${attachment.id}`
            : isExternal
              ? attachment.url
              : null;

        if (!href) {
          return null;
        }

        return (
          <a
            className="inline-flex min-w-0 w-full items-center gap-3 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.1)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] transition hover:border-[rgba(22,60,88,0.16)] hover:bg-[var(--color-brand-soft)] sm:w-auto sm:min-w-[15rem]"
            href={href}
            key={attachment.id}
            rel={isExternal ? "noreferrer" : undefined}
            target={isExternal ? "_blank" : undefined}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
              <Icon className="h-4 w-4" />
            </div>
            <span className="min-w-0 break-words">{attachment.label}</span>
          </a>
        );
      })}
    </div>
  );
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
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Comunidad
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          className="hover:text-[var(--color-primary)]"
          href={`/mis-cursos/${course.slug}/foro/${categorySlug}`}
        >
          {forumData.category.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Hilo</span>
      </div>

      <SurfaceCard className="border-[rgba(22,60,88,0.1)] bg-white/92" padding="md">
        <SectionHeader
          actions={
            <div className="flex flex-wrap gap-3">
              {canEditThread ? (
                <ButtonLink
                  href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}/editar`}
                  variant="subtle"
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  Editar hilo
                </ButtonLink>
              ) : null}
              <ButtonLink href={`/mis-cursos/${course.slug}/foro/${categorySlug}`} variant="subtle">
                Volver a la categoría
              </ButtonLink>
            </div>
          }
          eyebrow={
            <div className="flex flex-wrap items-center gap-2">
              {forumData.thread.isPinned ? <Badge tone="warning">Fijado</Badge> : null}
              {forumData.thread.type === "ANNOUNCEMENT" ? <Badge tone="brand">Anuncio</Badge> : null}
              {forumData.thread.isResolved ? <Badge tone="success">Resuelto</Badge> : null}
              {forumData.thread.isClosed ? <Badge tone="outline">Cerrado</Badge> : null}
              {forumData.thread.isReadOnly ? <Badge tone="outline">Solo lectura</Badge> : null}
              <Badge tone={canModerateCourse(forumData.thread.authorRole) ? "info" : "warning"}>
                {getRoleLabel(forumData.thread.authorRole)}
              </Badge>
            </div>
          }
          title={forumData.thread.title}
          description={
            <span className="flex flex-wrap items-center gap-2.5 text-sm text-[var(--color-muted)]">
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
            </span>
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[rgba(248,245,239,0.82)] px-3 py-1.5 font-medium text-[var(--color-ink-soft)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-muted)]" />
            <span>{repliesPagination.totalItems} respuestas</span>
          </div>
          <span className="text-[var(--color-muted)]">
            Estado:{" "}
            {forumData.thread.isClosed
              ? "Cerrado"
              : forumData.thread.isResolved
                ? "Resuelto"
                : "Abierto"}
          </span>
        </div>

        <div className="mt-5 border-t border-[rgba(22,60,88,0.08)] pt-5">
          <div className="whitespace-pre-line break-words text-base leading-8 text-[var(--color-ink)] sm:text-lg sm:leading-9">
            {forumData.thread.body}
          </div>
          <AttachmentList attachments={forumData.thread.attachments} />
        </div>

        {forumData.thread.isClosed || forumData.thread.isReadOnly ? (
          <StateBanner
            className="mt-6"
            description={
              forumData.thread.isReadOnly
                ? "Este hilo está en modo solo lectura. El alumnado puede consultarlo, pero no añadir nuevas respuestas."
                : "Este hilo ha sido cerrado por el equipo docente y ya no admite nuevas respuestas."
            }
            icon={<Lock className="h-5 w-5" />}
            tone="warning"
          />
        ) : null}

        <div className="mt-5 flex flex-wrap gap-4 text-sm">
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
            <Button className="px-0 text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]" type="submit" variant="subtle">
              Reportar hilo
            </Button>
          </form>
        </div>
      </SurfaceCard>

      {canModerate ? (
        <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-[rgba(255,255,255,0.82)]" padding="md" variant="muted">
          <SectionHeader
            description="Las acciones de moderación siguen disponibles, pero se mantienen fuera del flujo principal de lectura y respuesta."
            size="md"
            title="Gestión del hilo"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={toggleThreadPinnedAction}>
              <input name="courseSlug" type="hidden" value={course.slug} />
              <input name="categorySlug" type="hidden" value={categorySlug} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="nextPath" type="hidden" value={nextPath} />
              <Button type="submit" variant="subtle">
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
              <Button type="submit" variant="subtle">
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
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90 p-0">
        <div className="px-5 py-5 sm:px-6">
          <SectionHeader
            description="Ordenadas cronológicamente para seguir el hilo con el menor ruido posible."
            size="md"
            title={`Respuestas (${repliesPagination.totalItems})`}
          />
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Página {repliesPagination.page} de {repliesPagination.totalPages}
          </p>
        </div>

        {replies.length ? (
          <div className="divide-y divide-[rgba(22,60,88,0.08)]">
            {replies.map((post) => {
              const isResolved = forumData.thread.resolvedPostId === post.id;
              const canEditPost = canEditForumContent({
                currentUserId: user.id,
                authorId: post.author.id,
                role: access.role,
                createdAt: post.createdAt
              });

              return (
                <article
                  className={cn(
                    "px-5 py-4 sm:px-6 sm:py-5",
                    isResolved && "bg-[rgba(255,182,6,0.06)]",
                    post.deletedAt && "bg-[rgba(248,245,239,0.9)]"
                  )}
                  key={post.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--color-ink)] sm:text-lg">{post.author.name}</span>
                    <Badge tone={canModerateCourse(post.authorRole) ? "info" : "warning"}>
                      {getRoleLabel(post.authorRole)}
                    </Badge>
                    {isResolved ? (
                      <Badge tone="success">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Solución útil
                      </Badge>
                    ) : null}
                    <span className="text-sm text-[var(--color-muted)]">
                      {formatRelativeTime(post.createdAt)}
                    </span>
                    {post.editedAt ? (
                      <span className="text-sm text-[var(--color-muted)]">• editado {formatRelativeTime(post.editedAt)}</span>
                    ) : null}
                  </div>

                  <div className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-[var(--color-ink)] sm:text-base sm:leading-8">
                    {post.deletedAt
                      ? "Mensaje eliminado por moderación. Se conserva el rastro para auditoría del hilo."
                      : post.body}
                  </div>

                  {!post.deletedAt ? <AttachmentList attachments={post.attachments} /> : null}

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {canEditPost && !post.deletedAt ? (
                      <ButtonLink
                        className="px-0 text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
                        href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${threadId}/respuesta/${post.id}/editar`}
                        variant="subtle"
                      >
                        <PencilLine className="mr-1.5 h-4 w-4" />
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
                        <Button className="px-0 text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]" type="submit" variant="subtle">
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
                          <Button className="px-0 text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]" type="submit" variant="subtle">
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
                        <Button className="px-0 text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]" type="submit" variant="subtle">
                          Restaurar respuesta
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            align="center"
            description="Este hilo todavía no tiene respuestas. Puedes abrir la conversación desde el composer inferior."
            title="Todavía no hay respuestas"
          />
        )}
      </SurfaceCard>

      {repliesPagination.totalPages > 1 ? (
        <StateBanner
          actions={
            <div className="flex flex-wrap gap-3">
              {repliesPagination.hasPreviousPage ? (
                <ButtonLink href={`${nextPath}?page=${repliesPagination.page - 1}`} variant="neutral">
                  Página anterior
                </ButtonLink>
              ) : null}
              {repliesPagination.hasNextPage ? (
                <ButtonLink href={`${nextPath}?page=${repliesPagination.page + 1}`} variant="neutral">
                  Página siguiente
                </ButtonLink>
              ) : null}
            </div>
          }
          description={`Mostrando página ${repliesPagination.page} de ${repliesPagination.totalPages}.`}
          tone="info"
        />
      ) : null}

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90" padding="md">
        <SectionHeader
          description="Responde con contexto y deja claro a qué parte del hilo haces referencia."
          size="md"
          title="Añadir respuesta"
        />

        <div className="mt-5">
          <ThreadReplyForm
            categorySlug={categorySlug}
            courseSlug={course.slug}
            disabled={(forumData.thread.isClosed || forumData.thread.isReadOnly) && !canModerate}
            threadId={threadId}
          />
        </div>
      </SurfaceCard>
    </div>
  );
}
