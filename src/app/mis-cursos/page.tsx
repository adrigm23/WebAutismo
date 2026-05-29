import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpenText,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  MessageSquareText,
} from "lucide-react";
import { CampusPrivateHeader } from "@/components/learning/campus-private-header";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import {
  getDashboardNotificationSnapshot,
  getStudentDashboardPendingSources,
  getTeacherDashboardCourseSummaries,
  type DashboardNotificationSnapshot,
} from "@/lib/account-dashboard";
import { getUserCourseSpaces, type UserCourseSpace } from "@/lib/course-community";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref,
  buildCourseSupportHref,
  buildCourseTrackingHref,
  resolvePlatformNotificationHref,
} from "@/lib/course-navigation";
import { getCourseProgressDetailsMapForUser, type CourseProgressDetails } from "@/lib/course-progress";
import { getCampusResources } from "@/lib/course-resources";
import { isStaffCourseRole } from "@/lib/course-roles";
import { siteConfig } from "@/lib/site";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mis cursos",
  robots: {
    index: false,
    follow: false,
  },
};

type StudentCourseEntry = {
  space: UserCourseSpace;
  progress: CourseProgressDetails;
};

type TeacherCourseEntry = {
  space: UserCourseSpace;
  teachingHref: string;
};

type CampusStepItem = {
  id: string;
  href: string;
  icon: typeof CalendarClock;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  tone?: "default" | "warning" | "brand";
};

type RecentManagedResource = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  moduleTitle: string | null;
  createdAt: Date;
};

type NotificationActivityItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  createdAt: Date;
  icon: typeof Bell;
};

