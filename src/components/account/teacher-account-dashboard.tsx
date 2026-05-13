import Link from "next/link";
import {
  Bell,
  BookOpenCheck,
  CircleHelp,
  FileClock,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquareText,
  Settings2,
  Users
} from "lucide-react";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { logoutAction } from "@/actions/session";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserCourseSpace } from "@/lib/course-community";
import type { CourseLearnerProgressRow } from "@/lib/course-progress";
import type { CampusResourceItem } from "@/lib/course-resources";
import type { ForumNotificationListItem } from "@/lib/forum";
import { siteConfig } from "@/lib/site";
import { cn, formatCompactNumber, formatDateTime, formatRelativeTime } from "@/lib/utils";

type NotificationPreferenceShape = {
  emailEnabled: boolean;
  webEnabled: boolean;
};

type PlatformNotificationItem = {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
};

type TeacherCourseDashboard = {
  space: UserCourseSpace;
  learners: CourseLearnerProgressRow[];
  resources: CampusResourceItem[];
};

type TeacherAccountDashboardProps = {
  fullName: string;
  firstName: string;
  isDemoUser: boolean;
  hasTeacherRoleWithoutCourses: boolean;
  teacherCourses: TeacherCourseDashboard[];
  preference: NotificationPreferenceShape;
  platformNotifications: {
    notifications: PlatformNotificationItem[];
    unreadCount: number;
  };
  forumNotifications: {
    notifications: ForumNotificationListItem[];
    unreadCount: number;
  };
};

