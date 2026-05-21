import Link from "next/link";
import { Clock3, Settings2 } from "lucide-react";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import type {
  DashboardNotificationSnapshot,
  StudentDashboardPendingSource,
} from "@/lib/account-dashboard";
import {
  buildCourseResourcesHref,
  resolvePlatformNotificationHref,
} from "@/lib/course-navigation";
import type { UserCourseSpace } from "@/lib/course-community";
import type { CourseProgressDetails } from "@/lib/course-progress";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

export type StudentDashboardCourse = {
  space: UserCourseSpace;
  progress: CourseProgressDetails;
};

type PendingDashboardItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  meta: string;
  badgeLabel: string;
  badgeTone: "accent" | "muted" | "teacher" | "student";
  priority: number;
  dueAt: Date | null;
};

type ActivityDashboardItem = {
  id: string;
  href: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceTone: "teacher" | "student" | "muted";
  createdAt: Date;
};

export function getStudentDashboardInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}...`;
}

export function getPrimaryStudentCourse(courses: StudentDashboardCourse[]) {
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

export function getNextStudentModuleLabel(course: StudentDashboardCourse) {
  const nextModule = course.progress.modules.find((module) => !module.isCompleted);

  if (nextModule) {
    return `Siguiente paso: modulo ${nextModule.index + 1} - ${nextModule.title}`;
  }

  return "Has completado todos los modulos disponibles en este curso.";
}

export function buildStudentPendingItems(pendingSources: StudentDashboardPendingSource[]) {
  const items: PendingDashboardItem[] = [];

  for (const resource of pendingSources) {
    const href = buildCourseResourcesHref(resource.courseSlug, `resource-${resource.resourceId}`);
    const courseLabel = `Curso: ${resource.courseTitle}`;

    if (resource.viewerSubmission?.status === "CHANGES_REQUESTED") {
      items.push({
        id: `changes-${resource.resourceId}`,
        href,
        title: resource.title,
        description: resource.viewerSubmission.feedback
          ? truncateText(resource.viewerSubmission.feedback, 120)
          : "Tu docente ha solicitado ajustes antes de dar la entrega por cerrada.",
        meta: courseLabel,
        badgeLabel: "Cambios solicitados",
        badgeTone: "accent",
        priority: 0,
        dueAt: resource.dueAt,
      });
      continue;
    }

    if (!resource.viewerSubmission && !resource.isSubmissionClosed) {
      items.push({
        id: `pending-${resource.resourceId}`,
        href,
        title: resource.title,
        description: resource.dueAt
          ? `Entrega abierta hasta ${formatDateTime(resource.dueAt)}.`
          : "Ejercicio disponible para entregar desde el campus.",
        meta: courseLabel,
        badgeLabel: "Pendiente",
        badgeTone: "student",
        priority: 1,
        dueAt: resource.dueAt,
      });
      continue;
    }

    if (resource.viewerSubmission?.status === "SUBMITTED") {
      items.push({
        id: `review-${resource.resourceId}`,
        href,
        title: resource.title,
        description: "Tu entrega ya esta enviada y pendiente de revision docente.",
        meta: courseLabel,
        badgeLabel: "En revision",
        badgeTone: "muted",
        priority: 2,
        dueAt: resource.dueAt,
      });
    }
  }

  return items
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      const leftDueAt = left.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDueAt = right.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return leftDueAt - rightDueAt;
    })
    .slice(0, 4);
}

function buildRecentActivity(input: {
  platformNotifications: DashboardNotificationSnapshot["platformNotifications"]["notifications"];
  forumNotifications: DashboardNotificationSnapshot["forumNotifications"]["notifications"];
}) {
  const platformItems: ActivityDashboardItem[] = input.platformNotifications.map((notification) => ({
    id: `platform-${notification.id}`,
    href: resolvePlatformNotificationHref({
      category: notification.category,
      linkPath: notification.linkPath,
      metadataJson: notification.metadataJson,
    }),
    title: notification.title,
    body: truncateText(notification.body, 150),
    sourceLabel: "Plataforma",
    sourceTone: "teacher",
    createdAt: notification.createdAt,
  }));

  const forumItems: ActivityDashboardItem[] = input.forumNotifications.map((notification) => ({
    id: `forum-${notification.id}`,
    href: notification.linkPath,
    title: notification.title,
    body: truncateText(notification.body, 150),
    sourceLabel: "Foro",
    sourceTone: "student",
    createdAt: notification.createdAt,
  }));

  return [...platformItems, ...forumItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5);
}

export function StudentSectionSkeleton(input: { title: string; lines?: number }) {
  return (
    <Card className="p-6 lg:p-7" variant="muted">
      <div className="h-7 w-44 animate-pulse rounded-full bg-[var(--color-surface)]" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: input.lines ?? 3 }).map((_, index) => (
          <div
            className="h-20 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface)]"
            key={`${input.title}-${index}`}
          />
        ))}
      </div>
    </Card>
  );
}

export async function StudentUnreadBadge(input: {
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
}) {
  const snapshot = await input.notificationSnapshotPromise;

  if (!snapshot.unreadCount) {
    return null;
  }

  return (
    <span className="ml-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
      {snapshot.unreadCount}
    </span>
  );
}

export async function StudentRecentActivitySection(input: {
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
}) {
  const snapshot = await input.notificationSnapshotPromise;
  const recentActivity = buildRecentActivity({
    platformNotifications: snapshot.platformNotifications.notifications,
    forumNotifications: snapshot.forumNotifications.notifications,
  });

  return (
    <Card className="p-6 lg:p-7" id="actividad-reciente" variant="muted">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
          <Clock3 className="h-5 w-5" />
        </div>
        <SectionHeader
          className="gap-0"
          description="Avisos del campus y movimientos del foro en un solo hilo de lectura."
          size="md"
          title="Actividad reciente"
        />
      </div>

      <div className="mt-6 space-y-3">
        {recentActivity.length ? (
          recentActivity.map((item) => (
            <Link
              className="block rounded-[var(--radius-md)] transition hover:-translate-y-[1px]"
              href={item.href}
              key={item.id}
            >
              <ListRow
                description={item.body}
                eyebrow={
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <Badge tone={item.sourceTone}>{item.sourceLabel}</Badge>
                    <span className="text-meta-xs text-[var(--color-muted)]">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </span>
                }
                title={item.title}
              />
            </Link>
          ))
        ) : (
          <div className="ui-empty-state p-5 text-sm leading-7 text-[var(--color-muted)]">
            Todavia no hay actividad reciente. Cuando el equipo docente publique avisos o haya
            movimiento en tus foros privados, lo veras aqui.
          </div>
        )}
      </div>
    </Card>
  );
}

export async function StudentPreferencesCard(input: {
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
}) {
  const preference = (await input.notificationSnapshotPromise).preference;

  return (
    <Card className="p-6 lg:p-7" id="preferencias" variant="muted">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
          <Settings2 className="h-5 w-5" />
        </div>
        <SectionHeader
          className="gap-0"
          description="Elige como recibir avisos del campus y del foro privado."
          size="md"
          title="Preferencias"
        />
      </div>

      <div className="mt-6 space-y-3">
        {[
          {
            title: "Solo email",
            description: "Recibe avisos por correo y reduce ruido dentro de la cuenta.",
            emailEnabled: true,
            webEnabled: false,
          },
          {
            title: "Solo web",
            description: "Centraliza los avisos dentro del dashboard y del foro privado.",
            emailEnabled: false,
            webEnabled: true,
          },
          {
            title: "Email y web",
            description: "Mantiene sincronizados correo y panel privado para no perder nada.",
            emailEnabled: true,
            webEnabled: true,
          },
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
                  "w-full rounded-[var(--radius-md)] border px-4 py-4 text-left transition",
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] hover:bg-white",
                )}
                type="submit"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    {option.title}
                  </p>
                  <Badge tone={isSelected ? "teacher" : "muted"}>
                    {isSelected ? "Activa" : "Disponible"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {option.description}
                </p>
              </button>
            </form>
          );
        })}
      </div>
    </Card>
  );
}
