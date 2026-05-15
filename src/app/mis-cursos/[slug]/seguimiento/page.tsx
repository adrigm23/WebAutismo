import type { Metadata } from "next";
import type { CourseEnrollmentStatus } from "@prisma/client";
import { BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseExerciseReviewForm } from "@/components/learning/course-exercise-review-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunityForCourse,
  canModerateCourse,
  getRoleLabel
} from "@/lib/course-community";
import { getEnrollmentAccessState } from "@/lib/course-editions";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getLearnerProgressRowsForCatalogCourse } from "@/lib/course-progress";
import { getCampusResources } from "@/lib/course-resources";
import { getDb } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

type TrackingPageProps = {
  params: Promise<{ slug: string }>;
};

function TrackingStat(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="px-5 py-5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
        {input.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{input.detail}</p>
    </Card>
  );
}

export async function generateMetadata({
  params
}: TrackingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Seguimiento | ${course.title}` : "Seguimiento",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function CourseTrackingPage({ params }: TrackingPageProps) {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${slug}/seguimiento`);
  const access = await canAccessCourseCommunityForCourse({
    userId: user.id,
    email: user.email,
    course,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  if (!access.allowed) {
    redirect(`/checkout/${slug}`);
  }

  if (
    !canViewCourseProgress({
      globalRole: user.globalRole,
      viewerRole: access.role
    })
  ) {
    redirect(`/mis-cursos/${slug}`);
  }

  const canModerate = canModerateCourse(access.role);
  let progressRows = [] as Awaited<ReturnType<typeof getLearnerProgressRowsForCatalogCourse>>;
  let exerciseResources = [] as Awaited<ReturnType<typeof getCampusResources>>;
  let enrollments: Array<{
    userId: string;
    status: CourseEnrollmentStatus;
    accessStartsAt: Date;
    accessUntil: Date | null;
    user: { id: string };
  }> = [];
  const exerciseResourcesPromise = getCampusResources({
    course,
    viewerUserId: user.id,
    canModerate
  }).then((resources) => resources.filter((resource) => resource.isManaged && resource.isExercise));

  try {
    [progressRows, enrollments, exerciseResources] = await Promise.all([
      getLearnerProgressRowsForCatalogCourse(course),
      getDb().courseEnrollment.findMany({
        where: {
          course: {
            slug
          }
        },
        include: {
          user: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      exerciseResourcesPromise
    ]);
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    [progressRows, exerciseResources] = await Promise.all([
      getLearnerProgressRowsForCatalogCourse(course),
      exerciseResourcesPromise
    ]);
  }

  const latestEnrollmentByUser = new Map<string, (typeof enrollments)[number]>();

  for (const enrollment of enrollments) {
    if (!latestEnrollmentByUser.has(enrollment.userId)) {
      latestEnrollmentByUser.set(enrollment.userId, enrollment);
    }
  }

  const submissionStudentIds = new Set<string>();
  const exerciseSummary = exerciseResources.reduce(
    (summary, resource) => {
      summary.exercises += 1;
      summary.submissions += resource.submissions.length;
      summary.pending += resource.submissions.filter((submission) => submission.status === "SUBMITTED").length;
      summary.reviewed += resource.submissions.filter((submission) => submission.status === "REVIEWED").length;
      summary.changesRequested += resource.submissions.filter(
        (submission) => submission.status === "CHANGES_REQUESTED"
      ).length;

      for (const submission of resource.submissions) {
        submissionStudentIds.add(submission.studentId);
      }

      return summary;
    },
    {
      exercises: 0,
      submissions: 0,
      pending: 0,
      reviewed: 0,
      changesRequested: 0
    }
  );

  const learnerExerciseRows = Array.from(
    exerciseResources
      .flatMap((resource) =>
        resource.submissions.map((submission) => ({
          resourceTitle: resource.title,
          resourceModuleTitle: resource.moduleTitle,
          submission
        }))
      )
      .reduce(
        (acc, entry) => {
          const current = acc.get(entry.submission.studentId) ?? {
            userId: entry.submission.studentId,
            learnerName: entry.submission.studentName,
            learnerEmail: entry.submission.studentEmail,
            submissionCount: 0,
            reviewedCount: 0,
            changesRequestedCount: 0,
            pendingCount: 0,
            passedCount: 0,
            failedCount: 0,
            scoredCount: 0,
            scoreTotal: 0,
            latestSubmittedAt: null as Date | null,
            latestResourceTitle: null as string | null,
            latestModuleTitle: null as string | null
          };

          current.submissionCount += 1;

          if (entry.submission.status === "REVIEWED") {
            current.reviewedCount += 1;
          } else if (entry.submission.status === "CHANGES_REQUESTED") {
            current.changesRequestedCount += 1;
          } else {
            current.pendingCount += 1;
          }

          if (entry.submission.isPassed === true) {
            current.passedCount += 1;
          } else if (entry.submission.isPassed === false) {
            current.failedCount += 1;
          }

          if (typeof entry.submission.score === "number") {
            current.scoredCount += 1;
            current.scoreTotal += entry.submission.score;
          }

          if (
            !current.latestSubmittedAt ||
            current.latestSubmittedAt.getTime() < entry.submission.submittedAt.getTime()
          ) {
            current.latestSubmittedAt = entry.submission.submittedAt;
            current.latestResourceTitle = entry.resourceTitle;
            current.latestModuleTitle = entry.resourceModuleTitle;
          }

          acc.set(entry.submission.studentId, current);
          return acc;
        },
        new Map<
          string,
          {
            userId: string;
            learnerName: string;
            learnerEmail: string;
            submissionCount: number;
            reviewedCount: number;
            changesRequestedCount: number;
            pendingCount: number;
            passedCount: number;
            failedCount: number;
            scoredCount: number;
            scoreTotal: number;
            latestSubmittedAt: Date | null;
            latestResourceTitle: string | null;
            latestModuleTitle: string | null;
          }
        >()
      )
      .values()
  )
    .map((row) => ({
      ...row,
      averageScore: row.scoredCount ? row.scoreTotal / row.scoredCount : null,
      progressRow: progressRows.find((progressRow) => progressRow.userId === row.userId) ?? null
    }))
    .sort((left, right) =>
      (right.latestSubmittedAt?.getTime() ?? 0) - (left.latestSubmittedAt?.getTime() ?? 0)
    );
  const learnerExerciseByUserId = new Map(
    learnerExerciseRows.map((learnerExerciseRow) => [learnerExerciseRow.userId, learnerExerciseRow] as const)
  );

  return (
    <div className="bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)] pb-20 pt-14 lg:pt-16">
      <div className="site-container space-y-8">
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
          href={`/mis-cursos/${slug}`}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al curso
        </Link>

        <Card className="overflow-hidden border-[rgba(12,113,195,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,238,248,0.82))] p-8 lg:p-9">
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teacher">{getRoleLabel(access.role)}</Badge>
                <Badge tone="muted">Seguimiento academico</Badge>
              </div>
              <h1 className="mt-4 text-[3.35rem] font-semibold leading-[0.98] tracking-[-0.08em] text-[var(--color-ink)]">
                {course.title}
              </h1>
              <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-[var(--color-ink)]/84">
                Aqui puedes revisar tanto el progreso manual por modulo como las entregas reales de
                ejercicios publicadas dentro del campus.
              </p>
            </div>

            <div className="space-y-4">
              <TrackingStat
                detail={exerciseSummary.pending > 0 ? "Entregas que necesitan revision docente." : "Sin bloqueos inmediatos en revision."}
                label="Pendientes"
                value={`${exerciseSummary.pending}`}
              />
              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center rounded-2xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                  href={`/mis-cursos/${slug}`}
                >
                  Ir al campus
                </Link>
                <Link
                  className="inline-flex items-center rounded-2xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                  href={`/mis-cursos/${slug}/foro`}
                >
                  Abrir foro
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TrackingStat
            detail="Personas con trazabilidad de progreso o actividad real."
            label="Alumnado con historial"
            value={`${progressRows.length}`}
          />
          <TrackingStat
            detail="Ejercicios visibles ahora mismo dentro del campus."
            label="Ejercicios publicados"
            value={`${exerciseSummary.exercises}`}
          />
          <TrackingStat
            detail={`${submissionStudentIds.size} alumnos han entregado al menos una vez.`}
            label="Entregas registradas"
            value={`${exerciseSummary.submissions}`}
          />
          <TrackingStat
            detail={`${exerciseSummary.reviewed} revisadas y ${exerciseSummary.changesRequested} con cambios solicitados.`}
            label="Revisiones"
            value={`${exerciseSummary.pending}`}
          />
        </div>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Rendimiento por alumno
            </p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
              Vision consolidada
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              Resume entregas, revisiones y nota media por estudiante para que el seguimiento no
              dependa solo de revisar ejercicio a ejercicio.
            </p>
          </div>

          {learnerExerciseRows.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {learnerExerciseRows.map((row) => (
                <Card className="p-6" key={row.userId}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[1.15rem] font-semibold text-[var(--color-ink)]">
                        {row.learnerName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{row.learnerEmail}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.pendingCount ? <Badge tone="accent">{row.pendingCount} pendientes</Badge> : null}
                      {row.passedCount ? <Badge tone="teacher">{row.passedCount} aprobadas</Badge> : null}
                      {row.failedCount ? <Badge tone="accent">{row.failedCount} no aprobadas</Badge> : null}
                      {row.averageScore !== null ? (
                        <Badge tone="teacher">Media {row.averageScore.toFixed(1)}/10</Badge>
                      ) : (
                        <Badge tone="muted">Sin nota media</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Entregas
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {row.submissionCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Revisadas
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {row.reviewedCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Cambios
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {row.changesRequestedCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Progreso
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {row.progressRow ? `${row.progressRow.completionRate}%` : "N/D"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[var(--color-surface)] px-4 py-4 text-sm leading-7 text-[var(--color-muted)]">
                    <p>
                      Ultima entrega:{" "}
                      <strong className="text-[var(--color-ink)]">
                        {row.latestSubmittedAt ? formatDateTime(row.latestSubmittedAt) : "Sin actividad"}
                      </strong>
                    </p>
                    {row.latestResourceTitle ? (
                      <p className="mt-1">
                        Ejercicio reciente:{" "}
                        <strong className="text-[var(--color-ink)]">{row.latestResourceTitle}</strong>
                        {row.latestModuleTitle ? ` | ${row.latestModuleTitle}` : ""}
                      </p>
                    ) : null}
                    {row.progressRow?.lastCompletedAt ? (
                      <p className="mt-1">
                        Ultimo modulo marcado:{" "}
                        <strong className="text-[var(--color-ink)]">
                          {formatDateTime(row.progressRow.lastCompletedAt)}
                        </strong>
                      </p>
                    ) : null}
                    {row.passedCount || row.failedCount ? (
                      <p className="mt-1">
                        Resultado evaluado:{" "}
                        <strong className="text-[var(--color-ink)]">
                          {row.passedCount} aprobadas
                        </strong>
                        {` y ${row.failedCount} no aprobadas`}
                      </p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-[1.02rem] leading-8 text-[var(--color-muted)]">
              Todavia no hay entregas suficientes para construir un seguimiento consolidado por
              alumno.
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Entregas de ejercicios
              </p>
              <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                Revision academica
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                Cada ejercicio publicado en el campus aparece aqui con su cola de entregas,
                adjuntos y feedback docente.
              </p>
            </div>
            <Link
              className="inline-flex items-center rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
              href={`/mis-cursos/${slug}`}
            >
              Ir a recursos del campus
            </Link>
          </div>

          {exerciseResources.length ? (
            exerciseResources.map((resource) => (
              <Card className="p-6" key={resource.id}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="teacher">{resource.resourceTypeLabel}</Badge>
                      <Badge tone="muted">{resource.accessLabel}</Badge>
                      {resource.moduleTitle ? <Badge tone="student">{resource.moduleTitle}</Badge> : null}
                      <Badge tone={resource.isPublished ? "teacher" : "accent"}>
                        {resource.isPublished ? "Visible en campus" : "Oculto al alumnado"}
                      </Badge>
                      {resource.dueAt ? (
                        <Badge tone="accent">Entrega hasta {formatDateTime(resource.dueAt)}</Badge>
                      ) : null}
                      {resource.passingScoreLabel ? (
                        <Badge tone="teacher">Aprueba con {resource.passingScoreLabel}/10</Badge>
                      ) : null}
                      {resource.submissionStats?.pending ? (
                        <Badge tone="accent">
                          {resource.submissionStats.pending} pendientes
                        </Badge>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-[1.25rem] font-semibold text-[var(--color-ink)]">
                        {resource.title}
                      </h3>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                        {resource.description}
                      </p>
                    </div>
                    {resource.createdByName || resource.createdAt ? (
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        {resource.createdByName ? `Publicado por ${resource.createdByName}` : "Publicado"}
                        {resource.createdAt ? ` | ${formatDateTime(resource.createdAt)}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[280px] gap-3 sm:grid-cols-3 lg:w-[340px] lg:grid-cols-1">
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Entregas
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {resource.submissionStats?.total ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Pendientes
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {resource.submissionStats?.pending ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm leading-7 text-[var(--color-muted)]">
                      {resource.href ? (
                        <Link
                          className="font-semibold text-[var(--color-primary)]"
                          href={resource.href}
                          target={resource.isExternal ? "_blank" : undefined}
                        >
                          {resource.isExternal ? "Abrir enunciado externo" : "Descargar enunciado"}
                        </Link>
                      ) : (
                        "Ejercicio interno del campus."
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {resource.submissions.length ? (
                    resource.submissions.map((submission) => (
                      <CourseExerciseReviewForm
                        courseSlug={slug}
                        key={submission.id}
                        submission={submission}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                      Este ejercicio ya esta publicado, pero todavia ningun alumno ha registrado
                      una entrega.
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-[1.02rem] leading-8 text-[var(--color-muted)]">
              Todavia no hay ejercicios publicados en el campus para este curso. Publicalos desde
              la pestana de recursos del curso para empezar a recibir entregas reales.
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Progreso por alumno
            </p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
              Avance manual
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              Este bloque mantiene el seguimiento actual por modulos completados, independiente de
              las entregas de ejercicios.
            </p>
          </div>

          <div className="space-y-4">
            {progressRows.map((row) => {
              const enrollment = latestEnrollmentByUser.get(row.userId);
              const accessState = enrollment
                ? getEnrollmentAccessState({
                    status: enrollment.status,
                    accessStartsAt: enrollment.accessStartsAt,
                    accessUntil: enrollment.accessUntil
                  })
                : isDemoUserId(user.id)
                  ? "active"
                  : "inactive";

              return (
                <Card className="p-6" key={row.userId}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                        {row.learnerName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{row.learnerEmail}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-muted)]">
                      <span>
                        Estado de acceso:{" "}
                        <strong className="text-[var(--color-ink)]">{accessState}</strong>
                      </span>
                      <span>
                        Ultima actividad:{" "}
                        <strong className="text-[var(--color-ink)]">
                          {row.lastCompletedAt ? formatDateTime(row.lastCompletedAt) : "Sin actividad"}
                        </strong>
                      </span>
                      {enrollment?.accessUntil ? (
                        <span>
                          Acceso hasta{" "}
                          <strong className="text-[var(--color-ink)]">
                            {formatDate(enrollment.accessUntil)}
                          </strong>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr_240px]">
                    <div className="rounded-2xl bg-[var(--color-surface)] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Progreso
                      </p>
                      <p className="mt-2 text-[2rem] font-semibold text-[var(--color-ink)]">
                        {row.completionRate}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--color-surface)] px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Modulos completados
                        </p>
                        <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                        <div
                          aria-hidden="true"
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${row.completionRate}%` }}
                        />
                      </div>
                      <p className="mt-3 text-sm text-[var(--color-ink)]">
                        {row.completedModules} de {row.totalModules} modulos
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--color-surface)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
                      {(() => {
                        const learnerExercises = learnerExerciseByUserId.get(row.userId);

                        if (!learnerExercises) {
                          return "El progreso se basa en marcas manuales del alumno. Todavia no hay entregas de ejercicios registradas para este alumno.";
                        }

                        return learnerExercises.averageScore !== null
                          ? `Entregas: ${learnerExercises.submissionCount}. Media actual: ${learnerExercises.averageScore.toFixed(1)}/10. Pendientes: ${learnerExercises.pendingCount}. Aprobadas: ${learnerExercises.passedCount}.`
                          : `Entregas: ${learnerExercises.submissionCount}. Pendientes: ${learnerExercises.pendingCount}. Aun no hay nota media registrada.`;
                      })()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {!progressRows.length ? (
            <Card className="p-8 text-[1.02rem] leading-8 text-[var(--color-muted)]">
              Todavia no hay matriculas registradas o no existe progreso manual guardado para este
              curso.
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
