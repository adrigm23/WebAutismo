import type { UserGlobalRole } from "@prisma/client";
import type { Metadata } from "next";
import {
  AccountSettingsPage,
  accountQuickLinkIcons,
  type AccountOverviewPanel,
} from "@/components/account/account-settings-page";
import { buildStudentPendingItems } from "@/components/account/student-dashboard-shared";
import { isDemoUserId } from "@/lib/demo-auth";
import { requireUser } from "@/lib/auth";
import {
  getDashboardNotificationSnapshot,
  getStudentDashboardPendingSources,
  getTeacherDashboardCourseSummaries,
  type DashboardNotificationSnapshot,
} from "@/lib/account-dashboard";
import { buildCourseForumHref, buildCourseTrackingHref } from "@/lib/course-navigation";
import { getUserCourseSpaces, type UserCourseSpace } from "@/lib/course-community";
import {
  getCourseProgressDetailsMapForUser,
  type CourseProgressDetails,
} from "@/lib/course-progress";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getDb } from "@/lib/prisma";
import { getCurrentSessionId } from "@/lib/user-sessions";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: {
    index: false,
    follow: false,
  },
};

type StudentCourseEntry = {
  space: UserCourseSpace;
  progress: CourseProgressDetails;
};

function getPrimaryCta(input: {
  globalRole: UserGlobalRole;
  primarySpace: UserCourseSpace | null;
}) {
  if (input.globalRole === "ADMIN") {
    return {
      href: "/admin",
      label: "Abrir administracion",
    };
  }

  return {
    href: "/mis-cursos",
    label: input.primarySpace?.course.title ?? "Ir a mis cursos",
  };
}

function sortSpaces(spaces: UserCourseSpace[]) {
  return [...spaces].sort((left, right) => {
    const leftState =
      left.accessState === "active"
        ? 3
        : left.accessState === "scheduled"
          ? 2
          : left.accessState === "inactive"
            ? 1
            : 0;
    const rightState =
      right.accessState === "active"
        ? 3
        : right.accessState === "scheduled"
          ? 2
          : right.accessState === "inactive"
            ? 1
            : 0;

    if (leftState !== rightState) {
      return rightState - leftState;
    }

    const leftActivity =
      left.enrollment?.accessStartsAt.getTime() ?? left.purchase?.createdAt.getTime() ?? 0;
    const rightActivity =
      right.enrollment?.accessStartsAt.getTime() ?? right.purchase?.createdAt.getTime() ?? 0;

    return rightActivity - leftActivity;
  });
}

function getPrimarySpace(input: {
  globalRole: UserGlobalRole;
  staffSpaces: UserCourseSpace[];
  studentSpaces: UserCourseSpace[];
}) {
  if (input.globalRole === "ADMIN" || input.globalRole === "TEACHER") {
    return sortSpaces(input.staffSpaces)[0] ?? sortSpaces(input.studentSpaces)[0] ?? null;
  }

  return sortSpaces(input.studentSpaces)[0] ?? sortSpaces(input.staffSpaces)[0] ?? null;
}