type TeacherPendingItem = {
  id: string;
  href: string;
  courseTitle: string;
  resourceTitle: string;
  learnerName: string;
  submittedAt: Date;
  statusLabel: string;
};

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}...`;
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "D";
}

function getManagedResourceCount(resources: CampusResourceItem[]) {
  return resources.filter((resource) => resource.isManaged).length;
}

function getExerciseCount(resources: CampusResourceItem[]) {
  return resources.filter((resource) => resource.isExercise && resource.isManaged).length;
}

function getPendingReviewItems(course: TeacherCourseDashboard) {
  const pending: TeacherPendingItem[] = [];

  for (const resource of course.resources) {
    if (!resource.isExercise) {
      continue;
    }

    for (const submission of resource.submissions) {
      if (submission.status !== "SUBMITTED") {
        continue;
      }

      pending.push({
        id: submission.id,
        href: `/mis-cursos/${course.space.course.slug}/seguimiento`,
        courseTitle: course.space.course.title,
        resourceTitle: resource.title,
        learnerName: submission.studentName,
        submittedAt: submission.submittedAt,
        statusLabel: submission.statusLabel
      });
    }
  }

  return pending.sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime());
}

function getAverageCompletionRate(learners: CourseLearnerProgressRow[]) {
  if (learners.length === 0) {
    return 0;
  }

  return Math.round(
    learners.reduce((total, learner) => total + learner.completionRate, 0) / learners.length
  );
}

function getPrimaryTeacherCourse(courses: TeacherCourseDashboard[]) {
  return [...courses].sort((left, right) => {
    const leftPending = getPendingReviewItems(left).length;
    const rightPending = getPendingReviewItems(right).length;

    if (leftPending !== rightPending) {
      return rightPending - leftPending;
    }

    const leftLearners = left.learners.length;
    const rightLearners = right.learners.length;

    if (leftLearners !== rightLearners) {
      return rightLearners - leftLearners;
    }

    const leftManagedResources = getManagedResourceCount(left.resources);
    const rightManagedResources = getManagedResourceCount(right.resources);

    return rightManagedResources - leftManagedResources;
  })[0] ?? null;
}

function buildTeacherActivity(input: {
  courses: TeacherCourseDashboard[];
  forumNotifications: TeacherAccountDashboardProps["forumNotifications"]["notifications"];
  platformNotifications: TeacherAccountDashboardProps["platformNotifications"]["notifications"];
}) {
  const submissionItems = input.courses.flatMap((course) =>
    course.resources.flatMap((resource) =>
      resource.submissions.map((submission) => ({
        id: `submission-${submission.id}`,
        href: `/mis-cursos/${course.space.course.slug}/seguimiento`,
        title:
          submission.status === "REVIEWED"
            ? `Entrega revisada en ${course.space.course.title}`
            : `Nueva entrega en ${course.space.course.title}`,
        body:
          submission.status === "REVIEWED"
            ? `${submission.studentName} ya tiene revision en "${resource.title}".`
            : `${submission.studentName} ha enviado "${resource.title}".`,
        createdAt: submission.reviewedAt ?? submission.submittedAt,
        tone: submission.status === "REVIEWED" ? ("teacher" as const) : ("student" as const),
        sourceLabel: submission.status === "REVIEWED" ? "Revision" : "Entrega"
      }))
    )
  );

  const platformItems = input.platformNotifications.map((notification) => ({
    id: `platform-${notification.id}`,
    href: notification.linkPath,
    title: notification.title,
    body: truncateText(notification.body, 140),
    createdAt: notification.createdAt,
    tone: "teacher" as const,
    sourceLabel: "Plataforma"
  }));

  const forumItems = input.forumNotifications.map((notification) => ({
    id: `forum-${notification.id}`,
    href: notification.linkPath,
    title: notification.title,
    body: truncateText(notification.body, 140),
    createdAt: notification.createdAt,
    tone: "student" as const,
    sourceLabel: "Foro"
  }));

  return [...submissionItems, ...platformItems, ...forumItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 6);
}

function getUnreadSummary(input: TeacherAccountDashboardProps) {
  return input.platformNotifications.unreadCount + input.forumNotifications.unreadCount;
}

function getFirstCoursePaths(course: TeacherCourseDashboard | null) {
  if (!course) {
    return {
      campusHref: "/mi-cuenta",
      trackingHref: "/mi-cuenta",
      forumHref: "/mi-cuenta"
    };
  }

  return {
    campusHref: `/mis-cursos/${course.space.course.slug}`,
    trackingHref: `/mis-cursos/${course.space.course.slug}/seguimiento`,
    forumHref: `/mis-cursos/${course.space.course.slug}/foro`
  };
}

function getGlobalSummary(courses: TeacherCourseDashboard[]) {
  const allPending = courses.flatMap((course) => getPendingReviewItems(course));
  const activeLearners = new Set(courses.flatMap((course) => course.learners.map((learner) => learner.userId)))
    .size;
  const resources = courses.reduce((total, course) => total + getManagedResourceCount(course.resources), 0);
  const exercises = courses.reduce((total, course) => total + getExerciseCount(course.resources), 0);
  const completionRate =
    courses.length > 0
      ? Math.round(
          courses.reduce((total, course) => total + getAverageCompletionRate(course.learners), 0) /
            courses.length
        )
      : 0;

  return {
    pendingReviews: allPending.length,
    activeLearners,
    resources,
    exercises,
    averageCompletionRate: completionRate
  };
}

function getReviewedSubmissionsCount(courses: TeacherCourseDashboard[]) {
  return courses.reduce(
    (total, course) =>
      total +
      course.resources.reduce(
        (resourceTotal, resource) =>
          resourceTotal + resource.submissions.filter((submission) => submission.status === "REVIEWED").length,
        0
      ),
    0
  );
}

function getTotalSubmissionsCount(courses: TeacherCourseDashboard[]) {
  return courses.reduce(
    (total, course) =>
      total +
      course.resources.reduce((resourceTotal, resource) => resourceTotal + resource.submissions.length, 0),
    0
  );
}

export function TeacherAccountDashboard({
  fullName,
  firstName,
  isDemoUser,
  hasTeacherRoleWithoutCourses,
  teacherCourses,
  preference,
  platformNotifications,
  forumNotifications
}: TeacherAccountDashboardProps) {
  const primaryCourse = getPrimaryTeacherCourse(teacherCourses);
  const secondaryCourses = primaryCourse
    ? teacherCourses.filter((course) => course.space.course.slug !== primaryCourse.space.course.slug)
    : teacherCourses;
  const initials = getInitials(fullName);
  const paths = getFirstCoursePaths(primaryCourse);
  const globalSummary = getGlobalSummary(teacherCourses);
  const recentActivity = buildTeacherActivity({
    courses: teacherCourses,
    forumNotifications: forumNotifications.notifications,
    platformNotifications: platformNotifications.notifications
  });
  const pendingReviewItems = teacherCourses
    .flatMap((course) => getPendingReviewItems(course))
    .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime())
    .slice(0, 6);
  const reviewedSubmissions = getReviewedSubmissionsCount(teacherCourses);
  const totalSubmissions = getTotalSubmissionsCount(teacherCourses);
  const unreadSummary = getUnreadSummary({
    fullName,
    firstName,
    isDemoUser,
    hasTeacherRoleWithoutCourses,
    teacherCourses,
    preference,
    platformNotifications,
    forumNotifications
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f4f7fb_52%,#fbfaf8_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-start">
        <aside className="hidden h-screen w-[18.5rem] shrink-0 self-start overflow-y-auto border-r border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.72)] px-6 py-8 backdrop-blur-md xl:sticky xl:top-0 xl:flex xl:flex-col">
          <Link
            className="text-[1.6rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-primary)]"
            href="/mi-cuenta"
          >
            Panel Docente
          </Link>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{siteConfig.name}</p>

          <div className="mt-8 flex items-center gap-4 rounded-[24px] border border-[var(--color-border)] bg-white p-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary-soft)] text-lg font-semibold text-[var(--color-primary)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-muted)]">Docencia activa</p>
              <p className="truncate text-lg font-semibold text-[var(--color-ink)]">{fullName}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            {primaryCourse ? (
              <ButtonLink href={paths.trackingHref}>Ver seguimiento</ButtonLink>
            ) : (
              <a
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition hover:bg-[var(--color-primary-strong)]"
                href={`mailto:${siteConfig.supportEmail}`}
              >
                Contactar soporte
              </a>
            )}
          </div>

          <nav aria-label="Navegacion docente" className="mt-8 space-y-2">
            {[
              {
                label: "Dashboard",
                href: "/mi-cuenta",
                icon: LayoutDashboard,
                active: true
              },
              {
                label: "Mis cursos",
                href: "#mis-cursos",
                icon: GraduationCap,
                active: false
              },
              {
                label: "Seguimiento",
                href: paths.trackingHref,
                icon: LineChart,
                active: false
              },
              {
                label: "Foro",
                href: paths.forumHref,
                icon: MessageSquareText,
                active: false
              },
              {
                label: "Recursos",
                href: paths.campusHref,
                icon: FolderKanban,
                active: false
              }
            ].map(({ label, href, icon: Icon, active }) => (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-[1rem] font-medium transition",
                  active
                    ? "bg-[rgba(12,113,195,0.14)] text-[var(--color-primary)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                )}
                href={href}
                key={label}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-[rgba(12,113,195,0.12)] pt-6">
            <Link
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[1rem] font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
              href="#preferencias"
            >
              <Settings2 className="h-5 w-5" />
              Ajustes
            </Link>
            <form action={logoutAction}>
              <Button className="w-full justify-start px-4 py-3" type="submit" variant="ghost">
                <LogOut className="mr-3 h-5 w-5" />
                Cerrar sesion
              </Button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.92)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)]"
                  href="/mi-cuenta"
                >
                  {siteConfig.shortName}
                </Link>
                <nav aria-label="Navegacion superior docente" className="hidden items-center gap-3 md:flex">
                  <ButtonLink href="/mi-cuenta" variant="ghost">
                    Mi cuenta
                  </ButtonLink>
                  <ButtonLink href={paths.trackingHref} variant="ghost">
                    Seguimiento
                  </ButtonLink>
                  <ButtonLink href={paths.forumHref} variant="ghost">
                    Foro
                  </ButtonLink>
                  <a
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                    href={`mailto:${siteConfig.supportEmail}`}
                  >
                    Soporte
                  </a>
                </nav>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="#actividad-docente" variant="ghost">
                  <Bell className="mr-2 h-4 w-4" />
                  Avisos
                  {unreadSummary ? (
                    <span className="ml-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
                      {unreadSummary}
                    </span>
                  ) : null}
                </ButtonLink>
                <ButtonLink href="#preferencias" variant="ghost">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Preferencias
                </ButtonLink>
                <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-3 py-2">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{fullName}</p>
                    <p className="text-xs text-[var(--color-muted)]">Docente</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-6 py-10 lg:px-10">
            {isDemoUser ? (
              <Card className="mb-8 border-[#f0d098] bg-[#fff1cf] p-6">
                <p className="text-lg font-semibold text-[#7c5300]">Modo demo activo</p>
                <p className="mt-2 text-base leading-7 text-[#805c16]">
                  Estas navegando con una cuenta docente de prueba sin base de datos. Puedes revisar
                  la experiencia, pero los cambios no se guardan.
                </p>
              </Card>
            ) : null}

            <section className="grid gap-8">
              <Card className="overflow-hidden border-[rgba(12,113,195,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,238,248,0.82))] p-8 lg:p-10">
                <div className="max-w-4xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                    Dashboard docente
                  </p>
                  <h1 className="mt-4 text-[3.8rem] font-semibold leading-[1.02] tracking-[-0.07em] text-[var(--color-ink)]">
                    Hola, {firstName}. Aqui tienes tus cursos activos, entregas pendientes y
                    actividad reciente del campus.
                  </h1>
                  <p className="mt-5 max-w-3xl text-[1.12rem] leading-9 text-[var(--color-ink)]/84">
                    Revisa tu panel para mantener al dia el seguimiento del alumnado, los recursos
                    publicados y las participaciones en el foro.
                  </p>
                </div>
              </Card>

              {primaryCourse ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
                  <Card className="overflow-hidden border-[rgba(12,113,195,0.2)] p-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1fr)]">
                      <CourseArtwork
                        className="h-full min-h-[18rem] w-full rounded-[28px] border-0"
                        course={primaryCourse.space.course}
                        variant="hero"
                      />

                      <div className="flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge tone="accent">Curso prioritario</Badge>
                            <Badge tone="muted">{primaryCourse.space.role}</Badge>
                          </div>
                          <h2 className="mt-5 text-[3rem] font-semibold leading-[1.04] tracking-[-0.05em] text-[var(--color-ink)]">
                            {primaryCourse.space.course.title}
                          </h2>
                          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                            {primaryCourse.learners.length
                              ? `${primaryCourse.learners.length} alumnos con seguimiento activo y ${getPendingReviewItems(primaryCourse).length} entregas pendientes de revision.`
                              : "Todavia no hay alumnado con progreso registrado en este curso."}
                          </p>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                          <div className="rounded-[24px] bg-[var(--color-surface)] p-5">
                            <p className="text-[2rem] font-semibold text-[var(--color-ink)]">
                              {getPendingReviewItems(primaryCourse).length}
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                              Entregas pendientes
                            </p>
                          </div>
                          <div className="rounded-[24px] bg-[var(--color-surface)] p-5">
                            <p className="text-[2rem] font-semibold text-[var(--color-ink)]">
                              {getManagedResourceCount(primaryCourse.resources)}
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                              Recursos gestionados
                            </p>
                          </div>
                          <div className="rounded-[24px] bg-[var(--color-surface)] p-5">
                            <p className="text-[2rem] font-semibold text-[var(--color-ink)]">
                              {getAverageCompletionRate(primaryCourse.learners)}%
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                              Progreso medio
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                          <ButtonLink href={paths.campusHref}>Entrar al campus</ButtonLink>
                          <ButtonLink href={paths.trackingHref} variant="secondary">
                            Ver seguimiento
                          </ButtonLink>
                          <ButtonLink href={paths.forumHref} variant="ghost">
                            Abrir foro
                          </ButtonLink>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <Card className="p-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-[var(--color-primary)]" />
                        <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          Seguimiento global
                        </h2>
                      </div>

                      <div className="mt-6 space-y-5 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--color-muted)]">Alumnos activos</span>
                          <span className="text-xl font-semibold text-[var(--color-ink)]">
                            {formatCompactNumber(globalSummary.activeLearners)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--color-muted)]">Entregas revisadas</span>
                          <span className="text-xl font-semibold text-[var(--color-ink)]">
                            {totalSubmissions > 0
                              ? `${Math.round((reviewedSubmissions / totalSubmissions) * 100)}%`
                              : "0%"}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)]"
                            style={{
                              width: `${totalSubmissions > 0 ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--color-muted)]">Progreso medio</span>
                          <span className="text-xl font-semibold text-[var(--color-ink)]">
                            {globalSummary.averageCompletionRate}%
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-[var(--color-primary)]"
                            style={{ width: `${globalSummary.averageCompletionRate}%` }}
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6" id="actividad-docente">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-[var(--color-primary)]" />
                        <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                          Actividad reciente
                        </h2>
                      </div>

                      <div className="mt-6 space-y-4">
                        {recentActivity.length ? (
                          recentActivity.slice(0, 3).map((item) => (
                            <Link
                              className="block rounded-[22px] border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-primary)]"
                              href={item.href}
                              key={item.id}
                            >
                              <div className="flex items-center gap-3">
                                <Badge tone={item.tone}>{item.sourceLabel}</Badge>
                                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                  {formatRelativeTime(item.createdAt)}
                                </p>
                              </div>
                              <p className="mt-3 text-lg font-semibold leading-tight text-[var(--color-ink)]">
                                {item.title}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                                {item.body}
                              </p>
                            </Link>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)]">
                            Sin actividad reciente. Las actualizaciones del alumnado apareceran aqui
                            cuando haya entregas, avisos o movimiento en el foro.
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="overflow-hidden border-[rgba(12,113,195,0.18)] p-8 lg:p-10">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
                    <div>
                      <Badge tone="teacher">Estado actual</Badge>
                      <h2 className="mt-6 text-[3.3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                        Aun no tienes cursos asignados
                      </h2>
                      <p className="mt-4 max-w-2xl text-[1.08rem] leading-8 text-[var(--color-muted)]">
                        Tu panel de docencia esta listo. En cuanto se te asigne un curso o una
                        edicion, aqui aparecera tu centro de control, seguimiento y entregas.
                      </p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <a
                          className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(12,113,195,0.18)] transition hover:bg-[var(--color-primary-strong)]"
                          href={`mailto:${siteConfig.supportEmail}`}
                        >
                          Contactar con administracion
                        </a>
                        <a
                          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                          href={`mailto:${siteConfig.supportEmail}`}
                        >
                          Ir a soporte
                        </a>
                      </div>
                    </div>

                    <div className="grid place-items-center">
                      <div className="grid h-56 w-56 place-items-center rounded-full bg-[radial-gradient(circle,rgba(229,238,248,0.95)_0%,rgba(248,246,241,0.45)_70%)] text-[var(--color-primary)]">
                        <BookOpenCheck className="h-20 w-20" />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
                <Card className="p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileClock className="h-5 w-5 text-[var(--color-primary)]" />
                      <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                        Pendiente de revisar
                      </h2>
                    </div>
                    {primaryCourse ? (
                      <ButtonLink href={paths.trackingHref} variant="ghost">
                        Ver seguimiento
                      </ButtonLink>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-4">
                    {pendingReviewItems.length ? (
                      pendingReviewItems.map((item) => (
                        <Link
                          className="block rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
                          href={item.href}
                          key={item.id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-lg font-semibold leading-tight text-[var(--color-ink)]">
                                {item.resourceTitle}
                              </p>
                              <p className="mt-2 text-sm text-[var(--color-muted)]">
                                {item.learnerName} · {item.courseTitle}
                              </p>
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Entregada {formatDateTime(item.submittedAt)}
                              </p>
                            </div>
                            <Badge tone="muted">{item.statusLabel}</Badge>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                        No hay entregas pendientes por revisar en este momento.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      Foro y comunidad
                    </h2>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Avisos del foro
                      </p>
                      <p className="mt-3 text-[2rem] font-semibold text-[var(--color-ink)]">
                        {forumNotifications.unreadCount}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        Notificaciones no leidas asociadas a tus cursos.
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Recursos
                      </p>
                      <p className="mt-3 text-[2rem] font-semibold text-[var(--color-ink)]">
                        {globalSummary.resources}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        Materiales o ejercicios gestionados desde el campus.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <ButtonLink href={paths.forumHref} variant="secondary">
                        Abrir foro
                      </ButtonLink>
                      <ButtonLink href={paths.campusHref} variant="ghost">
                        Ir a recursos
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              </div>

              <section id="mis-cursos">
                <div className="mb-6 flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                    Tus cursos
                  </h2>
                </div>

                {secondaryCourses.length ? (
                  <div className="grid gap-6 xl:grid-cols-2">
                    {secondaryCourses.map((course) => (
                      <Card className="overflow-hidden p-0" key={`teacher-course-${course.space.course.slug}`}>
                        <CourseArtwork
                          className="h-52 w-full rounded-none border-0"
                          course={course.space.course}
                        />
                        <div className="p-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge tone="teacher">{course.space.role}</Badge>
                            <Badge tone="muted">{course.space.course.level}</Badge>
                            <Badge tone="muted">{course.space.course.format}</Badge>
                          </div>

                          <h3 className="mt-4 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-ink)]">
                            {course.space.course.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                            {course.learners.length
                              ? `${course.learners.length} alumnos, ${getPendingReviewItems(course).length} entregas pendientes y ${getManagedResourceCount(course.resources)} recursos gestionados.`
                              : "Todavia no hay seguimiento registrado para este curso."}
                          </p>

                          <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-[20px] bg-[var(--color-surface)] p-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {course.learners.length}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Alumnos
                              </p>
                            </div>
                            <div className="rounded-[20px] bg-[var(--color-surface)] p-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {getPendingReviewItems(course).length}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Pendientes
                              </p>
                            </div>
                            <div className="rounded-[20px] bg-[var(--color-surface)] p-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">
                                {getExerciseCount(course.resources)}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                Ejercicios
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <ButtonLink href={`/mis-cursos/${course.space.course.slug}`}>
                              Entrar al campus
                            </ButtonLink>
                            <ButtonLink
                              href={`/mis-cursos/${course.space.course.slug}/seguimiento`}
                              variant="secondary"
                            >
                              Ver seguimiento
                            </ButtonLink>
                            <ButtonLink href={`/mis-cursos/${course.space.course.slug}/foro`} variant="ghost">
                              Foro
                            </ButtonLink>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : primaryCourse ? (
                  <Card className="p-8">
                    <p className="text-[1.6rem] font-semibold text-[var(--color-ink)]">
                      Este es tu curso docente principal
                    </p>
                    <p className="mt-3 max-w-3xl text-[1rem] leading-8 text-[var(--color-muted)]">
                      Cuando tengas mas asignaciones activas, apareceran aqui con su acceso directo
                      a campus, seguimiento y foro.
                    </p>
                  </Card>
                ) : hasTeacherRoleWithoutCourses ? (
                  <Card className="p-8">
                    <p className="text-[1.04rem] leading-8 text-[var(--color-ink)]/84">
                      Aun no hay cursos asignados a tu cuenta docente.
                    </p>
                  </Card>
                ) : null}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]" id="preferencias">
                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <CircleHelp className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      Soporte docente
                    </h2>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Operativa
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                        Usa el seguimiento para revisar progreso del alumnado y el campus del curso
                        para gestionar recursos y ejercicios.
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Contacto
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                        Si necesitas soporte organizativo o acceso a nuevas ediciones, escribe a{" "}
                        {siteConfig.supportEmail}.
                      </p>
                    </div>
                  </div>

                  <a
                    className="mt-6 inline-flex items-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                    href={`mailto:${siteConfig.supportEmail}`}
                  >
                    Contactar soporte
                  </a>
                </Card>

                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-[var(--color-primary)]" />
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      Preferencias
                    </h2>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      {
                        title: "Solo email",
                        description: "Recibe avisos por correo y reduce ruido dentro del panel.",
                        emailEnabled: true,
                        webEnabled: false
                      },
                      {
                        title: "Solo web",
                        description: "Centraliza las alertas dentro de la cuenta docente.",
                        emailEnabled: false,
                        webEnabled: true
                      },
                      {
                        title: "Email y web",
                        description: "Mantiene sincronizados correo y panel privado.",
                        emailEnabled: true,
                        webEnabled: true
                      }
                    ].map((option) => {
                      const isSelected =
                        preference.emailEnabled === option.emailEnabled &&
                        preference.webEnabled === option.webEnabled;

                      return (
                        <form action={updateNotificationPreferencesAction} key={option.title}>
                          <input
                            name="emailEnabled"
                            type="hidden"
                            value={option.emailEnabled ? "true" : "false"}
                          />
                          <input
                            name="webEnabled"
                            type="hidden"
                            value={option.webEnabled ? "true" : "false"}
                          />
                          <button
                            className={cn(
                              "w-full rounded-[22px] border px-5 py-4 text-left transition",
                              isSelected
                                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                            )}
                            type="submit"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-lg font-semibold text-[var(--color-ink)]">{option.title}</p>
                              <Badge tone={isSelected ? "teacher" : "muted"}>
                                {isSelected ? "Activa" : "Disponible"}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                              {option.description}
                            </p>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </Card>
              </section>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
