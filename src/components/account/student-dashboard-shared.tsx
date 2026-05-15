import Link from "next/link";
import { Clock3, Settings2 } from "lucide-react";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  DashboardNotificationSnapshot,
  StudentDashboardPendingSource
} from "@/lib/account-dashboard";
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
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

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
      left.progress.hasStarted && !left.progress.isCompleted ? 3 : left.progress.hasStarted ? 2 : 1;
    const rightInProgress =
      right.progress.hasStarted && !right.progress.isCompleted ? 3 : right.progress.hasStarted ? 2 : 1;

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
    const href = `/mis-cursos/${resource.courseSlug}?tab=resources`;
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
        dueAt: resource.dueAt
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
        dueAt: resource.dueAt
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
        dueAt: resource.dueAt
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
    href: notification.linkPath,
    title: notification.title,
    body: truncateText(notification.body, 150),
    sourceLabel: "Plataforma",
    sourceTone: "teacher",
    createdAt: notification.createdAt
  }));

  const forumItems: ActivityDashboardItem[] = input.forumNotifications.map((notification) => ({
    id: `forum-${notification.id}`,
    href: notification.linkPath,
    title: notification.title,
    body: truncateText(notification.body, 150),
    sourceLabel: "Foro",
    sourceTone: "student",
    createdAt: notification.createdAt
  }));

  return [...platformItems, ...forumItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5);
}

export function StudentSectionSkeleton(input: { title: string; lines?: number }) {
  return (
    <Card className="p-6">
      <div className="h-8 w-48 animate-pulse rounded-full bg-[var(--color-surface)]" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: input.lines ?? 3 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-[22px] bg-[var(--color-surface)]"
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
    forumNotifications: snapshot.forumNotifications.notifications
  });

  return (
    <Card className="p-6" id="actividad-reciente">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Clock3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Actividad reciente
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Avisos del campus y movimientos del foro.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {recentActivity.length ? (
          recentActivity.map((item) => (
            <Link
              className="block rounded-[22px] border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-primary)]"
              href={item.href}
              key={item.id}
            >
              <div className="flex items-center gap-3">
                <Badge tone={item.sourceTone}>{item.sourceLabel}</Badge>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
              <p className="mt-3 text-lg font-semibold leading-tight text-[var(--color-ink)]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{item.body}</p>
            </Link>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)]">
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
    <Card className="p-8" id="preferencias">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Preferencias
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Elige como recibir avisos del campus y del foro.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {[
          {
            title: "Solo email",
            description: "Recibe avisos por correo y reduce ruido dentro de la cuenta.",
            emailEnabled: true,
            webEnabled: false
          },
          {
            title: "Solo web",
            description: "Centraliza los avisos dentro del dashboard y del foro privado.",
            emailEnabled: false,
            webEnabled: true
          },
          {
            title: "Email y web",
            description: "Mantiene sincronizados correo y panel privado para no perder nada.",
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
  );
}
