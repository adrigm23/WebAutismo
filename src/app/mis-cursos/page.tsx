import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageSquareText,
  PlayCircle,
} from "lucide-react";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import { CourseArtwork } from "@/components/course-artwork";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
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
import { getDb } from "@/lib/prisma";
import { isStaffCourseRole } from "@/lib/course-roles";
import { siteConfig } from "@/lib/site";
import { cn, formatDateTime, getInitials } from "@/lib/utils";

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
  // FIX #2: si el curso está completado, no mostrar "siguiente módulo" — no hay ninguno pendiente
  if (course.progress.isCompleted) return null;
  return course.progress.modules.find((module) => !module.isCompleted) ?? course.progress.modules.at(-1) ?? null;
}

function getStudentCourseMeta(course: StudentCourseEntry) {
  const nextModule = getNextModule(course);

  if (!nextModule) {
    return "Curso listo para iniciar.";
  }

  if (course.progress.isCompleted) {
    return `Curso completado · ${course.progress.totalModules} módulos revisados`;
  }

  return `Módulo ${nextModule.index + 1}: ${nextModule.title}`;
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

type DashboardMaterialResource = {
  id: string;
  isManaged: boolean;
  isExercise: boolean;
  createdAt: Date | null;
  title: string;
  moduleTitle: string | null;
};

function buildRecentManagedResources(input: {
  resourcesByCourse: Array<{
    courseSlug: string;
    courseTitle: string;
    resources: DashboardMaterialResource[];
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
            eyebrow: "En revisión",
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
      icon: BookOpen,
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

function StepIconShell(input: {
  icon: typeof CalendarClock;
  tone?: "default" | "warning" | "brand";
}) {
  return (
    <div
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full border",
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

function buildStudentNavItems(communityHref: string): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: communityHref, icon: "community" },
    { label: "Calendario", href: "/calendario", icon: "calendar" },
    { label: "Biblioteca", href: "/biblioteca", icon: "library" },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
  ];
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
      // Single query for non-exercise materials across all student courses
      // (dashboard only needs id/title/moduleTitle/createdAt for recent resources widget)
      (async () => {
        if (studentSpaces.length === 0) return [];
        const materials = await getDb().courseResource.findMany({
          where: {
            courseId: { in: studentSpaces.map((s) => s.course.id) },
            type: "MATERIAL",
            isPublished: true,
          },
          select: {
            id: true,
            courseId: true,
            title: true,
            createdAt: true,
            module: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return studentSpaces.map((space) => ({
          courseSlug: space.course.slug,
          courseTitle: space.course.title,
          resources: materials
            .filter((r) => r.courseId === space.course.id)
            .map((r) => ({
              id: r.id,
              title: r.title,
              moduleTitle: r.module?.title ?? null,
              createdAt: r.createdAt,
              isManaged: true,
              isExercise: false,
            })),
        }));
      })(),
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
  const communityHref = "/comunidad";
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
  // FIX #4: cuando no hay entregas, no mostrar "0% revisado" — es engañoso
  const teacherReviewCompletion =
    primaryTeacherSummary && primaryTeacherSummary.totalSubmissionCount > 0
      ? Math.round(
          (primaryTeacherSummary.reviewedSubmissionCount /
            primaryTeacherSummary.totalSubmissionCount) *
            100,
        )
      : null; // null = sin entregas aún (distinto de 0% = hay entregas sin revisar)
  const totalPendingReviews = teacherSummaries.reduce(
    (sum, s) => sum + s.pendingReviewItems.length,
    0,
  );
  const unreadCount = notificationSnapshot.unreadCount;
  const nextModule = primaryStudentCourse ? getNextModule(primaryStudentCourse) : null;
  const isPureTeacher = !primaryStudentCourse && teacherCourses.length > 0;
  const heroSubtitle = primaryStudentCourse?.progress.hasStarted
    ? "Continúa donde lo dejaste."
    : primaryStudentCourse
      ? "Todo listo para empezar."
      : teacherCourses.length
        ? "Gestiona tus cursos y revisa la actividad de tus alumnos."
        : "Bienvenido de nuevo al campus.";
  const { tab } = await searchParams;
  const activeTab = tab === "completados" ? "completados" : "en-curso";
  const inProgressCourses = studentCourses.filter((c) => !c.progress.isCompleted);
  const completedCourses = studentCourses.filter((c) => c.progress.isCompleted);
  // Exclude the hero course from the grid — it's already shown prominently above
  const gridCourses = (activeTab === "completados" ? completedCourses : inProgressCourses)
    .filter((c) => c.space.course.slug !== heroCourseSlug);
  const tabCourses = gridCourses;

  return (
    <StudentShell
      fullName={user.name}
      initials={getInitials(user.name)}
      navItems={buildStudentNavItems(communityHref)}
      notificationsCount={unreadCount}
      roleLabel={roleLabel}
    >
      <div className="site-container py-8 sm:py-10">
        <section className="max-w-[48rem]">
          <h1 className="font-premium text-display-lg font-semibold text-[var(--color-ink)]">
            {isPureTeacher
              ? `Bienvenido, ${user.name.split(" ")[0] || user.name}.`
              : `Hola, ${user.name.split(" ")[0] || user.name}.`}
          </h1>
          <p className="mt-2 max-w-[38rem] text-body-md text-[var(--color-ink-soft)]">
            {isPureTeacher
              ? "Gestiona tus cursos y acompaña el progreso de tus alumnos."
              : heroSubtitle}
          </p>
          {isPureTeacher && (
            <p className="mt-1 max-w-[38rem] text-body-sm text-[var(--color-muted)]">
              Revisa entregas, responde dudas y mantén actualizada la actividad de tus formaciones.
            </p>
          )}
        </section>

        {/* Métricas rápidas para docentes */}
        {isPureTeacher && (
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/90 px-4 py-4 shadow-[var(--shadow-soft)]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Cursos activos
              </p>
              <p className="mt-1.5 font-premium text-display-sm font-semibold text-[var(--color-ink)]">
                {teacherCourses.length}
              </p>
            </div>
            <div className={cn(
              "rounded-xl border px-4 py-4 shadow-[var(--shadow-soft)]",
              totalPendingReviews > 0
                ? "border-[rgba(209,88,62,0.18)] bg-[rgba(252,238,233,0.7)]"
                : "border-[rgba(22,60,88,0.08)] bg-white/90",
            )}>
              <p className={cn(
                "text-[0.72rem] font-semibold uppercase tracking-[0.16em]",
                totalPendingReviews > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-muted)]",
              )}>
                Entregas pendientes
              </p>
              <p className={cn(
                "mt-1.5 font-premium text-display-sm font-semibold",
                totalPendingReviews > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-ink)]",
              )}>
                {totalPendingReviews}
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-[var(--color-brand-soft)] px-4 py-4 shadow-[var(--shadow-soft)]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                  Notificaciones
                </p>
                <p className="mt-1.5 font-premium text-display-sm font-semibold text-[var(--color-primary)]">
                  {unreadCount}
                </p>
              </div>
            )}
          </section>
        )}

        {heroCourse ? (
          <section className="mt-8">
            <Link
              className="group block overflow-hidden rounded-xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[0_2px_12px_rgba(30,58,95,0.06)] transition hover:shadow-[0_4px_20px_rgba(30,58,95,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              href={
                primaryStudentCourse
                  ? `/mis-cursos/${primaryStudentCourse.space.course.slug}`
                  : primaryTeacherCourse?.teachingHref ?? "/soporte"
              }
            >
              <div className="grid sm:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* Imagen izquierda */}
                <div className="h-52 sm:h-full overflow-hidden">
                  <CourseArtwork
                    className="h-full w-full rounded-none border-0 transition-transform duration-500 group-hover:scale-105"
                    course={heroCourse.space.course}
                    variant="card"
                  />
                </div>
                {/* Contenido derecha */}
                <div className="flex flex-col justify-between p-6 sm:p-7">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#065f46]">
                        {primaryStudentCourse
                          ? primaryStudentCourse.progress.isCompleted
                            ? "Completado"
                            : primaryStudentCourse.progress.hasStarted
                              ? "En progreso"
                              : "Disponible"
                          : "Docencia activa"}
                      </span>
                      {nextModule && (
                        <span className="text-[0.8rem] text-[var(--color-ink-soft)]">
                          Módulo {nextModule.index + 1}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 text-[1.35rem] font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition sm:text-[1.5rem]">
                      {heroCourse.space.course.title}
                    </h2>
                    {nextModule && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
                        <PlayCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                        <span className="line-clamp-1">{nextModule.title}</span>
                      </p>
                    )}
                    <div className="mt-5">
                      <div className="mb-1.5 flex items-center justify-between text-[0.75rem] font-medium text-[var(--color-ink-soft)]">
                        <span>Progreso</span>
                        <span className="font-semibold text-[#059669]">
                          {primaryStudentCourse
                            ? `${primaryStudentCourse.progress.completionRate}% completado`
                            : teacherReviewCompletion !== null
                              ? `${teacherReviewCompletion}% revisado`
                              : "Sin entregas aún"}
                        </span>
                      </div>
                      <ProgressBar
                        tone={primaryStudentCourse?.progress.isCompleted ? "success" : "brand"}
                        value={primaryStudentCourse ? primaryStudentCourse.progress.completionRate : (teacherReviewCompletion ?? 0)}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--color-primary-strong)]">
                      {primaryStudentCourse
                        ? primaryStudentCourse.progress.isCompleted
                          ? "Repasar"
                          : primaryStudentCourse.progress.hasStarted
                            ? "Continuar"
                            : "Empezar"
                        : "Abrir seguimiento"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-xl border border-[rgba(22,60,88,0.09)] bg-white px-6 py-8 shadow-[0_2px_12px_rgba(30,58,95,0.06)] sm:px-8">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
              Campus activo
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[var(--color-ink)]">
              Todavía no tienes recorridos activos
            </h2>
            <p className="mt-2 max-w-[42rem] text-sm text-[var(--color-ink-soft)]">
              Explora el catálogo y activa tu siguiente curso.
            </p>
            <div className="mt-5">
              <ButtonLink href="/cursos">Explorar catálogo</ButtonLink>
            </div>
          </section>
        )}


        {/* Only show the Mis Cursos section if there are courses beyond the hero */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div>
            {/* Section heading — hide when student has only the hero course */}
            {(isPureTeacher || studentCourses.length > 1) && (
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[var(--color-ink)]">
                {isPureTeacher ? "Tus cursos asignados" : "Mis Cursos"}
              </h2>
              {studentCourses.length > 0 && (
                <Link
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition hover:opacity-75"
                  href="/cursos"
                >
                  Ver todos <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            )}

            {/* Tabs — only for students with multiple courses */}
            {studentCourses.length > 1 && (
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

            {/* Course list */}
            {studentCourses.length > 0 ? (
              tabCourses.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {tabCourses.map((course) => {
                    const nextOpenModule = getNextModule(course);
                    const isDone = course.progress.isCompleted;
                    return (
                      <Link
                        className="group flex flex-col overflow-hidden rounded-xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[0_1px_4px_rgba(30,58,95,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(30,58,95,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                        href={buildCourseContentHref(course.space.course.slug, {
                          moduleIndex: nextOpenModule?.index ?? 0,
                        })}
                        key={course.space.course.slug}
                      >
                        {/* Thumbnail */}
                        <div className="h-40 overflow-hidden">
                          <CourseArtwork
                            className="h-full w-full rounded-none border-0 transition-transform duration-500 group-hover:scale-105"
                            course={course.space.course}
                            variant="card"
                          />
                        </div>
                        {/* Content */}
                        <div className="flex flex-1 flex-col p-4">
                          <h3 className="text-[0.95rem] font-semibold leading-snug text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
                            {course.space.course.title}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-[0.8rem] text-[var(--color-ink-soft)]">
                            {getStudentCourseMeta(course)}
                          </p>
                          <div className="mt-3 pt-3 border-t border-[rgba(22,60,88,0.07)]">
                            {isDone ? (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[0.8rem] text-[var(--color-success)]">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Completado
                                </span>
                                <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[0.8rem] text-[var(--color-ink-soft)]">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  {course.progress.hasStarted
                                    ? `Módulo ${nextOpenModule ? nextOpenModule.index + 1 : "?"}`
                                    : "Sin iniciar"}
                                </span>
                                <span className="text-sm font-semibold text-[#059669]">
                                  {course.progress.completionRate}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
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
              <div className="mt-6 flex flex-col divide-y divide-[rgba(22,60,88,0.07)]">
                {teacherCourses.map((course) => (
                  <Link
                    className="group flex gap-5 py-6 first:pt-2 transition hover:opacity-90"
                    href={course.teachingHref}
                    key={course.space.course.slug}
                  >
                    <div className="h-28 w-40 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-44">
                      <CourseArtwork
                        className="h-full w-full rounded-xl border-0"
                        course={course.space.course}
                        variant="card"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">Docencia</Badge>
                        <Badge tone="outline">
                          {course.space.course.activeEdition?.label ?? "Curso asignado"}
                        </Badge>
                      </div>
                      <h3 className="font-premium text-heading-md font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
                        {course.space.course.title}
                      </h3>
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
                        Abrir seguimiento
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-[rgba(22,60,88,0.08)] bg-white/60 px-6 py-10 text-center">
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

          <aside className="xl:sticky xl:top-8 space-y-4">

            {/* Card 1: Próximos pasos */}
            <div className="rounded-xl border border-[rgba(22,60,88,0.09)] bg-white p-5 shadow-[0_1px_4px_rgba(30,58,95,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
                    <CalendarClock className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
                  </span>
                  <h2 className="text-[0.95rem] font-bold text-[var(--color-ink)]">
                    {isPureTeacher ? "Gestión docente" : "Próximos pasos"}
                  </h2>
                </div>
                {unreadCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1.5 text-[0.62rem] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="mt-4 divide-y divide-[rgba(22,60,88,0.07)]">
                {nextSteps.map((step) => (
                  <Link
                    className="group block py-3.5 first:pt-0 last:pb-0"
                    href={step.href}
                    key={step.id}
                  >
                    <div className="flex items-start gap-3">
                      <StepIconShell icon={step.icon} tone={step.tone} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[0.72rem] font-semibold uppercase tracking-[0.06em]",
                            step.tone === "warning"
                              ? "text-[var(--color-danger)]"
                              : step.tone === "brand"
                                ? "text-[var(--color-primary)]"
                                : "text-[var(--color-ink-soft)]",
                          )}
                        >
                          {step.eyebrow}
                        </p>
                        <h3 className="mt-0.5 text-sm font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)] line-clamp-2">
                          {step.title}
                        </h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-[0.78rem] font-medium text-[var(--color-primary)]">
                          {step.ctaLabel}
                          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {!nextSteps.length ? (
                <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
                  {isPureTeacher
                    ? "Sin tareas pendientes en este momento."
                    : "Todo al día. Volverá a mostrar tareas cuando haya actividad."}
                </p>
              ) : null}
            </div>

          </aside>
        </section>
      </div>
    </StudentShell>
  );
}