function buildFallbackProgress(space: UserCourseSpace): CourseProgressDetails {
  return {
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
  };
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

function getNotificationTitles(snapshot: DashboardNotificationSnapshot) {
  const platformTitles = snapshot.platformNotifications.notifications.map(
    (notification) => notification.title,
  );
  const forumTitles = snapshot.forumNotifications.notifications.map(
    (notification) => notification.title,
  );

  return [...platformTitles, ...forumTitles].slice(0, 3);
}

function buildOverviewPanel(input: {
  globalRole: UserGlobalRole;
  studentCourses: StudentCourseEntry[];
  notificationSnapshot: DashboardNotificationSnapshot;
  pendingSources: Awaited<ReturnType<typeof getStudentDashboardPendingSources>>;
  teacherSummaries: Awaited<ReturnType<typeof getTeacherDashboardCourseSummaries>>;
}) {
  const notificationTitles = getNotificationTitles(input.notificationSnapshot);
  const primaryStudentCourse = getPrimaryStudentCourse(input.studentCourses);

  if (primaryStudentCourse) {
    const pendingItems = buildStudentPendingItems(input.pendingSources);
    const nextModule = primaryStudentCourse.progress.modules.find((module) => !module.isCompleted);
    const itemTitles = [
      ...pendingItems.map((item) => item.title),
      nextModule ? `Modulo ${nextModule.index + 1}: ${nextModule.title}` : null,
      ...notificationTitles,
    ].filter((value): value is string => Boolean(value));

    return {
      title: "Tu progreso",
      value: `${primaryStudentCourse.progress.completionRate}% completado`,
      detail: primaryStudentCourse.space.course.title,
      progressPercent: primaryStudentCourse.progress.completionRate,
      sectionLabel: pendingItems.length ? "Siguientes pasos" : "Continua con",
      items: itemTitles.slice(0, 3),
      actionHref: "/mis-cursos",
      actionLabel: "Ir a mis cursos",
    } satisfies AccountOverviewPanel;
  }

  if (input.globalRole === "TEACHER") {
    const primarySummary = input.teacherSummaries[0] ?? null;
    const reviewCompletion =
      primarySummary && primarySummary.totalSubmissionCount > 0
        ? Math.round(
            (primarySummary.reviewedSubmissionCount / primarySummary.totalSubmissionCount) * 100,
          )
        : null;
    const reviewTitles = primarySummary
      ? [
          ...primarySummary.pendingReviewItems.map(
            (item) => `${item.resourceTitle} - ${item.learnerName}`,
          ),
          ...primarySummary.recentSubmissionActivity.map((item) => item.title),
          ...notificationTitles,
        ]
      : notificationTitles;

    return {
      title: "Actividad docente",
      value: primarySummary?.pendingReviewItems.length
        ? `${primarySummary.pendingReviewItems.length} revisiones abiertas`
        : "Sin revisiones pendientes",
      detail: primarySummary?.space.course.title ?? "Seguimiento del campus privado",
      progressPercent: reviewCompletion,
      sectionLabel: primarySummary?.pendingReviewItems.length ? "Pendientes" : "Contexto actual",
      items: reviewTitles.slice(0, 3),
      actionHref: "/mis-cursos",
      actionLabel: "Abrir seguimiento",
    } satisfies AccountOverviewPanel;
  }

  return {
    title: "Estado de acceso",
    value: input.notificationSnapshot.unreadCount
      ? `${input.notificationSnapshot.unreadCount} avisos sin leer`
      : "Cuenta activa",
    detail: "Seguridad, sesiones y soporte del campus privado.",
    progressPercent: null,
    sectionLabel: "Revision rapida",
    items: [
      "Correo principal disponible para acceso y avisos.",
      "Sesiones activas visibles desde esta cuenta.",
      ...(notificationTitles.length ? [notificationTitles[0]] : ["Soporte contextual disponible."]),
    ].slice(0, 3),
    actionHref: "/soporte",
    actionLabel: "Abrir soporte",
  } satisfies AccountOverviewPanel;
}

function buildQuickLinks(input: {
  globalRole: UserGlobalRole;
  primaryForumHref: string | null;
  teachingHref: string | null;
  hasCourseArea: boolean;
}) {
  const items: Array<{
    href: string;
    title: string;
    description: string;
    icon: (typeof accountQuickLinkIcons)[keyof typeof accountQuickLinkIcons];
    badge?: string;
  }> = [];

  if (input.globalRole !== "ADMIN" || input.hasCourseArea) {
    items.push({
      href: "/mis-cursos",
      title: "Mis cursos",
      description: "Abre tu area operativa real sin mezclarla con ajustes de cuenta.",
      icon: accountQuickLinkIcons.courses,
    });
  }

  if (input.primaryForumHref) {
    items.push({
      href: input.primaryForumHref,
      title: "Foro",
      description: "Entra en el foro privado asociado a tu curso con contexto disponible.",
      icon: accountQuickLinkIcons.forum,
    });
  }

  if (input.globalRole === "TEACHER" && input.teachingHref) {
    items.push({
      href: input.teachingHref,
      title: "Seguimiento",
      description: "Vuelve al seguimiento docente del curso que tienes activo ahora.",
      icon: accountQuickLinkIcons.teaching,
    });
  }

  if (input.globalRole === "ADMIN") {
    items.push({
      href: "/admin",
      title: "Administracion",
      description: "Entra en el backoffice separado sin mezclarlo con tus ajustes personales.",
      icon: accountQuickLinkIcons.admin,
    });
  }

  items.push({
    href: "/soporte",
    title: "Soporte",
    description: "Consulta ayuda y canales de contacto del campus privado.",
    icon: accountQuickLinkIcons.support,
  });

  return items;
}

export default async function AccountPage() {
  const user = await requireUser("/mi-cuenta");
  const isDemoUser = isDemoUserId(user.id);
  const spaces = await getUserCourseSpaces({
    userId: user.id,
    email: user.email,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });
  const staffSpaces = spaces.filter((space) => isStaffCourseRole(space.role));
  const studentSpaces = spaces.filter((space) => !isStaffCourseRole(space.role));
  const primarySpace = getPrimarySpace({
    globalRole: user.globalRole,
    staffSpaces,
    studentSpaces,
  });
  const primaryForumHref = primarySpace ? buildCourseForumHref(primarySpace.course.slug) : null;
  const teachingHref =
    user.globalRole === "TEACHER" && primarySpace
      ? buildCourseTrackingHref({ courseSlug: primarySpace.course.slug })
      : user.globalRole === "TEACHER"
        ? "/mis-cursos"
        : null;
  const notificationSnapshotPromise = getDashboardNotificationSnapshot({
    userId: user.id,
    courseSlugs: spaces.map((space) => space.course.slug),
  });
  const progressByCoursePromise = getCourseProgressDetailsMapForUser({
    userId: user.id,
    courses: studentSpaces.map((space) => space.course),
  });
  const pendingSourcesPromise = getStudentDashboardPendingSources({
    spaces: studentSpaces,
    userId: user.id,
  });
  const teacherSummariesPromise = getTeacherDashboardCourseSummaries({
    spaces: staffSpaces,
    learnerSummariesByCourse: new Map(),
  });
  const activeSessionsPromise = getDb().userSession.findMany({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      ipAddress: true,
      lastSeenAt: true,
      userAgent: true,
    },
  });

  const [notificationSnapshot, progressByCourse, pendingSources, teacherSummaries, currentSessionId, activeSessions] = await Promise.all([
    notificationSnapshotPromise,
    progressByCoursePromise,
    pendingSourcesPromise,
    teacherSummariesPromise,
    getCurrentSessionId(),
    activeSessionsPromise,
  ]);

  const studentCourses = studentSpaces.map((space) => ({
    space,
    progress: progressByCourse.get(space.course.slug) ?? buildFallbackProgress(space),
  }));

  const sessions = activeSessions
    .map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }))
    .sort((left, right) => {
      if (left.isCurrent !== right.isCurrent) {
        return left.isCurrent ? -1 : 1;
      }

      const leftActivity = left.lastSeenAt?.getTime() ?? left.createdAt.getTime();
      const rightActivity = right.lastSeenAt?.getTime() ?? right.createdAt.getTime();

      return rightActivity - leftActivity;
    });

  return (
    <AccountSettingsPage
      email={user.email}
      emailVerifiedAt={user.emailVerifiedAt}
      firstName={user.name.split(" ")[0] || user.name}
      fullName={user.name}
      globalRole={user.globalRole}
      isDemoUser={isDemoUser}
      notificationSnapshot={notificationSnapshot}
      overviewPanel={buildOverviewPanel({
        globalRole: user.globalRole,
        studentCourses,
        notificationSnapshot,
        pendingSources,
        teacherSummaries,
      })}
      primaryCta={getPrimaryCta({
        globalRole: user.globalRole,
        primarySpace,
      })}
      quickLinks={buildQuickLinks({
        globalRole: user.globalRole,
        primaryForumHref,
        teachingHref,
        hasCourseArea: spaces.length > 0,
      })}
      sessions={sessions}
    />
  );
}
