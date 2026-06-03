import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Clock3,
  Pin
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import {
  resolveForumReportAction,
  restorePostAction,
  restoreThreadAction
} from "@/actions/forum";
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
import { getForumModerationDashboard } from "@/lib/forum";
import { formatCompactNumber, formatDateTime, formatRelativeTime } from "@/lib/utils";

type ForumModerationPageProps = {
  params: Promise<{ slug: string }>;
};

type ReportOutcome = "ACTION_TAKEN" | "REVIEWED" | "DISMISSED";

export async function generateMetadata({
  params
}: ForumModerationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Moderación del foro | ${course.title}` : "Moderación del foro",
    robots: {
      index: false,
      follow: false
    }
  };
}

function ReportResolutionForm({
  courseSlug,
  reportId,
  outcome,
  children,
  variant = "subtle"
}: {
  courseSlug: string;
  reportId: string;
  outcome: ReportOutcome;
  children: ReactNode;
  variant?: "primary" | "subtle";
}) {
  return (
    <form action={resolveForumReportAction}>
      <input name="courseSlug" type="hidden" value={courseSlug} />
      <input name="reportId" type="hidden" value={reportId} />
      <input name="outcome" type="hidden" value={outcome} />
      <input
        name="nextPath"
        type="hidden"
        value={`/mis-cursos/${courseSlug}/foro/moderacion`}
      />
      {outcome === "DISMISSED" ? (
        <ConfirmSubmitButton
          message="El reporte se marcara como descartado. Quieres continuar?"
          pendingLabel="Descartando..."
          variant={variant}
        >
          {children}
        </ConfirmSubmitButton>
      ) : (
        <Button type="submit" variant={variant}>
          {children}
        </Button>
      )}
    </form>
  );
}

export default async function ForumModerationPage({
  params
}: ForumModerationPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/moderacion`);
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

  if (!canModerateCourse(access.role)) {
    redirect(`/mis-cursos/${course.slug}/foro`);
  }

  const dashboard = await getForumModerationDashboard(course.slug);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Comunidad
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Moderacion</span>
      </div>

      <SurfaceCard
        actions={
          <ButtonLink href={`/mis-cursos/${course.slug}/foro`} variant="neutral">
            Volver al foro
          </ButtonLink>
        }
        className="border-[rgba(22,60,88,0.1)] bg-white/90"
        padding="md"
      >
        <SectionHeader
          description="Supervision operativa del foro, revision de reportes, restauracion de contenido y seguimiento de actividad reciente sin salir del contexto de Comunidad V2."
          eyebrow={
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge tone="info">{getRoleLabel(access.role)}</Badge>
              <Badge tone={dashboard.stats.reportCount > 0 ? "warning" : "outline"}>
                {dashboard.stats.reportCount > 0
                  ? `${dashboard.stats.reportCount} reportes abiertos`
                  : "Sin incidencias abiertas"}
              </Badge>
            </span>
          }
          title="Panel de moderación"
        />

        <div className="mt-5 grid gap-3 border-t border-[rgba(22,60,88,0.08)] pt-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total hilos",
              value: formatCompactNumber(dashboard.stats.threadCount),
              icon: <Pin className="h-4 w-4 text-[var(--color-primary)]" />
            },
            {
              label: "Hilos fijados",
              value: String(dashboard.stats.pinnedCount),
              icon: <Pin className="h-4 w-4 text-[var(--color-primary)]" />
            },
            {
              label: "Resueltos",
              value: String(dashboard.stats.resolvedCount),
              icon: <Clock3 className="h-4 w-4 text-[var(--color-success)]" />
            },
            {
              label: "Pendientes",
              value: String(dashboard.stats.reportCount),
              icon: <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
            }
          ].map((metric) => (
            <div
              className="rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.72)] px-4 py-3"
              key={metric.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-1.5 font-premium text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {metric.value}
                  </p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-white/72">
                  {metric.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {dashboard.stats.reportCount > 0 ? (
          <StateBanner
            className="mt-5"
            description="Las incidencias pendientes se resuelven desde esta vista sin alterar permisos, rutas ni el flujo principal del foro."
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="warning"
          />
        ) : null}
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90 p-0">
          <div className="px-5 py-5 sm:px-6">
            <SectionHeader
              description="Revisa el contexto del contenido reportado y resuelve cada incidencia desde la misma cola."
              eyebrow={<Badge tone="warning">{dashboard.openReports.length} abiertos</Badge>}
              size="md"
              title="Cola de reportes"
            />
          </div>

          {dashboard.openReports.length ? (
            <div className="divide-y divide-[rgba(22,60,88,0.08)]">
              {dashboard.openReports.map((report) => {
                const targetTitle = report.thread
                  ? report.thread.title
                  : report.post
                    ? report.post.threadTitle
                    : "Contenido del foro";
                const reviewHref = report.thread
                  ? `/mis-cursos/${course.slug}/foro/${report.thread.categorySlug}/${report.thread.id}`
                  : report.post
                    ? `/mis-cursos/${course.slug}/foro/${report.post.categorySlug}/${report.post.threadId}`
                    : `/mis-cursos/${course.slug}/foro`;
                const targetContext = report.thread
                  ? `Hilo en ${report.thread.categorySlug}`
                  : report.post
                    ? `Respuesta en ${report.post.categorySlug}`
                    : "Foro";

                return (
                  <article className="px-5 py-5 sm:px-6" key={report.id}>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="warning">{report.reason}</Badge>
                        <Badge tone="outline">{targetContext}</Badge>
                        <span className="text-sm text-[var(--color-muted)]">
                          {formatRelativeTime(report.createdAt)}
                        </span>
                      </div>

                      <div className="rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.82)] px-4 py-4">
                        <p className="text-meta-xs font-semibold text-[var(--color-muted)]">
                          Contenido reportado
                        </p>
                        <p className="mt-2 font-premium text-heading-md font-semibold text-[var(--color-ink)]">
                          {targetTitle}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ButtonLink href={reviewHref} variant="neutral">
                          Revisar contenido
                        </ButtonLink>
                        <ReportResolutionForm
                          courseSlug={course.slug}
                          outcome="ACTION_TAKEN"
                          reportId={report.id}
                          variant="primary"
                        >
                          Acción tomada
                        </ReportResolutionForm>
                        <ReportResolutionForm
                          courseSlug={course.slug}
                          outcome="REVIEWED"
                          reportId={report.id}
                        >
                          Marcar revisado
                        </ReportResolutionForm>
                        <ReportResolutionForm
                          courseSlug={course.slug}
                          outcome="DISMISSED"
                          reportId={report.id}
                        >
                          Descartar
                        </ReportResolutionForm>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              align="center"
              className="m-5 sm:m-6"
              description="La cola esta limpia. Los nuevos reportes apareceran aqui sin interrumpir la navegacion del foro."
              title="No hay reportes pendientes"
              tone="subtle"
            />
          )}
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/88" padding="md">
            <SectionHeader
              description="Anuncios preparados para publicarse en esta edicion."
              size="md"
              title="Anuncios programados"
            />

            {dashboard.scheduledAnnouncements.length ? (
              <div className="mt-4 space-y-3">
                {dashboard.scheduledAnnouncements.map((thread) => (
                  <Link
                    className="block rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.76)] px-4 py-4 transition hover:border-[rgba(22,60,88,0.14)] hover:bg-white"
                    href={`/mis-cursos/${course.slug}/foro/${thread.categorySlug}/${thread.id}`}
                    key={thread.id}
                  >
                    <p className="font-semibold text-[var(--color-ink)]">{thread.title}</p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      Se publica {formatDateTime(thread.scheduledFor)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 px-5 py-6"
                description="No hay publicaciones pendientes de programacion en este momento."
                title="Sin anuncios programados"
                tone="subtle"
              />
            )}
          </SurfaceCard>

          <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/88" padding="md">
            <SectionHeader
              description="Trazas recientes para contextualizar decisiones de moderacion y actividad docente."
              size="md"
              title="Registro de actividad"
            />

            {dashboard.recentActivity.length ? (
              <div className="mt-4 space-y-3">
                {dashboard.recentActivity.map((entry) => (
                  <Link
                    className="block rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.08)] bg-[rgba(248,245,239,0.62)] px-4 py-4 transition hover:border-[rgba(22,60,88,0.14)] hover:bg-white"
                    href={entry.linkPath ?? `/mis-cursos/${course.slug}/foro`}
                    key={entry.id}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-white/90">
                        <Clock3
                          className={`h-4 w-4 ${
                            entry.actorRole === "STUDENT"
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-primary)]"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-7 text-[var(--color-ink)]">
                          {entry.summary}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          {formatRelativeTime(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 px-5 py-6"
                description="La actividad reciente aparecera aqui cuando haya acciones relevantes en el foro."
                title="Todavia no hay actividad registrada"
                tone="subtle"
              />
            )}
          </SurfaceCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90 p-0">
          <div className="px-5 py-5 sm:px-6">
            <SectionHeader
              description="Rastro de hilos retirados que todavia pueden devolverse a la conversacion."
              size="md"
              title="Hilos eliminados"
            />
          </div>

          {dashboard.deletedThreads.length ? (
            <div className="divide-y divide-[rgba(22,60,88,0.08)]">
              {dashboard.deletedThreads.map((thread) => (
                <article className="px-5 py-5 sm:px-6" key={thread.id}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{thread.title}</p>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        Eliminado {formatRelativeTime(thread.deletedAt)}
                      </p>
                    </div>
                    <form action={restoreThreadAction}>
                      <input name="courseSlug" type="hidden" value={course.slug} />
                      <input name="categorySlug" type="hidden" value={thread.categorySlug} />
                      <input name="threadId" type="hidden" value={thread.id} />
                      <input
                        name="nextPath"
                        type="hidden"
                        value={`/mis-cursos/${course.slug}/foro/moderacion`}
                      />
                      <Button type="submit" variant="subtle">
                        Restaurar hilo
                      </Button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              className="m-5 sm:m-6"
              description="No hay hilos retirados pendientes de restauracion."
              title="Sin hilos eliminados"
              tone="subtle"
            />
          )}
        </SurfaceCard>

        <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/90 p-0">
          <div className="px-5 py-5 sm:px-6">
            <SectionHeader
              description="Respuestas eliminadas que se pueden recuperar sin abandonar el panel."
              size="md"
              title="Respuestas eliminadas"
            />
          </div>

          {dashboard.deletedPosts.length ? (
            <div className="divide-y divide-[rgba(22,60,88,0.08)]">
              {dashboard.deletedPosts.map((post) => (
                <article className="px-5 py-5 sm:px-6" key={post.id}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{post.threadTitle}</p>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        Eliminada {formatRelativeTime(post.deletedAt)}
                      </p>
                    </div>
                    <form action={restorePostAction}>
                      <input name="courseSlug" type="hidden" value={course.slug} />
                      <input name="categorySlug" type="hidden" value={post.categorySlug} />
                      <input name="threadId" type="hidden" value={post.threadId} />
                      <input name="postId" type="hidden" value={post.id} />
                      <input
                        name="nextPath"
                        type="hidden"
                        value={`/mis-cursos/${course.slug}/foro/moderacion`}
                      />
                      <Button type="submit" variant="subtle">
                        Restaurar respuesta
                      </Button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              className="m-5 sm:m-6"
              description="No hay respuestas retiradas pendientes de revision."
              title="Sin respuestas eliminadas"
              tone="subtle"
            />
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
