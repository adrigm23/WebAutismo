import type { Metadata } from "next";
import type { CourseEnrollmentStatus } from "@prisma/client";
import { ArrowRight, ChevronRight, MoveRight, Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseWorkspaceShell } from "@/components/learning/course-workspace/course-workspace-shell";
import { CourseExerciseReviewForm } from "@/components/learning/course-exercise-review-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
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
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import { getEnrollmentAccessState } from "@/lib/course-editions";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { canViewCourseProgress } from "@/lib/course-permissions";
import { getLearnerProgressRowsForCatalogCourse } from "@/lib/course-progress";
import { getCampusResources } from "@/lib/course-resources";
import { getDb } from "@/lib/prisma";
import { formatDate, formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";

type TrackingPageProps = {
  params: Promise<{ slug: string }>;
};

type SubmissionReviewStatus = "SUBMITTED" | "REVIEWED" | "CHANGES_REQUESTED";
type CampusResources = Awaited<ReturnType<typeof getCampusResources>>;
type ExerciseResource = CampusResources[number];
type SubmissionItem = ExerciseResource["submissions"][number];

type ReviewQueueEntry = {
  id: string;
  href: string;
  resourceId: string;
  resourceTitle: string;
  moduleTitle: string | null;
  submission: SubmissionItem;
  relevantAt: Date;
};

type ActivityItem = {
  id: string;
  href: string;
  label: string;
  title: string;
  description: string;
  createdAt: Date;
  tone: "default" | "success" | "warning" | "info";
};

type MilestoneItem = {
  id: string;
  href: string;
  date: Date;
  title: string;
  description: string;
};

function getUserInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function getReviewStatusMeta(status: SubmissionReviewStatus) {
  if (status === "REVIEWED") {
    return {
      tone: "success" as const,
      shortLabel: "Revisada",
      queueLabel: "Revisión cerrada",
      accentClass: "bg-[rgba(23,98,79,0.18)] text-[var(--color-success)]",
    };
  }

  if (status === "CHANGES_REQUESTED") {
    return {
      tone: "info" as const,
      shortLabel: "Cambios solicitados",
      queueLabel: "Esperando nueva versión",
      accentClass: "bg-[rgba(22,60,88,0.12)] text-[var(--color-primary)]",
    };
  }

  return {
    tone: "warning" as const,
    shortLabel: "Pendiente",
    queueLabel: "Pendiente de revisión",
    accentClass: "bg-[rgba(211,154,31,0.16)] text-[var(--color-warning)]",
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

function getQueuePriority(status: SubmissionReviewStatus) {
  return status === "SUBMITTED" ? 2 : status === "CHANGES_REQUESTED" ? 1 : 0;
}

function getSubmissionPreview(input: {
  submission: SubmissionItem;
  resourceTitle: string;
}) {
  const body = input.submission.body?.trim();

  if (body) {
    return body;
  }

  if (input.submission.attachmentLabel) {
    return `Adjunto enviado: ${input.submission.attachmentLabel}.`;
  }

  if (input.submission.linkUrl) {
    return `Entrega enlazada para ${input.resourceTitle}.`;
  }

  return `Requiere revisión manual en ${input.resourceTitle}.`;
}

function getResourceLatestActivity(resource: ExerciseResource) {
  return resource.submissions.reduce((latest, submission) => {
    const candidate = submission.reviewedAt ?? submission.submittedAt;
    return candidate.getTime() > latest.getTime() ? candidate : latest;
  }, resource.createdAt ?? new Date(0));
}

function buildRecentActivity(resources: CampusResources, courseSlug: string) {
  const items: ActivityItem[] = [];

  for (const resource of resources.filter((item) => item.isManaged)) {
    const resourceHref = buildCourseResourcesHref(courseSlug, `resource-${resource.id}`);

    if (resource.isPublished && resource.createdAt) {
      items.push({
        id: `resource-${resource.id}`,
        href: resourceHref,
        label: "Nuevo recurso publicado",
        title: resource.title,
        description: resource.moduleTitle
          ? `${resource.moduleTitle} · Publicado por ${resource.createdByName ?? "el equipo docente"}.`
          : `Publicado por ${resource.createdByName ?? "el equipo docente"}.`,
        createdAt: resource.createdAt,
        tone: "default",
      });
    }

    for (const submission of resource.submissions) {
      const reviewHref = buildCourseTrackingHref({
        courseSlug,
        submissionId: submission.id,
      });

      if (submission.status === "REVIEWED" && submission.reviewedAt) {
        items.push({
          id: `reviewed-${submission.id}`,
          href: reviewHref,
          label: "Revisión completada",
          title: `${submission.studentName} · ${resource.title}`,
          description: submission.scoreLabel
            ? `Resultado registrado: ${submission.scoreLabel}/10.`
            : "Se ha cerrado la revisión de la entrega.",
          createdAt: submission.reviewedAt,
          tone: "success",
        });
      }

      if (submission.status === "CHANGES_REQUESTED" && submission.reviewedAt) {
        items.push({
          id: `changes-${submission.id}`,
          href: reviewHref,
          label: "Cambios solicitados",
          title: `${submission.studentName} · ${resource.title}`,
          description: submission.feedback?.trim()
            ? submission.feedback.trim()
            : "Se ha pedido una nueva versión de la entrega.",
          createdAt: submission.reviewedAt,
          tone: "warning",
        });
      }

      if (submission.status === "SUBMITTED") {
        items.push({
          id: `submitted-${submission.id}`,
          href: reviewHref,
          label: "Entrega recibida",
          title: `${submission.studentName} · ${resource.title}`,
          description: getSubmissionPreview({
            submission,
            resourceTitle: resource.title,
          }),
          createdAt: submission.submittedAt,
          tone: "info",
        });
      }
    }
  }

  return items
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5);
}

function buildUpcomingMilestones(input: {
  courseSlug: string;
  course: NonNullable<Awaited<ReturnType<typeof getCatalogCourseBySlug>>>;
  resources: ExerciseResource[];
}) {
  const items: MilestoneItem[] = [];
  const now = Date.now();

  if (input.course.activeEdition?.endsAt) {
    const endsAt = input.course.activeEdition.endsAt;

    if (endsAt.getTime() > now) {
      items.push({
        id: "edition-ends",
        href: buildCourseContentHref(input.courseSlug),
        date: endsAt,
        title: `Cierre de ${input.course.activeEdition.label}`,
        description: "Fin previsto de la edición activa del curso.",
      });
    }
  }

  if (input.course.activeEdition?.accessUntil) {
    const accessUntil = input.course.activeEdition.accessUntil;

    if (
      accessUntil.getTime() > now &&
      accessUntil.getTime() !== input.course.activeEdition.endsAt?.getTime()
    ) {
      items.push({
        id: "edition-access-until",
        href: buildCourseContentHref(input.courseSlug),
        date: accessUntil,
        title: "Fin de acceso",
        description: `Vence la ventana de acceso de ${input.course.activeEdition.label}.`,
      });
    }
  }

  for (const resource of input.resources) {
    if (!resource.dueAt || resource.dueAt.getTime() <= now) {
      continue;
    }

    items.push({
      id: `resource-${resource.id}-due`,
      href: buildCourseResourcesHref(input.courseSlug, `resource-${resource.id}`),
      date: resource.dueAt,
      title: resource.title,
      description: resource.moduleTitle
        ? `${resource.moduleTitle} · cierre de entregas programado.`
        : "Cierre de entregas programado.",
    });
  }

  return items
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .slice(0, 4);
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
  const [course, user] = await Promise.all([
    getCatalogCourseBySlug(slug),
    requireUser(`/mis-cursos/${slug}/seguimiento`),
  ]);

  if (!course) {
    notFound();
  }
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

  // Docentes y admins redirigen al nuevo portal docente
  if (user.globalRole === "TEACHER" || user.globalRole === "ADMIN") {
    redirect(`/docente/cursos/${slug}?tab=alumnos`);
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
  let campusResources = [] as CampusResources;
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

  try {
    [enrollments, campusResources] = await Promise.all([
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
      getCampusResources({
        course,
        viewerUserId: user.id,
        canModerate,
      }),
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

  const notifications = await getDashboardNotificationSnapshot({
    courseSlugs: [slug],
    forumLimit: 3,
    platformLimit: 3,
    userId: user.id,
  });

  const progressRowsByUserId = new Map(
    progressRows.map((row) => [row.userId, row] as const),
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

  const exerciseResources = campusResources.filter(
    (resource) => resource.isManaged && resource.isExercise,
  );

  const learnerExerciseRows = Array.from(
    exerciseResources
      .flatMap((resource) =>
        resource.submissions.map((submission) => ({
          resourceTitle: resource.title,
          moduleTitle: resource.moduleTitle,
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
            current.latestSubmittedAt.getTime() < entry.submission.submittedAt.getTime()
          ) {
            current.latestSubmittedAt = entry.submission.submittedAt;
            current.latestResourceTitle = entry.resourceTitle;
            current.latestModuleTitle = entry.moduleTitle;
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
    learnerExerciseRows.map((row) => [row.userId, row] as const),
  );

  const reviewQueue = exerciseResources
    .flatMap((resource) =>
      resource.submissions
        .filter(
          (submission) =>
            submission.status === "SUBMITTED" ||
            submission.status === "CHANGES_REQUESTED",
        )
        .map(
          (submission): ReviewQueueEntry => ({
            id: submission.id,
            href: buildCourseTrackingHref({
              courseSlug: slug,
              submissionId: submission.id,
            }),
            resourceId: resource.id,
            resourceTitle: resource.title,
            moduleTitle: resource.moduleTitle,
            submission,
            relevantAt: submission.reviewedAt ?? submission.submittedAt,
          }),
        ),
    )
    .sort((left, right) => {
      const priorityDiff =
        getQueuePriority(right.submission.status) -
        getQueuePriority(left.submission.status);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return right.relevantAt.getTime() - left.relevantAt.getTime();
    });

  const pendingReviewCount = reviewQueue.filter(
    (item) => item.submission.status === "SUBMITTED",
  ).length;
  const firstUrgentReview =
    reviewQueue.find((item) => item.submission.status === "SUBMITTED") ??
    reviewQueue[0] ??
    null;
  const reviewCtaLabel = firstUrgentReview
    ? `Continuar con ${firstUrgentReview.submission.studentName}`
    : "Abrir recursos del curso";
  const reviewCtaHref = firstUrgentReview
    ? firstUrgentReview.href
    : buildCourseResourcesHref(slug, "resource-manager-top");
  const reviewCtaMeta = firstUrgentReview
    ? pendingReviewCount > 0
      ? `${pendingReviewCount} revisión urgente • ${formatRelativeTime(
          firstUrgentReview.relevantAt,
        )}`
      : `Caso abierto • ${formatRelativeTime(firstUrgentReview.relevantAt)}`
    : "Sin revisiones urgentes ahora";

  const recentActivity = buildRecentActivity(campusResources, slug);
  const upcomingMilestones = buildUpcomingMilestones({
    courseSlug: slug,
    course,
    resources: exerciseResources,
  });
  const reviewResources = [...exerciseResources]
    .filter((resource) => resource.submissions.length > 0)
    .sort((left, right) => {
      const pendingDiff =
        (right.submissionStats?.pending ?? 0) - (left.submissionStats?.pending ?? 0);

      if (pendingDiff !== 0) {
        return pendingDiff;
      }

      return (
        getResourceLatestActivity(right).getTime() -
        getResourceLatestActivity(left).getTime()
      );
    });

  const teacherFullName = user.name ?? user.email;
  const roleLabel = getRoleLabel(access.role);
  const courseTabs = [
    {
      label: "Seguimiento",
      href: buildCourseTrackingHref({ courseSlug: slug }),
      active: true,
    },
    {
      label: "Contenido",
      href: buildCourseContentHref(slug),
      active: false,
    },
    {
      label: "Recursos",
      href: buildCourseResourcesHref(slug, "resource-manager-top"),
      active: false,
    },
    {
      label: "Comunidad",
      href: buildCourseForumHref(slug),
      active: false,
    },
  ];

  return (
    <CourseWorkspaceShell
      courseTitle={course.title}
      notificationsCount={notifications.unreadCount}
      roleLabel={roleLabel}
      viewerInitials={getInitials(teacherFullName)}
      viewerName={teacherFullName}
    >
      <div className="site-container py-6 sm:py-8 pb-20">
        <section className="border-b border-[rgba(22,60,88,0.08)] pb-6 sm:pb-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
                <Link
                  className="transition hover:text-[var(--color-primary)]"
                  href="/mis-cursos"
                >
                  Cursos
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="truncate text-[var(--color-ink-soft)]">
                  {course.title}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="font-premium text-[clamp(2.2rem,4vw,3.35rem)] leading-[0.98] font-semibold tracking-[-0.07em] text-[var(--color-ink)] text-balance">
                  {course.title}
                </h1>
                <Badge
                  className="bg-white/84 text-[var(--color-ink-soft)]"
                  tone="outline"
                >
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[rgba(46,163,242,0.85)]" />
                  Activo
                </Badge>
              </div>
            </div>

            <div className="xl:w-[19rem] xl:shrink-0">
              <ButtonLink
                className="w-full justify-between rounded-lg px-5"
                href={reviewCtaHref}
                variant="inverse"
              >
                <span>{reviewCtaLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <p className="mt-3 text-right text-sm text-[var(--color-muted)]">
                {reviewCtaMeta}
              </p>
            </div>
          </div>

          <nav
            aria-label="Secciones del curso"
            className="mt-6 overflow-x-auto"
          >
            <div className="flex min-w-max items-center gap-8 border-b border-[rgba(22,60,88,0.08)]">
              {courseTabs.map((tab) => (
                <Link
                  aria-current={tab.active ? "page" : undefined}
                  className={
                    tab.active
                      ? "border-b-2 border-[var(--color-ink)] pb-3 text-[1.02rem] font-medium text-[var(--color-ink)]"
                      : "border-b-2 border-transparent pb-3 text-[1.02rem] font-medium text-[var(--color-ink-soft)] transition hover:border-[rgba(22,60,88,0.16)] hover:text-[var(--color-ink)]"
                  }
                  href={tab.href}
                  key={tab.label}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </nav>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:items-start">
          <div className="space-y-8">
            <section aria-labelledby="review-queue-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    className="font-premium text-display-md font-semibold text-[var(--color-ink)]"
                    id="review-queue-heading"
                  >
                    Cola de revisión
                  </h2>
                </div>
                <Badge className="bg-white/84" tone="outline">
                  {pendingReviewCount} pendientes
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {reviewQueue.length ? (
                  reviewQueue.slice(0, 6).map((entry) => {
                    const statusMeta = getReviewStatusMeta(entry.submission.status);

                    return (
                      <Link
                        className="group relative block overflow-hidden rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/84 px-4 py-4 shadow-[0_10px_24px_rgba(23,32,44,0.04)] transition hover:-translate-y-px hover:border-[rgba(22,60,88,0.14)] hover:bg-white hover:shadow-[0_16px_32px_rgba(23,32,44,0.08)] sm:px-5"
                        href={entry.href}
                        key={entry.id}
                      >
                        <span
                          aria-hidden="true"
                          className={statusMeta.accentClass + " absolute inset-y-4 left-0 w-[3px] rounded-full"}
                        />
                        <div className="flex gap-4">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[rgba(22,60,88,0.08)] bg-[rgba(245,241,235,0.88)] text-sm font-semibold text-[var(--color-ink-soft)]">
                            {getUserInitials(entry.submission.studentName)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <p className="text-[1.04rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                                    {entry.submission.studentName}
                                  </p>
                                  {entry.moduleTitle ? (
                                    <p className="text-sm text-[var(--color-muted)]">
                                      en {entry.moduleTitle}
                                    </p>
                                  ) : null}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                                  {getSubmissionPreview({
                                    submission: entry.submission,
                                    resourceTitle: entry.resourceTitle,
                                  })}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-3 sm:pl-4">
                                <span
                                  className="hidden text-sm text-[var(--color-muted)] sm:block"
                                  title={formatDateTime(entry.relevantAt)}
                                >
                                  {formatRelativeTime(entry.relevantAt)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(246,243,238,0.9)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--color-ink-soft)]">
                                  <span
                                    className={statusMeta.accentClass + " h-1.5 w-1.5 rounded-full"}
                                  />
                                  {statusMeta.queueLabel}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                              <span>{entry.resourceTitle}</span>
                              <span className="sm:hidden">
                                {formatRelativeTime(entry.relevantAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="ui-empty-state px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
                    No hay entregas esperando revisión. Cuando entre nueva actividad
                    docente aparecerá aquí sin inventar métricas adicionales.
                  </div>
                )}
              </div>

              {reviewQueue.length > 6 ? (
                <div className="mt-4 flex justify-center">
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-primary)]"
                    href="#review-detail"
                  >
                    Ver toda la revisión abierta
                    <MoveRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </section>

            <section aria-labelledby="recent-activity-heading">
              <div className="flex items-center justify-between gap-3">
                <h2
                  className="font-premium text-display-md font-semibold text-[var(--color-ink)]"
                  id="recent-activity-heading"
                >
                  Actividad reciente
                </h2>
              </div>

              {recentActivity.length ? (
                <div className="mt-4 rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/70">
                  {recentActivity.map((item, index) => (
                    <Link
                      className="block px-5 py-4 transition hover:bg-white/84"
                      href={item.href}
                      key={item.id}
                    >
                      <article
                        className={
                          index > 0
                            ? "border-t border-[rgba(22,60,88,0.06)] pt-4"
                            : ""
                        }
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              {item.label}
                            </p>
                            <p className="mt-1.5 text-[1rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                              {item.title}
                            </p>
                            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                              {item.description}
                            </p>
                          </div>
                          <span
                            className="shrink-0 text-sm text-[var(--color-muted)]"
                            title={formatDateTime(item.createdAt)}
                          >
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="ui-empty-state mt-4 px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
                  Aún no hay actividad reciente relevante para narrar en esta vista.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28">
            <section className="border-b border-[rgba(22,60,88,0.08)] pb-5">
              <Link
                className="inline-flex items-center gap-2 text-[1rem] font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-primary)]"
                href={`/docente/biblioteca/nuevo?courseSlug=${slug}&back=${encodeURIComponent(`/mis-cursos/${slug}/seguimiento`)}`}
              >
                <Plus className="h-4 w-4" />
                Publicar rápido...
              </Link>
            </section>

            <section aria-labelledby="milestones-heading">
              <h2
                className="text-[0.84rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]"
                id="milestones-heading"
              >
                Próximos hitos
              </h2>

              {upcomingMilestones.length ? (
                <div className="mt-5 space-y-5">
                  {upcomingMilestones.map((item, index) => (
                    <Link
                      className="relative block pl-6"
                      href={item.href}
                      key={item.id}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-[4px] top-[8px] h-2.5 w-2.5 rounded-full bg-[var(--color-ink)]"
                      />
                      {index < upcomingMilestones.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-[-1.4rem] left-[8px] top-[18px] w-px bg-[rgba(22,60,88,0.12)]"
                        />
                      ) : null}

                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[rgba(96,113,133,0.88)]">
                        {formatDateTime(item.date)}
                      </p>
                      <p className="mt-1.5 text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="ui-empty-state mt-4 px-5 py-5 text-sm leading-7 text-[var(--color-muted)]">
                  No hay próximos hitos fechados en el modelo actual del curso.
                </div>
              )}
            </section>
          </aside>
        </section>

        <section className="mt-12 space-y-4" id="review-detail">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Revisión en detalle
              </p>
              <h2 className="font-premium mt-2 text-display-md font-semibold text-[var(--color-ink)]">
                Entregas del curso
              </h2>
            </div>
            <ButtonLink
              href={buildCourseResourcesHref(slug, "resource-manager-top")}
              variant="neutral"
            >
              Abrir recursos
            </ButtonLink>
          </div>

          {reviewResources.length ? (
            reviewResources.map((resource) => (
              <Card className="overflow-hidden p-0" key={resource.id}>
                <div className="border-b border-[rgba(22,60,88,0.08)] px-5 py-5 lg:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {resource.moduleTitle ? (
                          <Badge tone="outline">{resource.moduleTitle}</Badge>
                        ) : null}
                        <Badge tone="outline">{resource.resourceTypeLabel}</Badge>
                        {resource.dueAt ? (
                          <Badge tone="warning">
                            Entrega hasta {formatDateTime(resource.dueAt)}
                          </Badge>
                        ) : null}
                        {(resource.submissionStats?.pending ?? 0) > 0 ? (
                          <Badge tone="warning">
                            {resource.submissionStats?.pending ?? 0} pendientes
                          </Badge>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="font-premium text-heading-lg font-semibold text-[var(--color-ink)]">
                          {resource.title}
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-ink-soft)]">
                          {resource.description}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.78)] px-4 py-3 text-sm leading-6 text-[var(--color-ink-soft)] lg:w-[18rem]">
                      <p className="font-medium text-[var(--color-ink)]">
                        {resource.submissions.length} entregas registradas
                      </p>
                      <p className="mt-1">
                        {resource.createdByName
                          ? `Publicado por ${resource.createdByName}.`
                          : "Publicado en el campus."}
                      </p>
                      <Link
                        className="mt-3 inline-flex items-center gap-2 font-medium text-[var(--color-primary)]"
                        href={buildCourseResourcesHref(slug, `resource-${resource.id}`)}
                      >
                        Abrir en recursos
                        <MoveRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 px-5 py-5 lg:px-6">
                  {resource.submissions.map((submission) => (
                    <CourseExerciseReviewForm
                      courseSlug={slug}
                      key={submission.id}
                      passingScore={resource.passingScore}
                      submission={submission}
                    />
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6">
              <div className="ui-empty-state px-5 py-6 text-[1rem] leading-7 text-[var(--color-muted)]">
                {exerciseResources.length
                  ? "Hay ejercicios publicados, pero todavía no existen entregas reales para revisar."
                  : "Todavía no hay ejercicios publicados en el curso. Usa la pestaña de recursos para activarlos cuando haga falta."}
              </div>
            </Card>
          )}
        </section>

        <section className="mt-12 space-y-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Seguimiento del grupo
            </p>
            <h2 className="font-premium mt-2 text-display-md font-semibold text-[var(--color-ink)]">
              Avance manual
            </h2>
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
                const learnerExercises = learnerExerciseByUserId.get(row.userId);

                return (
                  <Card className="p-4 sm:p-5" key={row.userId}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[1.08rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                            {row.learnerName}
                          </p>
                          <Badge tone={accessMeta.tone}>{accessMeta.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {row.learnerEmail}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--color-ink-soft)]">
                        <span>
                          Última actividad{" "}
                          <strong className="text-[var(--color-ink)]">
                            {row.lastCompletedAt
                              ? formatRelativeTime(row.lastCompletedAt)
                              : "sin registro"}
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

                    <div className="mt-4 grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)]">
                      <div className="rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.84)] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Progreso
                        </p>
                        <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                          {row.completionRate}%
                        </p>
                      </div>

                      <div className="rounded-lg border border-[rgba(22,60,88,0.08)] bg-white/72 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--color-ink)]">
                            {row.completedModules} de {row.totalModules} módulos completados
                          </p>
                          <span className="text-sm text-[var(--color-muted)]">
                            {row.lastCompletedAt
                              ? formatDateTime(row.lastCompletedAt)
                              : "Sin actividad"}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(22,60,88,0.08)]">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)]"
                            style={{ width: `${row.completionRate}%` }}
                          />
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                          {learnerExercises
                            ? learnerExercises.averageScore !== null
                              ? `Entregas: ${learnerExercises.submissionCount}. Media actual: ${learnerExercises.averageScore.toFixed(1)}/10. Pendientes: ${learnerExercises.pendingCount}.`
                              : `Entregas: ${learnerExercises.submissionCount}. Pendientes: ${learnerExercises.pendingCount}. Todavía no hay nota media registrada.`
                            : "Sin entregas de ejercicios registradas por ahora."}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6">
              <div className="ui-empty-state px-5 py-6 text-[1rem] leading-7 text-[var(--color-muted)]">
                Todavía no hay matrículas registradas o no existe progreso manual
                guardado para este curso.
              </div>
            </Card>
          )}
        </section>
      </div>
    </CourseWorkspaceShell>
  );
}