function getInitials(name: string) {
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

function getRoleLabel(input: {
  studentCount: number;
  staffCount: number;
}) {
  if (input.studentCount && input.staffCount) {
    return "Alumno y docente";
  }

  return input.staffCount ? "Docente" : "Alumno";
}

function getPrimaryStudentCourse(courses: StudentCourseEntry[]) {
  return [...courses].sort((left, right) => {
    const leftInProgress =
      left.progress.hasStarted && !left.progress.isCompleted
        ? 3
        : left.progress.hasStarted
          ? 2
          : 1;
    const rightInProgress =
      right.progress.hasStarted && !right.progress.isCompleted
        ? 3
        : right.progress.hasStarted
          ? 2
          : 1;

    if (leftInProgress !== rightInProgress) {
      return rightInProgress - leftInProgress;
    }

    const leftLastActivity =
      left.progress.lastCompletedAt?.getTime() ??
      left.space.enrollment?.accessStartsAt.getTime() ??
      left.space.purchase?.createdAt.getTime() ??
      0;
    const rightLastActivity =
      right.progress.lastCompletedAt?.getTime() ??
      right.space.enrollment?.accessStartsAt.getTime() ??
      right.space.purchase?.createdAt.getTime() ??
      0;

    return rightLastActivity - leftLastActivity;
  })[0] ?? null;
}

function getPrimaryTeacherCourse(courses: TeacherCourseEntry[]) {
  return [...courses].sort((left, right) => {
    const leftAccessStartsAt =
      left.space.enrollment?.accessStartsAt.getTime() ??
      left.space.purchase?.createdAt.getTime() ??
      0;
    const rightAccessStartsAt =
      right.space.enrollment?.accessStartsAt.getTime() ??
      right.space.purchase?.createdAt.getTime() ??
      0;

    return rightAccessStartsAt - leftAccessStartsAt;
  })[0] ?? null;
}

function getNextModule(course: StudentCourseEntry) {
  return course.progress.modules.find((module) => !module.isCompleted) ?? course.progress.modules.at(-1) ?? null;
}

function getStudentCourseMeta(course: StudentCourseEntry) {
  const nextModule = getNextModule(course);

  if (!nextModule) {
    return "Curso listo para iniciar.";
  }

  if (course.progress.isCompleted) {
    return `Curso completado · ${course.progress.totalModules} modulos revisados`;
  }

  return `Modulo ${nextModule.index + 1}: ${nextModule.title}`;
}

function getStudentCourseDescription(course: StudentCourseEntry) {
  if (course.progress.lastCompletedAt) {
    return `Ultima actividad ${formatRelativeTime(course.progress.lastCompletedAt)}.`;
  }

  return course.progress.hasStarted
    ? `${course.progress.pendingModules} modulos pendientes.`
    : "Aun no has comenzado este recorrido.";
}

function buildNotificationActivity(snapshot: DashboardNotificationSnapshot) {
  const platformItems: NotificationActivityItem[] = snapshot.platformNotifications.notifications.map((notification) => ({
    id: `platform-${notification.id}`,
    href: resolvePlatformNotificationHref({
      category: notification.category,
      linkPath: notification.linkPath,
      metadataJson: notification.metadataJson,
    }),
    title: notification.title,
    description: notification.body,
    eyebrow: "Campus",
    createdAt: notification.createdAt,
    icon: Bell,
  }));

  const forumItems: NotificationActivityItem[] = snapshot.forumNotifications.notifications.map((notification) => ({
    id: `forum-${notification.id}`,
    href: notification.linkPath,
    title: notification.title,
    description: notification.body,
    eyebrow: "Comunidad",
    createdAt: notification.createdAt,
    icon: MessageSquareText,
  }));

  return [...platformItems, ...forumItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 3);
}

function buildRecentManagedResources(input: {
  resourcesByCourse: Array<{
    courseSlug: string;
    courseTitle: string;
    resources: Awaited<ReturnType<typeof getCampusResources>>;
  }>;
}) {
  return input.resourcesByCourse
    .flatMap(({ courseSlug, courseTitle, resources }) =>
      resources
        .filter((resource) => resource.isManaged && !resource.isExercise && resource.createdAt)
        .map((resource) => ({
          id: resource.id,
          courseSlug,
          courseTitle,
          title: resource.title,
          moduleTitle: resource.moduleTitle,
          createdAt: resource.createdAt!,
        })),
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

function buildStudentSteps(input: {
  primaryStudentCourse: StudentCourseEntry | null;
  teacherCourses: TeacherCourseEntry[];
  pendingSources: Awaited<ReturnType<typeof getStudentDashboardPendingSources>>;
  recentResources: RecentManagedResource[];
  notificationSnapshot: DashboardNotificationSnapshot;
}) {
  const steps: CampusStepItem[] = [];
  const pendingItems = input.pendingSources
    .flatMap((resource) => {
      const href = buildCourseResourcesHref(resource.courseSlug, `resource-${resource.resourceId}`);

      if (resource.viewerSubmission?.status === "CHANGES_REQUESTED") {
        return [
          {
            id: `changes-${resource.resourceId}`,
            href,
            icon: ClipboardList,
            eyebrow: "Cambios solicitados",
            title: resource.title,
            description: resource.viewerSubmission.feedback
              ? resource.viewerSubmission.feedback
              : `Tu docente ha solicitado ajustes en ${resource.courseTitle}.`,
            ctaLabel: "Abrir entrega",
            tone: "warning" as const,
          },
        ];
      }

      if (!resource.viewerSubmission && !resource.isSubmissionClosed) {
        return [
          {
            id: `pending-${resource.resourceId}`,
            href,
            icon: CalendarClock,
            eyebrow: resource.dueAt
              ? `Entrega hasta ${formatDateTime(resource.dueAt)}`
              : "Tarea disponible",
            title: resource.title,
            description: `Pendiente en ${resource.courseTitle}.`,
            ctaLabel: "Resolver",
            tone: "brand" as const,
          },
        ];
      }

      if (resource.viewerSubmission?.status === "SUBMITTED") {
        return [
          {
            id: `submitted-${resource.resourceId}`,
            href,
            icon: ClipboardList,
            eyebrow: "En revision",
            title: resource.title,
            description: `Entrega enviada en ${resource.courseTitle}.`,
            ctaLabel: "Ver estado",
          },
        ];
      }

      return [];
    })
    .slice(0, 2);

  steps.push(...pendingItems);

  if (input.recentResources[0]) {
    const resource = input.recentResources[0];
    steps.push({
      id: `resource-${resource.id}`,
      href: buildCourseResourcesHref(resource.courseSlug, `resource-${resource.id}`),
      icon: BookOpenText,
      eyebrow: "Nuevo recurso",
      title: resource.title,
      description: resource.moduleTitle
        ? `${resource.courseTitle} · ${resource.moduleTitle}`
        : `${resource.courseTitle} · Material publicado`,
      ctaLabel: "Abrir material",
    });
  }

  const notification = buildNotificationActivity(input.notificationSnapshot)[0];

  if (notification) {
    steps.push({
      id: notification.id,
      href: notification.href,
      icon: notification.icon,
      eyebrow: notification.eyebrow,
      title: notification.title,
      description: notification.description,
      ctaLabel: "Revisar",
    });
  }

  if (input.teacherCourses[0]) {
    steps.push({
      id: `teaching-${input.teacherCourses[0].space.course.slug}`,
      href: input.teacherCourses[0].teachingHref,
      icon: GraduationCap,
      eyebrow: "Docencia activa",
      title: input.teacherCourses[0].space.course.title,
      description: "Mantienes un curso asignado como docente desde esta misma zona privada.",
      ctaLabel: "Abrir seguimiento",
    });
  }

  if (!steps.length && input.primaryStudentCourse) {
    steps.push({
      id: `community-${input.primaryStudentCourse.space.course.slug}`,
      href: buildCourseSupportHref(input.primaryStudentCourse.space.course.slug),
      icon: MessageSquareText,
      eyebrow: "Comunidad y soporte",
      title: "Abrir ayuda del curso",
      description: "Entra en el foro privado o revisa los materiales de apoyo del curso activo.",
      ctaLabel: "Abrir soporte",
    });
  }

  if (!steps.length) {
    steps.push({
      id: "support",
      href: "/soporte",
      icon: MessageSquareText,
      eyebrow: "Soporte",
      title: "Hablar con el equipo",
      description: `Escribe a ${siteConfig.supportEmail} si necesitas ayuda con acceso o contenidos.`,
      ctaLabel: "Abrir soporte",
    });
  }

  return steps.slice(0, 3);
}

function buildTeacherSteps(input: {
  teacherCourses: TeacherCourseEntry[];
  teacherSummaries: Awaited<ReturnType<typeof getTeacherDashboardCourseSummaries>>;
  notificationSnapshot: DashboardNotificationSnapshot;
}) {
  const steps: CampusStepItem[] = [];
  const pendingReviews = input.teacherSummaries
    .flatMap((summary) =>
      summary.pendingReviewItems.map((item) => ({
        id: item.id,
        href: item.href,
        icon: ClipboardList,
        eyebrow: item.statusLabel,
        title: item.resourceTitle,
        description: `${item.learnerName} · ${item.courseTitle}`,
        ctaLabel: "Revisar",
        tone: "warning" as const,
      })),
    )
    .slice(0, 2);

  steps.push(...pendingReviews);

  const activity = input.teacherSummaries
    .flatMap((summary) =>
      summary.recentSubmissionActivity.map((item) => ({
        id: item.id,
        href: item.href,
        icon: GraduationCap,
        eyebrow: item.sourceLabel,
        title: item.title,
        description: item.body,
        ctaLabel: "Abrir seguimiento",
      })),
    )
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, 1);

  steps.push(...activity);

  const notification = buildNotificationActivity(input.notificationSnapshot)[0];

  if (notification) {
    steps.push({
      id: notification.id,
      href: notification.href,
      icon: notification.icon,
      eyebrow: notification.eyebrow,
      title: notification.title,
      description: notification.description,
      ctaLabel: "Revisar",
    });
  }

  if (input.teacherCourses[0] && steps.length < 3) {
    steps.push({
      id: `forum-${input.teacherCourses[0].space.course.slug}`,
      href: buildCourseForumHref(input.teacherCourses[0].space.course.slug),
      icon: MessageSquareText,
      eyebrow: "Comunidad",
      title: input.teacherCourses[0].space.course.title,
      description: "Abre el foro del curso asignado y mantente dentro del mismo contexto privado.",
      ctaLabel: "Ir al foro",
    });
  }

  if (steps.length < 3) {
    steps.push({
      id: "support",
      href: "/soporte",
      icon: MessageSquareText,
      eyebrow: "Soporte",
      title: "Hablar con el equipo",
      description: `Escribe a ${siteConfig.supportEmail} si necesitas ayuda con el campus.`,
      ctaLabel: "Abrir soporte",
    });
  }

  return steps.slice(0, 3);
}

function ProgressBar(input: {
  value: number;
  tone?: "light" | "brand";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-full",
        input.tone === "light" ? "bg-white/16" : "bg-[rgba(38,56,91,0.1)]",
        input.className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "h-full rounded-full",
          input.tone === "light" ? "bg-[rgba(245,248,252,0.96)]" : "bg-[var(--color-primary)]",
        )}
        style={{ width: `${Math.max(0, Math.min(100, input.value))}%` }}
      />
    </div>
  );
}

