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
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref
} from "@/lib/course-navigation";
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
    <Card className="px-4 py-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-2.5 text-[1.8rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
        {input.value}
      </p>
      <p className="mt-1.5 text-sm leading-5 text-[var(--color-muted)]">{input.detail}</p>
    </Card>
  );
}

function TrackingCompactStat(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-[rgba(12,113,195,0.1)] bg-white/88 px-4 py-3.5 shadow-[0_18px_45px_-38px_rgba(12,113,195,0.4)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <p className="text-[1.55rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)]">
          {input.value}
        </p>
        <p className="max-w-[11rem] text-right text-xs leading-5 text-[var(--color-muted)]">
          {input.detail}
        </p>
      </div>
    </div>
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
    user: {
      id: string;
      name: string;
      email: string;
    };
  }> = [];
  const exerciseResourcesPromise = getCampusResources({
    course,
    viewerUserId: user.id,
    canModerate
  }).then((resources) => resources.filter((resource) => resource.isManaged && resource.isExercise));

  try {
    [enrollments, exerciseResources] = await Promise.all([
      getDb().courseEnrollment.findMany({
        where: {
          course: {
            slug
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      exerciseResourcesPromise
    ]);
    progressRows = await getLearnerProgressRowsForCatalogCourse(course, {
      enrollments
    });
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    [progressRows, exerciseResources] = await Promise.all([
      getLearnerProgressRowsForCatalogCourse(course),
      exerciseResourcesPromise
    ]);
  }

  const progressRowsByUserId = new Map(
    progressRows.map((progressRow) => [progressRow.userId, progressRow] as const)
  );

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
      progressRow: progressRowsByUserId.get(row.userId) ?? null
    }))
    .sort((left, right) =>
      (right.latestSubmittedAt?.getTime() ?? 0) - (left.latestSubmittedAt?.getTime() ?? 0)
    );
  const learnerExerciseByUserId = new Map(
    learnerExerciseRows.map((learnerExerciseRow) => [learnerExerciseRow.userId, learnerExerciseRow] as const)
  );
  const reviewQueue = exerciseResources
    .flatMap((resource) =>
      resource.submissions
        .filter(
          (submission) =>
            submission.status === "SUBMITTED" || submission.status === "CHANGES_REQUESTED"
        )
        .map((submission) => ({
          submission,
          resourceTitle: resource.title,
          moduleTitle: resource.moduleTitle
        }))
    )
    .sort(
      (left, right) =>
        right.submission.submittedAt.getTime() - left.submission.submittedAt.getTime()
    );
  const progressCoverage = progressRows.length
    ? Math.round(
        progressRows.reduce((total, row) => total + row.completionRate, 0) / progressRows.length
      )
    : 0;
  const activeLearnerCount = progressRows.filter(
    (row) => row.completedModules > 0 || row.lastCompletedAt
  ).length;
  const highAttentionLearners = learnerExerciseRows.filter(
    (row) => row.pendingCount > 0 || row.changesRequestedCount > 0
  ).length;
  const openReviewCases = exerciseSummary.pending + exerciseSummary.changesRequested;
  const campusContentHref = buildCourseContentHref(slug);
  const campusResourcesHref = buildCourseResourcesHref(slug, "resource-manager-top");
  const forumHref = buildCourseForumHref(slug);

  return (
    <div className="bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)] pb-16 pt-12 lg:pt-14">
      <div className="site-container space-y-6">
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
          href={campusContentHref}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al curso
        </Link>

        <Card className="overflow-hidden border-[rgba(12,113,195,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(232,240,249,0.88))] p-5 lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_22rem] xl:items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teacher">{getRoleLabel(access.role)}</Badge>
                <Badge tone="muted">Seguimiento academico</Badge>
              </div>
              <div className="space-y-2.5">
                <h1 className="max-w-4xl text-[2.4rem] font-semibold leading-[0.96] tracking-[-0.08em] text-[var(--color-ink)] lg:text-[2.7rem]">
                  {course.title}
                </h1>
                <p className="max-w-3xl text-[0.96rem] leading-6 text-[var(--color-ink)]/80">
                  Consola docente para revisar progreso manual, entregas reales y alumnado que
                  requiere atencion sin cambiar entre varias vistas del curso.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <TrackingCompactStat
                  detail="Media de avance manual registrada."
                  label="Cobertura"
                  value={`${progressCoverage}%`}
                />
                <TrackingCompactStat
                  detail="Con progreso o actividad reciente."
                  label="Alumnado activo"
                  value={`${activeLearnerCount}`}
                />
                <TrackingCompactStat
                  detail="Pendientes o cambios por revisar."
                  label="Casos a vigilar"
                  value={`${highAttentionLearners}`}
                />
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  className="inline-flex items-center rounded-[1.15rem] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-strong)_100%)] px-4 py-2.5 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-[0_18px_32px_-20px_rgba(12,113,195,0.55)]"
                  href={campusResourcesHref}
                >
                  Abrir recursos del campus
                </Link>
                <Link
                  className="inline-flex items-center rounded-[1.15rem] border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-white hover:text-[var(--color-primary-strong)]"
                  href={forumHref}
                >
                  Abrir foro
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <Card className="border-[rgba(12,113,195,0.12)] bg-white/92 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Estado del curso
                    </p>
                    <p className="mt-2.5 text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[var(--color-ink)]">
                      {openReviewCases}
                    </p>
                    <p className="mt-1.5 text-sm leading-5 text-[var(--color-muted)]">
                      {exerciseSummary.pending > 0
                        ? "Entregas esperando revision docente."
                        : exerciseSummary.changesRequested > 0
                          ? "Alumnos pendientes de responder a cambios solicitados."
                        : "Sin bloqueos inmediatos en la cola de revision."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-primary-soft)] px-3 py-2 text-right">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                      Revision
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                      {exerciseSummary.reviewed}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Entregas
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                      {exerciseSummary.submissions}
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Alumnado con entregas
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                      {submissionStudentIds.size}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-[rgba(12,113,195,0.12)] bg-white/92 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Foco inmediato
                    </p>
                    <p className="mt-2.5 text-[1.02rem] font-semibold text-[var(--color-ink)]">
                      {reviewQueue.length
                        ? reviewQueue[0]?.submission.studentName
                        : "Seguimiento estable"}
                    </p>
                  </div>
                  {reviewQueue.length ? (
                    <Badge tone="accent">
                      {reviewQueue[0]?.submission.status === "CHANGES_REQUESTED"
                        ? "Cambios solicitados"
                        : "Pendiente"}
                    </Badge>
                  ) : (
                    <Badge tone="teacher">Sin alertas</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {reviewQueue.length
                    ? `${reviewQueue[0]?.resourceTitle}${reviewQueue[0]?.moduleTitle ? ` | ${reviewQueue[0]?.moduleTitle}` : ""}`
                    : "No hay alumnos esperando respuesta o nueva revision ahora mismo."}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  {reviewQueue.length
                    ? `Ultimo movimiento | ${formatDateTime(reviewQueue[0]!.submission.submittedAt)}`
                    : "Curso sin cola activa"}
                </p>
              </Card>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            detail={`${exerciseSummary.pending} pendientes de revision y ${exerciseSummary.changesRequested} con cambios solicitados.`}
            label="Casos abiertos"
            value={`${openReviewCases}`}
          />
        </div>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.32fr)_19rem]">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[rgba(12,113,195,0.08)] px-5 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Rendimiento por alumno
              </p>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                    Vision consolidada
                  </h2>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                    Lo esencial del curso en una sola vista: entregas, nivel de avance y alumnado
                    que requiere seguimiento cercano.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  <span>{learnerExerciseRows.length} alumnos con entregas</span>
                  <span>{openReviewCases} abiertos</span>
                  <span>{exerciseSummary.reviewed} revisadas</span>
                </div>
              </div>
            </div>

            {learnerExerciseRows.length ? (
              <div className="divide-y divide-[rgba(12,113,195,0.08)]">
                {learnerExerciseRows.map((row) => (
                  <div className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_200px] lg:items-center" key={row.userId}>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[1.02rem] font-semibold text-[var(--color-ink)]">
                          {row.learnerName}
                        </p>
                        {row.pendingCount ? (
                          <Badge tone="accent">{row.pendingCount} pendientes</Badge>
                        ) : null}
                        {row.changesRequestedCount ? (
                          <Badge tone="accent">
                            {row.changesRequestedCount} con cambios
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-[var(--color-muted)]">{row.learnerEmail}</p>
                      <p className="text-sm leading-6 text-[var(--color-muted)]">
                        {row.latestResourceTitle ? (
                          <>
                            Ultima entrega en{" "}
                            <strong className="text-[var(--color-ink)]">
                              {row.latestResourceTitle}
                            </strong>
                            {row.latestModuleTitle ? ` | ${row.latestModuleTitle}` : ""}
                            {row.latestSubmittedAt
                              ? ` | ${formatDateTime(row.latestSubmittedAt)}`
                              : ""}
                          </>
                        ) : (
                          "Sin ejercicio reciente registrado."
                        )}
                      </p>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Entregas
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                          {row.submissionCount}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {row.reviewedCount} revisadas
                        </p>
                      </div>
                      <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Progreso
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                          {row.progressRow ? `${row.progressRow.completionRate}%` : "N/D"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {row.progressRow
                            ? `${row.progressRow.completedModules}/${row.progressRow.totalModules} modulos`
                            : "Sin avance manual"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.1rem] border border-[rgba(12,113,195,0.08)] bg-white/86 px-3.5 py-3 text-sm leading-6 text-[var(--color-muted)]">
                      <p>
                        Media:{" "}
                        <strong className="text-[var(--color-ink)]">
                          {row.averageScore !== null
                            ? `${row.averageScore.toFixed(1)}/10`
                            : "Sin nota"}
                        </strong>
                      </p>
                      <p className="mt-1">
                        Resultado:{" "}
                        <strong className="text-[var(--color-ink)]">
                          {row.passedCount} aprobadas
                        </strong>
                        {` | ${row.failedCount} no aprobadas`}
                      </p>
                      {row.progressRow?.lastCompletedAt ? (
                        <p className="mt-1">
                          Ultimo modulo:{" "}
                          <strong className="text-[var(--color-ink)]">
                            {formatDateTime(row.progressRow.lastCompletedAt)}
                          </strong>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-[1rem] leading-7 text-[var(--color-muted)]">
                Todavia no hay entregas suficientes para construir un seguimiento consolidado por
                alumno.
              </div>
            )}
          </Card>

          <div className="space-y-3">
            <Card className="p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Cola de revision
              </p>
              <h3 className="mt-1.5 text-[1.32rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Requiere respuesta docente
              </h3>
              <div className="mt-3 space-y-2.5">
                {reviewQueue.length ? (
                  reviewQueue.slice(0, 4).map((entry) => (
                    <Link
                      className="block rounded-[1.1rem] border border-[rgba(12,113,195,0.08)] bg-[var(--color-surface)] px-3.5 py-3.5 transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-white hover:shadow-[0_16px_28px_-24px_rgba(12,113,195,0.34)]"
                      href={`#submission-${entry.submission.id}`}
                      key={entry.submission.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-ink)]">
                            {entry.submission.studentName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                            {entry.submission.status === "CHANGES_REQUESTED"
                              ? "Cambios solicitados"
                              : "Pendiente de revision"}
                          </p>
                        </div>
                        <Badge tone={entry.submission.status === "CHANGES_REQUESTED" ? "accent" : "teacher"}>
                          {entry.submission.status === "CHANGES_REQUESTED" ? "Reabrir" : "Revisar"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        <strong className="text-[var(--color-ink)]">{entry.resourceTitle}</strong>
                        {entry.moduleTitle ? ` | ${entry.moduleTitle}` : ""}
                      </p>
                      <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        {formatDateTime(entry.submission.submittedAt)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
                    No hay entregas esperando respuesta. El seguimiento esta estable.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Lectura rapida
              </p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--color-muted)]">
                <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-4 py-3.5">
                  <p>
                    <strong className="text-[var(--color-ink)]">{exerciseSummary.exercises}</strong>{" "}
                    ejercicios activos y{" "}
                    <strong className="text-[var(--color-ink)]">{exerciseSummary.submissions}</strong>{" "}
                    entregas registradas.
                  </p>
                </div>
                <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-4 py-3.5">
                  <p>
                    <strong className="text-[var(--color-ink)]">{activeLearnerCount}</strong> alumnos
                    con actividad y <strong className="text-[var(--color-ink)]">{highAttentionLearners}</strong>{" "}
                    casos que conviene seguir de cerca.
                  </p>
                </div>
                <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-4 py-3.5">
                  <p>
                    El progreso medio manual del grupo se situa en{" "}
                    <strong className="text-[var(--color-ink)]">{progressCoverage}%</strong>.
                  </p>
                </div>
              </div>
            </Card>
          </div>
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
              className="inline-flex items-center rounded-[1.15rem] border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-white hover:text-[var(--color-primary-strong)]"
              href={campusResourcesHref}
            >
              Ir a recursos del campus
            </Link>
          </div>

          {exerciseResources.length ? (
            exerciseResources.map((resource) => (
              <Card className="p-5" key={resource.id}>
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
                      <p className="mt-2.5 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
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

                  <div className="grid min-w-[260px] gap-2.5 sm:grid-cols-3 lg:w-[300px] lg:grid-cols-1">
                    <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Entregas
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {resource.submissionStats?.total ?? 0}
                      </p>
                    </div>
                    <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Pendientes
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                        {resource.submissionStats?.pending ?? 0}
                      </p>
                    </div>
                    <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-3.5 py-3 text-sm leading-6 text-[var(--color-muted)]">
                      <div className="space-y-2">
                        <Link
                          className="block font-semibold text-[var(--color-primary)]"
                          href={buildCourseResourcesHref(slug, `resource-${resource.id}`)}
                        >
                          Abrir en campus
                        </Link>
                        {resource.href ? (
                          <Link
                            className="block font-semibold text-[var(--color-primary)]"
                            href={resource.href}
                            target={resource.isExternal ? "_blank" : undefined}
                          >
                            {resource.isExternal ? "Abrir enunciado externo" : "Descargar enunciado"}
                          </Link>
                        ) : (
                          <span>Ejercicio interno del campus.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5">
                  {resource.submissions.length ? (
                    resource.submissions.map((submission) => (
                      <CourseExerciseReviewForm
                        courseSlug={slug}
                        key={submission.id}
                        passingScore={resource.passingScore}
                        submission={submission}
                      />
                    ))
                  ) : (
                    <div className="rounded-[1.1rem] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                      Este ejercicio ya esta publicado, pero todavia ningun alumno ha registrado
                      una entrega.
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-[1rem] leading-7 text-[var(--color-muted)]">
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
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Este bloque mantiene el seguimiento actual por modulos completados, independiente de
              las entregas de ejercicios.
            </p>
          </div>

          <div className="space-y-3.5">
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
                <Card className="p-5" key={row.userId}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                        {row.learnerName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{row.learnerEmail}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted)]">
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

                  <div className="mt-5 grid gap-3 md:grid-cols-[200px_1fr_220px]">
                    <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-4 py-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Progreso
                      </p>
                      <p className="mt-2 text-[2rem] font-semibold text-[var(--color-ink)]">
                        {row.completionRate}%
                      </p>
                    </div>

                    <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Modulos completados
                        </p>
                        <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                        <div
                          aria-hidden="true"
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${row.completionRate}%` }}
                        />
                      </div>
                      <p className="mt-2.5 text-sm text-[var(--color-ink)]">
                        {row.completedModules} de {row.totalModules} modulos
                      </p>
                    </div>

                    <div className="rounded-[1.1rem] bg-[var(--color-surface)] px-4 py-3.5 text-sm leading-6 text-[var(--color-muted)]">
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
            <Card className="p-6 text-[1rem] leading-7 text-[var(--color-muted)]">
              Todavia no hay matriculas registradas o no existe progreso manual guardado para este
              curso.
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
