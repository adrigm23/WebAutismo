import type { Metadata } from "next";
import { StudentShell, type StudentShellNavItem } from "@/components/campus/student-shell";
import {
  NotificationCenter,
  type UnifiedNotification,
} from "@/components/platform/notifications/notification-center";
import { requireUser } from "@/lib/auth";
import { getDashboardNotificationSnapshot } from "@/lib/account-dashboard";
import { getUserCourseSpaces } from "@/lib/course-community";
import { isStaffCourseRole } from "@/lib/course-roles";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notificaciones",
  robots: { index: false, follow: false },
};

function buildNavItems(): StudentShellNavItem[] {
  return [
    { label: "Mi campus", href: "/mis-cursos", icon: "home" },
    { label: "Mensajes", href: "/mensajes", icon: "messages" },
    { label: "Comunidad", href: "/comunidad", icon: "community" },
    { label: "Biblioteca", href: "/app/recursos", icon: "library", disabled: true },
    { label: "Configuración", href: "/mi-cuenta", icon: "settings" },
  ];
}

function mapPlatformNotification(n: {
  id: string;
  category: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
}): UnifiedNotification {
  switch (n.category) {
    case "PURCHASE":
      return {
        id: `platform-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "certificate",
        filterTabs: ["all", "system"],
        actionLabel: "Descargar PDF",
        actionHref: n.linkPath,
      };
    case "COURSE":
      return {
        id: `platform-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "clipboard",
        filterTabs: ["all", "deliveries"],
      };
    case "SYSTEM":
      return {
        id: `platform-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "check",
        filterTabs: ["all", "system"],
      };
    default: // FORUM category
      return {
        id: `platform-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "reply",
        filterTabs: ["all"],
      };
  }
}

function mapForumNotification(n: {
  id: string;
  type: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
}): UnifiedNotification {
  switch (n.type) {
    case "MENTION":
      return {
        id: `forum-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "message",
        filterTabs: ["all", "mentions"],
      };
    case "TEACHER_ANNOUNCEMENT":
      return {
        id: `forum-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "calendar",
        filterTabs: ["all"],
        actionLabel: "Ver anuncio",
        actionHref: n.linkPath,
      };
    default: // THREAD_REPLY, THREAD_REPORTED, MODERATION_ACTION
      return {
        id: `forum-${n.id}`,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.readAt,
        createdAt: n.createdAt,
        iconType: "reply",
        filterTabs: ["all"],
      };
  }
}

export default async function NotificationsPage() {
  const user = await requireUser("/notificaciones");

  const spaces = await getUserCourseSpaces({
    userId: user.id,
    email: user.email,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  const snapshot = await getDashboardNotificationSnapshot({
    userId: user.id,
    courseSlugs: spaces.map((s) => s.course.slug),
    platformLimit: 50,
    forumLimit: 50,
  });

  const notifications: UnifiedNotification[] = [
    ...snapshot.platformNotifications.notifications.map(mapPlatformNotification),
    ...snapshot.forumNotifications.notifications.map(mapForumNotification),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const unreadCount = snapshot.unreadCount;

  const roleLabel = spaces.some((s) => isStaffCourseRole(s.role))
    ? "Docente"
    : "Alumno";

  return (
    <StudentShell
      fullName={user.name}
      initials={getInitials(user.name)}
      navItems={buildNavItems()}
      notificationsCount={unreadCount}
      roleLabel={roleLabel}
    >
      <NotificationCenter
        notifications={notifications}
        unreadCount={unreadCount}
      />
    </StudentShell>
  );
}