function StepIconShell(input: {
  icon: typeof CalendarClock;
  tone?: "default" | "warning" | "brand";
}) {
  return (
    <div
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] border",
        input.tone === "warning"
          ? "border-[rgba(209,88,62,0.18)] bg-[rgba(252,238,233,0.9)] text-[var(--color-danger)]"
          : input.tone === "brand"
            ? "border-[rgba(22,60,88,0.14)] bg-[rgba(223,234,243,0.88)] text-[var(--color-primary)]"
            : "border-[rgba(22,60,88,0.12)] bg-white text-[var(--color-primary)]",
      )}
    >
      <input.icon className="h-4 w-4" />
    </div>
  );
}

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/mis-cursos");
  const spaces = await getUserCourseSpaces({
    userId: user.id,
    email: user.email,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  const studentSpaces = spaces.filter((space) => !isStaffCourseRole(space.role));
  const staffSpaces = spaces.filter((space) => isStaffCourseRole(space.role));
  const [progressByCourse, notificationSnapshot, pendingSources, studentResourcesByCourse, teacherSummaries] =
    await Promise.all([
      getCourseProgressDetailsMapForUser({
        userId: user.id,
        courses: studentSpaces.map((space) => space.course),
      }),
      getDashboardNotificationSnapshot({
        userId: user.id,
        courseSlugs: spaces.map((space) => space.course.slug),
      }),
      getStudentDashboardPendingSources({
        spaces: studentSpaces,
        userId: user.id,
      }),
      Promise.all(
        studentSpaces.map(async (space) => ({
          courseSlug: space.course.slug,
          courseTitle: space.course.title,
          resources: await getCampusResources({
            course: space.course,
            viewerUserId: user.id,
            canModerate: false,
          }),
        })),
      ),
      getTeacherDashboardCourseSummaries({
        spaces: staffSpaces,
        learnerSummariesByCourse: new Map(),
      }),
    ]);

  const studentCourses = studentSpaces.map((space) => ({
    space,
    progress:
      progressByCourse.get(space.course.slug) ?? {
        courseSlug: space.course.slug,
        totalModules: space.course.modules.length,
        completedModules: 0,
        pendingModules: space.course.modules.length,
        completionRate: 0,
        hasStarted: false,
        isCompleted: false,
        lastCompletedAt: null,
        modules: space.course.modules.map((module, index) => ({
          id: module.id,
          index,
          title: module.title,
          description: module.description,
          estimatedTime: module.estimatedTime,
          resourcesSummary: module.resourcesSummary,
          isCompleted: false,
          completedAt: null,
        })),
      },
  })) satisfies StudentCourseEntry[];
  const teacherCourses = staffSpaces.map((space) => ({
    space,
    teachingHref: buildCourseTrackingHref({ courseSlug: space.course.slug }),
  })) satisfies TeacherCourseEntry[];

  const primaryStudentCourse = getPrimaryStudentCourse(studentCourses);
  const primaryTeacherCourse = getPrimaryTeacherCourse(teacherCourses);
  const heroCourse = primaryStudentCourse ?? primaryTeacherCourse;
  const heroCourseSlug = heroCourse?.space.course.slug ?? null;
  const recentResources = buildRecentManagedResources({
    resourcesByCourse: studentResourcesByCourse,
  });
  const roleLabel = getRoleLabel({
    studentCount: studentCourses.length,
    staffCount: teacherCourses.length,
  });
  const communityHref = heroCourseSlug ? buildCourseForumHref(heroCourseSlug) : "/soporte";
  const primaryTeacherSummary =
    primaryTeacherCourse
      ? teacherSummaries.find(
          (summary) => summary.space.course.slug === primaryTeacherCourse.space.course.slug,
        ) ?? null
      : null;
  const nextSteps = primaryStudentCourse
    ? buildStudentSteps({
        primaryStudentCourse,
        teacherCourses,
        pendingSources,
        recentResources,
        notificationSnapshot,
      })
    : buildTeacherSteps({
        teacherCourses,
        teacherSummaries,
        notificationSnapshot,
      });
  const teacherReviewCompletion =
    primaryTeacherSummary && primaryTeacherSummary.totalSubmissionCount > 0
      ? Math.round(
          (primaryTeacherSummary.reviewedSubmissionCount /
            primaryTeacherSummary.totalSubmissionCount) *
            100,
        )
      : 0;
  const unreadCount = notificationSnapshot.unreadCount;
  const nextModule = primaryStudentCourse ? getNextModule(primaryStudentCourse) : null;
  const heroSubtitle = primaryStudentCourse?.progress.hasStarted
    ? "Continúa donde lo dejaste."
    : primaryStudentCourse
      ? "Todo listo para empezar."
      : teacherCourses.length
        ? "Aquí está la actividad de tus cursos."
        : "Bienvenido de nuevo al campus.";
  const { tab } = await searchParams;
  const activeTab = tab === "completados" ? "completados" : "en-curso";
  const inProgressCourses = studentCourses.filter((c) => !c.progress.isCompleted);
  const completedCourses = studentCourses.filter((c) => c.progress.isCompleted);
  const tabCourses = activeTab === "completados" ? completedCourses : inProgressCourses;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(223,234,243,0.38),transparent_26%),linear-gradient(180deg,#faf7f2_0%,#f7f4ef_54%,#fbf9f5_100%)] pb-14">
      <CampusPrivateHeader
        fullName={user.name}
        initials={getInitials(user.name)}
        navItems={[
          { label: "Mis cursos", href: "/mis-cursos", active: true },
          { label: "Comunidad", href: communityHref },
          { label: "Soporte", href: "/soporte" },
        ]}
        notificationsCount={unreadCount}
        roleLabel={roleLabel}
      />

      <main className="site-container pt-8 sm:pt-10">
        <section className="max-w-[48rem]">
          <h1 className="font-premium text-display-lg font-semibold text-[var(--color-ink)]">
            Hola, {user.name.split(" ")[0] || user.name}.
          </h1>
          <p className="mt-2 max-w-[38rem] text-body-md text-[var(--color-ink-soft)]">
            {heroSubtitle}
          </p>
        </section>

        {heroCourse ? (
          <section className="mt-8">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#082637_0%,#0c2e43_64%,#10324a_100%)] px-5 py-6 shadow-[0_28px_60px_-34px_rgba(8,38,55,0.78)] sm:px-8 sm:py-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center lg:gap-10">
                {/* Text + progress + CTA */}
                <div className="flex min-w-0 flex-col gap-5">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                      {primaryStudentCourse ? "Continuar aprendiendo" : "Continuar docencia"}
                    </p>
                    <h2 className="font-premium mt-3 text-display-md font-semibold text-white">
                      {heroCourse.space.course.title}
                    </h2>

                    {primaryStudentCourse ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/75">
                        <span className="leading-6">
                          {nextModule
                            ? `Módulo ${nextModule.index + 1}: ${nextModule.title}`
                            : "Curso listo para continuar"}
                        </span>
                        <Badge className="bg-white/12 text-white/90" shape="pill" tone="neutral">
                          {primaryStudentCourse.progress.completionRate}% completado
                        </Badge>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/75">
                        <span className="leading-6">
                          {heroCourse.space.course.activeEdition?.label ?? "Curso asignado"}
                        </span>
                        <Badge className="bg-white/12 text-white/90" shape="pill" tone="neutral">
                          {primaryTeacherSummary?.pendingReviewItems.length ?? 0} entregas pendientes
                        </Badge>
                        {primaryTeacherSummary?.totalSubmissionCount ? (
                          <Badge className="bg-white/12 text-white/90" shape="pill" tone="neutral">
                            {teacherReviewCompletion}% revisado
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <ProgressBar
                    tone="light"
                    value={
                      primaryStudentCourse
                        ? primaryStudentCourse.progress.completionRate
                        : teacherReviewCompletion
                    }
                  />

                  <div>
                    <ButtonLink
                      className="w-full justify-between bg-white text-[var(--color-primary)] hover:bg-white hover:text-[var(--color-primary)] sm:w-auto sm:min-w-[13rem]"
                      href={
                        primaryStudentCourse
                          ? buildCourseContentHref(primaryStudentCourse.space.course.slug, {
                              moduleIndex: nextModule?.index ?? 0,
                            })
                          : primaryTeacherCourse?.teachingHref ?? "/soporte"
                      }
                      variant="neutral"
                    >
                      <span>{primaryStudentCourse ? "Retomar módulo" : "Abrir seguimiento"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>
                </div>

                {/* Course artwork — decorative, desktop only */}
                <div aria-hidden="true" className="hidden lg:block">
                  <CourseArtwork
                    className="h-48 w-full rounded-[1.5rem]"
                    course={heroCourse.space.course}
                    variant="card"
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-[2rem] border border-[rgba(22,60,88,0.08)] bg-white/86 px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Campus activo
            </p>
            <h2 className="font-premium mt-4 text-display-md font-semibold text-[var(--color-ink)]">
              Todavia no tienes recorridos activos
            </h2>
            <p className="mt-3 max-w-[42rem] text-body-sm text-[var(--color-ink-soft)]">
              Explora el catalogo y activa tu siguiente curso sin salir de la zona privada.
            </p>
            <div className="mt-5">
              <ButtonLink href="/cursos">Explorar catalogo</ButtonLink>
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
          <div>
            {/* Section heading */}
            <div>
              <h2 className="font-premium text-display-md font-semibold text-[var(--color-ink)]">
                Tu biblioteca de formación
              </h2>
              <p className="mt-1.5 text-body-sm text-[var(--color-ink-soft)]">
                {studentCourses.length
                  ? `${studentCourses.length} ${studentCourses.length === 1 ? "recorrido activo" : "recorridos activos"} en tu campus privado.`
                  : teacherCourses.length
                    ? "Cursos asignados como docente en tu zona privada."
                    : "Tu zona privada mostrará aquí los cursos que actives."}
              </p>
            </div>

            {/* Tabs — only for students */}
            {studentCourses.length > 0 && (
              <nav
                aria-label="Filtrar cursos"
                className="mt-6 flex w-fit gap-0.5 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.07)] bg-[var(--color-surface-muted)] p-1"
              >
                {([
                  { value: "en-curso", label: "En curso", count: inProgressCourses.length },
                  { value: "completados", label: "Completados", count: completedCourses.length },
                ] as const).map((t) => (
                  <Link
                    aria-current={activeTab === t.value ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1",
                      activeTab === t.value
                        ? "bg-white shadow-[var(--shadow-xs)] text-[var(--color-ink)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-ink-soft)]",
                    )}
                    href={`/mis-cursos?tab=${t.value}`}
                    key={t.value}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[0.62rem] font-semibold leading-none",
                          activeTab === t.value
                            ? "bg-[var(--color-brand-soft)] text-[var(--color-primary)]"
                            : "bg-[rgba(22,60,88,0.07)] text-[var(--color-muted)]",
                        )}
                      >
                        {t.count}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            )}

            {/* Course card grid */}
            {studentCourses.length > 0 ? (
              tabCourses.length > 0 ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {tabCourses.map((course) => {
                    const nextOpenModule = getNextModule(course);
                    return (
                      <Link
                        className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(22,60,88,0.08)] bg-white/90 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-medium)]"
                        href={buildCourseContentHref(course.space.course.slug, {
                          moduleIndex: nextOpenModule?.index ?? 0,
                        })}
                        key={course.space.course.slug}
                      >
                        <CourseArtwork
                          className="h-44 w-full rounded-none border-0 sm:h-48"
                          course={course.space.course}
                          variant="card"
                        />
                        <div className="flex flex-1 flex-col gap-4 p-5">
                          <div className="flex-1">
                            {course.progress.isCompleted && (
                              <Badge className="mb-2" tone="success">Completado</Badge>
                            )}
                            <h3 className="font-premium text-heading-md font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
                              {course.space.course.title}
                            </h3>
                            <p className="mt-1.5 text-body-sm text-[var(--color-ink-soft)]">
                              {getStudentCourseMeta(course)}
                            </p>
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm text-[var(--color-muted)]">
                                {getStudentCourseDescription(course)}
                              </span>
                              <span className="text-sm font-semibold text-[var(--color-primary)]">
                                {course.progress.completionRate}%
                              </span>
                            </div>
                            <ProgressBar value={course.progress.completionRate} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 rounded-[1.5rem] border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
                  <p className="font-premium text-heading-md font-semibold text-[var(--color-ink)]">
                    {activeTab === "completados" ? "Aún no has completado ningún curso" : "No hay cursos en progreso"}
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-body-sm text-[var(--color-ink-soft)]">
                    {activeTab === "completados"
                      ? "Cuando termines un recorrido, aparecerá aquí."
                      : "Tus cursos activos aparecerán en esta sección."}
                  </p>
                </div>
              )
            ) : teacherCourses.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {teacherCourses.map((course) => (
                  <Link
                    className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(22,60,88,0.08)] bg-white/90 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-medium)]"
                    href={course.teachingHref}
                    key={course.space.course.slug}
                  >
                    <CourseArtwork
                      className="h-44 w-full rounded-none border-0 sm:h-48"
                      course={course.space.course}
                      variant="card"
                    />
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">Docencia</Badge>
                        <Badge tone="outline">
                          {course.space.course.activeEdition?.label ?? "Curso asignado"}
                        </Badge>
                      </div>
                      <h3 className="font-premium mt-3 text-heading-md font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
                        {course.space.course.title}
                      </h3>
                      <p className="mt-2 text-body-sm text-[var(--color-ink-soft)]">
                        Abre seguimiento, campus y foro desde el mismo curso.
                      </p>
                      <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
                        Abrir seguimiento
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[1.5rem] border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
                <p className="font-premium text-heading-md font-semibold text-[var(--color-ink)]">
                  Tu biblioteca está vacía por ahora
                </p>
                <p className="mx-auto mt-2 max-w-xs text-body-sm text-[var(--color-ink-soft)]">
                  Activa tu primera matrícula para empezar tu recorrido de aprendizaje.
                </p>
                <div className="mt-6">
                  <ButtonLink href="/cursos">Explorar catálogo</ButtonLink>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[1.75rem] border border-[rgba(22,60,88,0.08)] bg-white/88 p-5 shadow-[var(--shadow-soft)] sm:p-6 xl:sticky xl:top-28">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-premium text-heading-lg font-semibold text-[var(--color-ink)]">
                  Próximos pasos
                </h2>
                <p className="mt-1.5 text-body-sm text-[var(--color-ink-soft)]">
                  Acciones reales del campus para no perder continuidad.
                </p>
              </div>
              {unreadCount ? <Badge tone="brand">{unreadCount} nuevas</Badge> : null}
            </div>

            <div className="mt-5 divide-y divide-[rgba(22,60,88,0.08)]">
              {nextSteps.map((step) => (
                <Link
                  className="group block py-4 first:pt-0 last:pb-0"
                  href={step.href}
                  key={step.id}
                >
                  <article className="flex items-start gap-4">
                    <StepIconShell icon={step.icon} tone={step.tone} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          step.tone === "warning"
                            ? "text-[var(--color-danger)]"
                            : step.tone === "brand"
                              ? "text-[var(--color-primary)]"
                              : "text-[var(--color-ink-soft)]",
                        )}
                      >
                        {step.eyebrow}
                      </p>
                      <h3 className="mt-1 text-heading-md font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-body-sm text-[var(--color-ink-soft)]">
                        {step.description}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                        {step.ctaLabel}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {!nextSteps.length ? (
              <div className="mt-5 rounded-[1.25rem] border border-[rgba(22,60,88,0.08)] bg-white/82 px-4 py-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Todo al dia por ahora
                </p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                  Cuando haya nuevas tareas, recursos o actividad de comunidad, apareceran aqui.
                </p>
              </div>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  );
}
