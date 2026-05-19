import type { Metadata } from "next";
import type { CourseEnrollmentStatus } from "@prisma/client";
import {
  BarChart3,
  ChevronLeft,
  CircleHelp,
  FileClock,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountAuthHeader } from "@/components/account/account-auth-header";
import { getTeacherDashboardInitials } from "@/components/account/teacher-dashboard-shared";
import { CourseExerciseReviewForm } from "@/components/learning/course-exercise-review-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunityForCourse,
  canModerateCourse,
  getRoleLabel,
} from "@/lib/course-community";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref,
} from "@/lib/course-navigation";
import { getEnrollmentAccessState } from "@/lib/course-editions";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getLearnerProgressRowsForCatalogCourse } from "@/lib/course-progress";
import { getCampusResources } from "@/lib/course-resources";
import { getDb } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { formatDate, formatDateTime } from "@/lib/utils";

type TrackingPageProps = {
  params: Promise<{ slug: string }>;
};

type SubmissionReviewStatus = "SUBMITTED" | "REVIEWED" | "CHANGES_REQUESTED";

function TrackingStat(input: {
  label: string;
  value: string;
  detail: string;
  compactOnMobile?: boolean;
}) {
  return (
    <Card
      className={`rounded-[var(--radius-md)] px-3.5 py-3.5 sm:px-4 sm:py-4 ${
        input.compactOnMobile ? "sm:min-h-[unset]" : ""
      }`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <p className="mt-2 text-[1.45rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)] sm:mt-2.5 sm:text-[1.8rem]">
        {input.value}
      </p>
      <p
        className={`mt-1 text-xs leading-5 text-[var(--color-muted)] sm:mt-1.5 sm:text-sm ${
          input.compactOnMobile ? "hidden sm:block" : ""
        }`}
      >
        {input.detail}
      </p>
    </Card>
  );
}

function TrackingCompactStat(input: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="ui-card-base rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.84)] px-3.5 py-3 sm:px-4 sm:py-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {input.label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2 sm:mt-2.5 sm:gap-3">
        <p className="text-[1.35rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)] sm:text-[1.55rem]">
          {input.value}
        </p>
        <p className="hidden max-w-[11rem] text-right text-xs leading-5 text-[var(--color-muted)] sm:block">
          {input.detail}
        </p>
      </div>
    </div>
  );
}

function getReviewStatusMeta(status: SubmissionReviewStatus) {
  if (status === "REVIEWED") {
    return {
      tone: "success" as const,
      shortLabel: "Revisada",
      queueLabel: "Revisión cerrada",
    };
  }

  if (status === "CHANGES_REQUESTED") {
    return {
      tone: "info" as const,
      shortLabel: "Cambios solicitados",
      queueLabel: "Esperando nueva versión",
    };
  }

  return {
    tone: "warning" as const,
    shortLabel: "Pendiente",
    queueLabel: "Pendiente de revisión",
  };
}

function getAccessStateMeta(
  state: ReturnType<typeof getEnrollmentAccessState>,
) {
  if (state === "active") {
    return {
      tone: "success" as const,
      label: "Acceso activo",
    };
  }

  if (state === "scheduled") {
    return {
      tone: "info" as const,
      label: "Acceso programado",
    };
  }

  return {
    tone: "outline" as const,
    label: state === "expired" ? "Acceso expirado" : "Acceso inactivo",
  };
}

