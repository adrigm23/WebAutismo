import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronRight, Clock3, Pin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import {
  resolveForumReportAction,
  restorePostAction,
  restoreThreadAction
} from "@/actions/forum";
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
import { getForumModerationDashboard } from "@/lib/forum";
import { formatCompactNumber, formatDateTime, formatRelativeTime } from "@/lib/utils";

type ForumModerationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: ForumModerationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Moderacion del foro | ${course.title}` : "Moderacion del foro",
    robots: {
      index: false,
      follow: false
    }
  };
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
    courseSlug: course.slug
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  if (!canModerateCourse(access.role)) {
    redirect(`/mis-cursos/${course.slug}/foro`);
  }

  const dashboard = await getForumModerationDashboard(course.slug);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`}>
          Foro
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Moderacion</span>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge tone="teacher">{getRoleLabel(access.role)}</Badge>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4rem]">
            Panel de moderacion
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            Supervision operativa del foro, cola de reportes, restauracion de contenido y
            seguimiento de actividad.
          </p>
        </div>

        <ButtonLink href={`/mis-cursos/${course.slug}/foro`} variant="secondary">
          Volver al foro
        </ButtonLink>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-[rgba(12,113,195,0.16)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Total hilos
            </p>
            <Pin className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {formatCompactNumber(dashboard.stats.threadCount)}
          </p>
        </div>

        <div className="rounded-[28px] border border-[rgba(46,163,242,0.2)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Hilos fijados
            </p>
            <Pin className="h-5 w-5 text-[var(--color-secondary)]" />
          </div>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {dashboard.stats.pinnedCount}
          </p>
        </div>

        <div className="rounded-[28px] border border-[rgba(10,109,84,0.18)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Resueltos
            </p>
            <Clock3 className="h-5 w-5 text-[var(--color-success)]" />
          </div>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
            {dashboard.stats.resolvedCount}
          </p>
        </div>

        <div className="rounded-[28px] border border-[rgba(195,37,12,0.12)] bg-[rgba(255,226,221,0.72)] px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d2c15]">
              Reportes pendientes
            </p>
            <AlertTriangle className="h-5 w-5 text-[#b43816]" />
          </div>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[#8d2c15]">
            {dashboard.stats.reportCount}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="overflow-hidden rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(12,113,195,0.1)] px-6 py-5">
            <div>
              <h2 className="text-[2.1rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Cola de reportes
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {dashboard.openReports.length} reportes abiertos en esta edicion
              </p>
            </div>
            <Badge tone="accent">{dashboard.stats.reportCount} pendientes</Badge>
          </div>

          <div className="space-y-5 px-6 py-6">
            {dashboard.openReports.length ? (
              dashboard.openReports.map((report) => (
                <div
                  className="rounded-[26px] border border-[rgba(12,113,195,0.14)] bg-[#fcfbf8] px-5 py-5"
                  key={report.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{report.reason}</Badge>
                      <span className="text-sm text-[var(--color-muted)]">
                        {report.thread
                          ? `Reportado en ${report.thread.categorySlug}`
                          : report.post
                            ? `Reportado en ${report.post.categorySlug}`
                            : "Foro"}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--color-muted)]">
                      {formatRelativeTime(report.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[22px] border-l-4 border-[rgba(12,113,195,0.18)] bg-white px-4 py-4 text-lg italic leading-8 text-[var(--color-ink)]">
                    {report.thread
                      ? report.thread.title
                      : report.post
                        ? report.post.threadTitle
                        : "Contenido del foro"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {report.thread ? (
                      <>
                        <ButtonLink
                          href={`/mis-cursos/${course.slug}/foro/${report.thread.categorySlug}/${report.thread.id}`}
                          variant="secondary"
                        >
                          Revisar hilo
                        </ButtonLink>
                        <form action={resolveForumReportAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="outcome" type="hidden" value="ACTION_TAKEN" />
                          <input
                            name="nextPath"
                            type="hidden"
                            value={`/mis-cursos/${course.slug}/foro/moderacion`}
                          />
                          <Button type="submit" variant="primary">
                            Accion tomada
                          </Button>
                        </form>
                        <form action={resolveForumReportAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="outcome" type="hidden" value="REVIEWED" />
                          <input
                            name="nextPath"
                            type="hidden"
                            value={`/mis-cursos/${course.slug}/foro/moderacion`}
                          />
                          <Button type="submit" variant="ghost">
                            Marcar revisado
                          </Button>
                        </form>
                        <form action={resolveForumReportAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="outcome" type="hidden" value="DISMISSED" />
                          <input
                            name="nextPath"
                            type="hidden"
                            value={`/mis-cursos/${course.slug}/foro/moderacion`}
                          />
                          <ConfirmSubmitButton
                            message="El reporte se marcara como descartado. Quieres continuar?"
                            pendingLabel="Descartando..."
                            variant="ghost"
                          >
                            Descartar
                          </ConfirmSubmitButton>
                        </form>
                      </>
                    ) : report.post ? (
                      <>
                        <ButtonLink
                          href={`/mis-cursos/${course.slug}/foro/${report.post.categorySlug}/${report.post.threadId}`}
                          variant="secondary"
                        >
                          Revisar respuesta
                        </ButtonLink>
                        <form action={resolveForumReportAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="outcome" type="hidden" value="ACTION_TAKEN" />
                          <input
                            name="nextPath"
                            type="hidden"
                            value={`/mis-cursos/${course.slug}/foro/moderacion`}
                          />
                          <Button type="submit" variant="primary">
                            Accion tomada
                          </Button>
                        </form>
                        <form action={resolveForumReportAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="outcome" type="hidden" value="REVIEWED" />
                          <input
                            name="nextPath"
                            type="hidden"
                            value={`/mis-cursos/${course.slug}/foro/moderacion`}
                          />
                          <Button type="submit" variant="ghost">
                            Marcar revisado
                          </Button>
                        </form>
                        <form action={resolveForumReportAction}>
                          <input name="courseSlug" type="hidden" value={course.slug} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <input name="outcome" type="hidden" value="DISMISSED" />
                          <input
                            name="nextPath"
                            type="hidden"
                            value={`/mis-cursos/${course.slug}/foro/moderacion`}
                          />
                          <ConfirmSubmitButton
                            message="El reporte se marcara como descartado. Quieres continuar?"
                            pendingLabel="Descartando..."
                            variant="ghost"
                          >
                            Descartar
                          </ConfirmSubmitButton>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[#fcfbf8] px-5 py-8 text-[var(--color-muted)]">
                No hay reportes pendientes.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Anuncios programados
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard.scheduledAnnouncements.length ? (
                dashboard.scheduledAnnouncements.map((thread) => (
                  <Link
                    className="block rounded-[22px] border border-[rgba(12,113,195,0.12)] bg-[#fcfbf8] px-4 py-4 transition hover:border-[var(--color-primary)]"
                    href={`/mis-cursos/${course.slug}/foro/${thread.categorySlug}/${thread.id}`}
                    key={thread.id}
                  >
                    <p className="font-semibold text-[var(--color-ink)]">{thread.title}</p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      Se publica {formatDateTime(thread.scheduledFor)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] px-4 py-4 text-sm text-[var(--color-muted)]">
                  No hay anuncios programados.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Registro de actividad
              </h2>
            </div>
            <div className="mt-5 space-y-5">
              {dashboard.recentActivity.length ? (
                dashboard.recentActivity.map((entry) => (
                  <Link
                    className="relative block border-l-2 border-[rgba(12,113,195,0.16)] pl-5"
                    href={entry.linkPath ?? `/mis-cursos/${course.slug}/foro`}
                    key={entry.id}
                  >
                    <span
                      className={`absolute -left-[0.4rem] top-1 block h-3 w-3 rounded-full ${
                        entry.actorRole === "STUDENT" ? "bg-[var(--color-accent)]" : "bg-[var(--color-primary)]"
                      }`}
                    />
                    <p className="text-base leading-7 text-[var(--color-ink)]">{entry.summary}</p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] px-4 py-4 text-sm text-[var(--color-muted)]">
                  Todavia no hay actividad registrada.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Hilos eliminados
          </h2>
          <div className="mt-5 space-y-4">
            {dashboard.deletedThreads.length ? (
              dashboard.deletedThreads.map((thread) => (
                <div
                  className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#fcfbf8] px-5 py-4"
                  key={thread.id}
                >
                  <p className="font-semibold text-[var(--color-ink)]">{thread.title}</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Eliminado {formatRelativeTime(thread.deletedAt)}
                  </p>
                  <form action={restoreThreadAction} className="mt-4">
                    <input name="courseSlug" type="hidden" value={course.slug} />
                    <input name="categorySlug" type="hidden" value={thread.categorySlug} />
                    <input name="threadId" type="hidden" value={thread.id} />
                    <input
                      name="nextPath"
                      type="hidden"
                      value={`/mis-cursos/${course.slug}/foro/moderacion`}
                    />
                    <Button type="submit" variant="ghost">
                      Restaurar hilo
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] px-4 py-4 text-sm text-[var(--color-muted)]">
                No hay hilos eliminados pendientes.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)]">
          <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Respuestas eliminadas
          </h2>
          <div className="mt-5 space-y-4">
            {dashboard.deletedPosts.length ? (
              dashboard.deletedPosts.map((post) => (
                <div
                  className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-[#fcfbf8] px-5 py-4"
                  key={post.id}
                >
                  <p className="font-semibold text-[var(--color-ink)]">{post.threadTitle}</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Eliminada {formatRelativeTime(post.deletedAt)}
                  </p>
                  <form action={restorePostAction} className="mt-4">
                    <input name="courseSlug" type="hidden" value={course.slug} />
                    <input name="categorySlug" type="hidden" value={post.categorySlug} />
                    <input name="threadId" type="hidden" value={post.threadId} />
                    <input name="postId" type="hidden" value={post.id} />
                    <input
                      name="nextPath"
                      type="hidden"
                      value={`/mis-cursos/${course.slug}/foro/moderacion`}
                    />
                    <Button type="submit" variant="ghost">
                      Restaurar respuesta
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] px-4 py-4 text-sm text-[var(--color-muted)]">
                No hay respuestas eliminadas pendientes.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
