import type { UserGlobalRole } from "@prisma/client";
import type { Metadata } from "next";
import { AccountSettingsPage, accountQuickLinkIcons } from "@/components/account/account-settings-page";
import { isDemoUserId } from "@/lib/demo-auth";
import { requireUser } from "@/lib/auth";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { buildCourseForumHref, buildCourseTrackingHref } from "@/lib/course-navigation";
import { getUserCourseSpaces, type UserCourseSpace } from "@/lib/course-community";
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

function getPrimaryCta(globalRole: UserGlobalRole) {
  if (globalRole === "ADMIN") {
    return {
      href: "/admin",
      label: "Abrir administracion",
    };
  }

  return globalRole === "TEACHER"
    ? {
        href: "/mis-cursos",
        label: "Abrir docencia",
      }
    : {
        href: "/mis-cursos",
        label: "Ver mis cursos",
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
      title: "Docencia",
      description: "Vuelve al seguimiento y a las rutas docentes del curso prioritario.",
      icon: accountQuickLinkIcons.teaching,
    });
  }

  if (input.globalRole === "ADMIN") {
    items.push({
      href: "/admin",
      title: "Administracion",
      description: "Abre la consola de administracion sin cambiar permisos ni rutas.",
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

  const [notificationSnapshot, currentSessionId, activeSessions] = await Promise.all([
    notificationSnapshotPromise,
    getCurrentSessionId(),
    activeSessionsPromise,
  ]);

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
      primaryCta={getPrimaryCta(user.globalRole)}
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