export async function generateMetadata({
  params,
}: TrackingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Seguimiento | ${course.title}` : "Seguimiento",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CourseTrackingPage({
  params,
}: TrackingPageProps) {
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
    userIsActive: user.isActive,
  });

  if (!access.allowed) {
    redirect(`/checkout/${slug}`);
  }

  if (
    !canViewCourseProgress({
      globalRole: user.globalRole,
      viewerRole: access.role,
    })
  ) {
    redirect(`/mis-cursos/${slug}`);
  }

  const canModerate = canModerateCourse(access.role);
  let progressRows = [] as Awaited<
    ReturnType<typeof getLearnerProgressRowsForCatalogCourse>
  >;
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
    canModerate,
  }).then((resources) =>
    resources.filter((resource) => resource.isManaged && resource.isExercise),
  );

  try {
    [enrollments, exerciseResources] = await Promise.all([
      getDb().courseEnrollment.findMany({
        where: {
          course: {
            slug,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      exerciseResourcesPromise,
    ]);
    progressRows = await getLearnerProgressRowsForCatalogCourse(course, {
      enrollments,
    });
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    throw error;
  }

  const progressRowsByUserId = new Map(
    progressRows.map(
      (progressRow) => [progressRow.userId, progressRow] as const,
    ),
  );

  const latestEnrollmentByUser = new Map<
    string,
    (typeof enrollments)[number]
  >();

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
      summary.pending += resource.submissions.filter(
        (submission) => submission.status === "SUBMITTED",
      ).length;
      summary.reviewed += resource.submissions.filter(
        (submission) => submission.status === "REVIEWED",
      ).length;
      summary.changesRequested += resource.submissions.filter(
        (submission) => submission.status === "CHANGES_REQUESTED",
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
      changesRequested: 0,
    },
  );

  const learnerExerciseRows = Array.from(
    exerciseResources
      .flatMap((resource) =>
        resource.submissions.map((submission) => ({
          resourceTitle: resource.title,
          resourceModuleTitle: resource.moduleTitle,
          submission,
        })),
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
            latestModuleTitle: null as string | null,
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
            current.latestSubmittedAt.getTime() <
              entry.submission.submittedAt.getTime()
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
        >(),
      )
      .values(),
  )
    .map((row) => ({
      ...row,
      averageScore: row.scoredCount ? row.scoreTotal / row.scoredCount : null,
      progressRow: progressRowsByUserId.get(row.userId) ?? null,
    }))
    .sort(
      (left, right) =>
        (right.latestSubmittedAt?.getTime() ?? 0) -
        (left.latestSubmittedAt?.getTime() ?? 0),
    );
  const learnerExerciseByUserId = new Map(
    learnerExerciseRows.map(
      (learnerExerciseRow) =>
        [learnerExerciseRow.userId, learnerExerciseRow] as const,
    ),
  );
  const reviewQueue = exerciseResources
    .flatMap((resource) =>
      resource.submissions
        .filter(
          (submission) =>
            submission.status === "SUBMITTED" ||
            submission.status === "CHANGES_REQUESTED",
        )
        .map((submission) => ({
          submission,
          resourceTitle: resource.title,
          moduleTitle: resource.moduleTitle,
        })),
    )
    .sort(
      (left, right) =>
        right.submission.submittedAt.getTime() -
        left.submission.submittedAt.getTime(),
    );
  const progressCoverage = progressRows.length
    ? Math.round(
        progressRows.reduce((total, row) => total + row.completionRate, 0) /
          progressRows.length,
      )
    : 0;
  const activeLearnerCount = progressRows.filter(
    (row) => row.completedModules > 0 || row.lastCompletedAt,
  ).length;
  const highAttentionLearners = learnerExerciseRows.filter(
    (row) => row.pendingCount > 0 || row.changesRequestedCount > 0,
  ).length;
  const openReviewCases =
    exerciseSummary.pending + exerciseSummary.changesRequested;
  const campusContentHref = buildCourseContentHref(slug);
  const campusResourcesHref = buildCourseResourcesHref(
    slug,
    "resource-manager-top",
  );
  const forumHref = buildCourseForumHref(slug);
  const teacherFullName = user.name ?? user.email;
  const teacherInitials = getTeacherDashboardInitials(teacherFullName);
  const roleLabel = getRoleLabel(access.role);
  const firstReviewHref = reviewQueue[0]
    ? `#submission-${reviewQueue[0].submission.id}`
    : null;
  const resourcesWithActiveQueue = exerciseResources.filter(
    (resource) => (resource.submissionStats?.pending ?? 0) > 0,
  ).length;
  const respondedCases =
    exerciseSummary.reviewed + exerciseSummary.changesRequested;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)] pb-24">
      <AccountAuthHeader
        fullName={teacherFullName}
        initials={teacherInitials}
        navItems={[
          { label: "Mi cuenta", href: "/mi-cuenta" },
          { label: "Mis cursos", href: "/mis-cursos" },
          {
            label: "Seguimiento",
            href: `/mis-cursos/${slug}/seguimiento`,
            active: true,
          },
          { label: "Foro", href: forumHref },
        ]}
        primaryAction={{
          label: reviewQueue.length ? "Revisar cola" : "Abrir recursos",
          href: reviewQueue.length ? "#cola-revision" : campusResourcesHref,
        }}
        roleLabel="Docente"
        utilityItems={[
          {
            label: "Volver al campus",
            href: campusContentHref,
            icon: <ChevronLeft className="h-4 w-4" />,
          },
          {
            label: "Recursos",
            href: campusResourcesHref,
            icon: <FolderKanban className="h-4 w-4" />,
          },
          {
            label: "Soporte",
            href: `mailto:${siteConfig.supportEmail}`,
            icon: <CircleHelp className="h-4 w-4" />,
            external: true,
          },
        ]}
      />

      <main className="site-container pt-6 sm:pt-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_22rem]">
          <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,238,248,0.84))] p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{roleLabel}</Badge>
              <Badge tone="outline">Seguimiento docente</Badge>
            </div>

            <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
              <h1 className="max-w-4xl text-display-lg font-semibold text-[var(--color-ink)]">
                {course.title}
              </h1>
              <p className="hidden max-w-3xl text-body-lg text-[var(--color-ink)]/82 sm:block">
                Revisa entregas, detecta casos abiertos y consulta el avance del
                grupo sin salir del mismo contexto docente.
              </p>
              <p className="max-w-3xl text-sm leading-6 text-[var(--color-ink)]/82 sm:hidden">
                Revisa cola y alumnado desde un punto único.
              </p>
            </div>

            <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-3">
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

            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
              <ButtonLink href={firstReviewHref ?? campusResourcesHref}>
                {reviewQueue.length
                  ? "Ir a la primera revisión"
                  : "Abrir recursos"}
              </ButtonLink>
              <ButtonLink href={campusContentHref} variant="secondary">
                Volver al campus
              </ButtonLink>
              <ButtonLink href={forumHref} variant="ghost">
                Abrir foro
              </ButtonLink>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Cola activa
                  </p>
                  <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-ink)] sm:mt-3 sm:text-[2rem]">
                    {openReviewCases}
                  </p>
                  <p className="mt-1.5 text-sm leading-5 text-[var(--color-muted)] sm:mt-2 sm:leading-6">
                    {exerciseSummary.pending > 0
                      ? "Entregas esperando revisión."
                      : exerciseSummary.changesRequested > 0
                        ? "Hay alumnos pendientes de responder a cambios solicitados."
                        : "No hay bloqueos inmediatos en la cola de revisión."}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-2.5 py-2 text-right sm:px-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    Respondidas
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-[var(--color-ink)] sm:mt-2 sm:text-lg">
                    {respondedCases}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Entregas totales
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                    {exerciseSummary.submissions}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Recursos con cola
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                    {resourcesWithActiveQueue}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="hidden p-5 sm:block">
              <div className="flex items-center gap-3">
                <FileClock className="h-5 w-5 text-[var(--color-primary)]" />
                <h2 className="text-display-md font-semibold text-[var(--color-ink)]">
                  Atajos del curso
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <ButtonLink href="#cola-revision" variant="secondary">
                  Ver cola
                </ButtonLink>
                <ButtonLink href={campusResourcesHref} variant="ghost">
                  Recursos
                </ButtonLink>
                <ButtonLink href={forumHref} variant="ghost">
                  Foro
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
                Este seguimiento mantiene el mismo punto de entrada docente que
                Mi cuenta y Mis cursos, sin crear una pantalla aislada.
              </p>
            </Card>
          </div>
        </section>

        <div className="mt-8 hidden gap-3 sm:grid md:grid-cols-2 xl:grid-cols-4">
          <TrackingStat
            compactOnMobile
            detail="Personas con trazabilidad de progreso o actividad real."
            label="Alumnado con historial"
            value={`${progressRows.length}`}
          />
          <TrackingStat
            compactOnMobile
            detail="Ejercicios visibles ahora mismo dentro del campus."
            label="Ejercicios publicados"
            value={`${exerciseSummary.exercises}`}
          />
          <TrackingStat
            compactOnMobile
            detail={`${submissionStudentIds.size} alumnos han entregado al menos una vez.`}
            label="Entregas registradas"
            value={`${exerciseSummary.submissions}`}
          />
          <TrackingStat
            compactOnMobile
            detail={`${exerciseSummary.pending} pendientes y ${exerciseSummary.changesRequested} con cambios solicitados.`}
            label="Casos abiertos"
            value={`${openReviewCases}`}
          />
        </div>

        <section className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1.32fr)_20rem]">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[rgba(12,113,195,0.08)] px-5 py-4 lg:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Rendimiento por alumno
              </p>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-display-md font-semibold text-[var(--color-ink)]">
                    Vision consolidada
                  </h2>
                  <p className="mt-1.5 hidden max-w-3xl text-sm leading-6 text-[var(--color-muted)] sm:block">
                    Lo esencial del curso en una sola vista: entregas, nivel de
                    avance y alumnado que requiere seguimiento cercano.
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
                  <div
                    className="grid gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_220px] lg:items-center lg:px-6"
                    key={row.userId}
                  >
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[1.05rem] font-semibold text-[var(--color-ink)]">
                          {row.learnerName}
                        </p>
                        {row.pendingCount ? (
                          <Badge tone="warning">
                            {row.pendingCount} pendientes
                          </Badge>
                        ) : null}
                        {row.changesRequestedCount ? (
                          <Badge tone="info">
                            {row.changesRequestedCount} con cambios
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-[var(--color-muted)]">
                        {row.learnerEmail}
                      </p>
                      <p className="text-sm leading-5 text-[var(--color-muted)] sm:leading-6">
                        {row.latestResourceTitle ? (
                          <>
                            Última entrega en{" "}
                            <strong className="text-[var(--color-ink)]">
                              {row.latestResourceTitle}
                            </strong>
                            {row.latestModuleTitle
                              ? ` | ${row.latestModuleTitle}`
                              : ""}
                            {row.latestSubmittedAt
                              ? ` | ${formatDateTime(row.latestSubmittedAt)}`
                              : ""}
                          </>
                        ) : (
                          "Sin ejercicio reciente registrado."
                        )}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
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
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Progreso
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                          {row.progressRow
                            ? `${row.progressRow.completionRate}%`
                            : "N/D"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {row.progressRow
                            ? `${row.progressRow.completedModules}/${row.progressRow.totalModules} módulos`
                            : "Sin avance manual"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white/86 px-4 py-3.5 text-sm leading-6 text-[var(--color-muted)] lg:block">
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
                          Último módulo:{" "}
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
              <div className="p-5 lg:p-6">
                <div className="ui-empty-state px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
                  Todavía no hay entregas suficientes para construir un
                  seguimiento consolidado por alumno.
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="p-4 sm:p-5" id="cola-revision">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Cola de revisión
              </p>
              <h3 className="mt-1.5 text-display-md font-semibold text-[var(--color-ink)]">
                Requiere respuesta docente
              </h3>
              <div className="mt-4 space-y-2.5">
                {reviewQueue.length ? (
                  reviewQueue.slice(0, 6).map((entry) => {
                    const statusMeta = getReviewStatusMeta(
                      entry.submission.status,
                    );

                    return (
                      <Link
                        className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3.5 transition hover:-translate-y-[1px] hover:border-[var(--color-primary)] hover:bg-white hover:shadow-[var(--shadow-medium)] sm:px-4 sm:py-4"
                        href={`#submission-${entry.submission.id}`}
                        key={entry.submission.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-[var(--color-ink)]">
                              {entry.submission.studentName}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                              {statusMeta.queueLabel}
                            </p>
                          </div>
                          <Badge tone={statusMeta.tone}>
                            {statusMeta.shortLabel}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          <strong className="text-[var(--color-ink)]">
                            {entry.resourceTitle}
                          </strong>
                          {entry.moduleTitle ? ` | ${entry.moduleTitle}` : ""}
                        </p>
                        <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                          {formatDateTime(entry.submission.submittedAt)}
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <div className="ui-empty-state px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
                    No hay entregas esperando respuesta. El seguimiento esta
                    estable.
                  </div>
                )}
              </div>
            </Card>

            <Card className="hidden p-5 sm:block">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Lectura rápida
              </p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--color-muted)]">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3.5">
                  <p>
                    <strong className="text-[var(--color-ink)]">
                      {exerciseSummary.exercises}
                    </strong>{" "}
                    ejercicios activos y{" "}
                    <strong className="text-[var(--color-ink)]">
                      {exerciseSummary.submissions}
                    </strong>{" "}
                    entregas registradas.
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3.5">
                  <p>
                    <strong className="text-[var(--color-ink)]">
                      {activeLearnerCount}
                    </strong>{" "}
                    alumnos con actividad y{" "}
                    <strong className="text-[var(--color-ink)]">
                      {highAttentionLearners}
                    </strong>{" "}
                    casos que conviene seguir de cerca.
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3.5">
                  <p>
                    El progreso medio manual del grupo se situa en{" "}
                    <strong className="text-[var(--color-ink)]">
                      {progressCoverage}%
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Entregas de ejercicios
              </p>
              <h2 className="mt-2 text-display-md font-semibold text-[var(--color-ink)]">
                Revisión académica
              </h2>
              <p className="mt-2 hidden max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:block">
                Cada ejercicio publicado en el campus aparece aquí con su cola
                de entregas, adjuntos y feedback docente.
              </p>
            </div>
            <ButtonLink href={campusResourcesHref} variant="secondary">
              Ir a recursos del campus
            </ButtonLink>
          </div>

          {exerciseResources.length ? (
            exerciseResources.map((resource) => (
              <Card className="overflow-hidden p-0" key={resource.id}>
                <div className="border-b border-[rgba(12,113,195,0.08)] px-5 py-5 lg:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{resource.resourceTypeLabel}</Badge>
                        <Badge tone="outline">{resource.accessLabel}</Badge>
                        {resource.moduleTitle ? (
                          <Badge tone="warning">{resource.moduleTitle}</Badge>
                        ) : null}
                        <Badge
                          tone={resource.isPublished ? "success" : "outline"}
                        >
                          {resource.isPublished
                            ? "Visible en campus"
                            : "Oculto al alumnado"}
                        </Badge>
                        {resource.dueAt ? (
                          <Badge tone="warning">
                            Entrega hasta {formatDateTime(resource.dueAt)}
                          </Badge>
                        ) : null}
                        {resource.passingScoreLabel ? (
                          <Badge tone="brand">
                            Aprueba con {resource.passingScoreLabel}/10
                          </Badge>
                        ) : null}
                        {resource.submissionStats?.pending ? (
                          <Badge tone="warning">
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
                          {resource.createdByName
                            ? `Publicado por ${resource.createdByName}`
                            : "Publicado"}
                          {resource.createdAt
                            ? ` | ${formatDateTime(resource.createdAt)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:w-[300px] lg:grid-cols-1 lg:gap-2.5">
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Entregas
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                          {resource.submissionStats?.total ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Pendientes
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                          {resource.submissionStats?.pending ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 text-sm leading-5 text-[var(--color-muted)] sm:col-span-2 sm:px-4 sm:py-3.5 sm:leading-6 lg:col-span-1">
                        <div className="space-y-2">
                          <Link
                            className="block font-semibold text-[var(--color-primary)]"
                            href={buildCourseResourcesHref(
                              slug,
                              `resource-${resource.id}`,
                            )}
                          >
                            Abrir en campus
                          </Link>
                          {resource.href ? (
                            <Link
                              className="block font-semibold text-[var(--color-primary)]"
                              href={resource.href}
                              target={
                                resource.isExternal ? "_blank" : undefined
                              }
                            >
                              {resource.isExternal
                                ? "Abrir enunciado externo"
                                : "Descargar enunciado"}
                            </Link>
                          ) : (
                            <span>Ejercicio interno del campus.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 px-5 py-5 lg:px-6">
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
                    <div className="ui-empty-state p-4 text-sm leading-6 text-[var(--color-muted)]">
                      Este ejercicio ya está publicado, pero todavía ningún
                      alumno ha registrado una entrega.
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6">
              <div className="ui-empty-state px-5 py-6 text-[1rem] leading-7 text-[var(--color-muted)]">
                Todavía no hay ejercicios publicados en el campus para este
                curso. Publícalos desde la pestaña de recursos del curso para
                empezar a recibir entregas reales.
              </div>
            </Card>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Progreso por alumno
            </p>
            <h2 className="mt-2 text-display-md font-semibold text-[var(--color-ink)]">
              Avance manual
            </h2>
            <p className="mt-2 hidden max-w-3xl text-sm leading-6 text-[var(--color-muted)] sm:block">
              Este bloque mantiene el seguimiento actual por módulos
              completados, independiente de las entregas de ejercicios.
            </p>
          </div>

          {progressRows.length ? (
            <div className="space-y-3.5">
              {progressRows.map((row) => {
                const enrollment = latestEnrollmentByUser.get(row.userId);
                const accessState = enrollment
                  ? getEnrollmentAccessState({
                      status: enrollment.status,
                      accessStartsAt: enrollment.accessStartsAt,
                      accessUntil: enrollment.accessUntil,
                    })
                  : isDemoUserId(user.id)
                    ? "active"
                    : "inactive";
                const accessMeta = getAccessStateMeta(accessState);

                return (
                  <Card className="p-4 sm:p-5" key={row.userId}>
                    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[1.2rem] font-semibold text-[var(--color-ink)]">
                            {row.learnerName}
                          </p>
                          <Badge tone={accessMeta.tone}>
                            {accessMeta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {row.learnerEmail}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                        <span>
                          Última actividad:{" "}
                          <strong className="text-[var(--color-ink)]">
                            {row.lastCompletedAt
                              ? formatDateTime(row.lastCompletedAt)
                              : "Sin actividad"}
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

                    <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 md:grid-cols-[200px_1fr_220px]">
                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Progreso
                        </p>
                        <p className="mt-2 text-[2rem] font-semibold text-[var(--color-ink)]">
                          {row.completionRate}%
                        </p>
                      </div>

                      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 sm:px-4 sm:py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Módulos completados
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
                          {row.completedModules} de {row.totalModules} módulos
                        </p>
                      </div>

                      <div className="hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3.5 text-sm leading-6 text-[var(--color-muted)] md:block">
                        {(() => {
                          const learnerExercises = learnerExerciseByUserId.get(
                            row.userId,
                          );

                          if (!learnerExercises) {
                            return "El progreso se basa en marcas manuales del alumno. Todavía no hay entregas de ejercicios registradas para este alumno.";
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
          ) : (
            <Card className="p-6">
              <div className="ui-empty-state px-5 py-6 text-[1rem] leading-7 text-[var(--color-muted)]">
                Todavía no hay matrículas registradas o no existe progreso
                manual guardado para este curso.
              </div>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
