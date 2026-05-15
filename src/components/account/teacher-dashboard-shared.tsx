import Link from "next/link";
import { Bell, MessageSquareText, Settings2 } from "lucide-react";
import { updateNotificationPreferencesAction } from "@/actions/account";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  DashboardNotificationSnapshot,
  TeacherDashboardCourseSummary
} from "@/lib/account-dashboard";
import {
  buildCourseContentHref,
  buildCourseForumHref,
  buildCourseResourcesHref,
  buildCourseTrackingHref,
  resolvePlatformNotificationHref
} from "@/lib/course-navigation";
import { cn, formatRelativeTime } from "@/lib/utils";

export function getTeacherDashboardInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "D";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}...`;
}

export function getPrimaryTeacherCourse(courses: TeacherDashboardCourseSummary[]) {
  return [...courses].sort((left, right) => {
    const leftPending = left.pendingReviewItems.length;
    const rightPending = right.pendingReviewItems.length;

    if (leftPending !== rightPending) {
      return rightPending - leftPending;
    }

    if (left.learnerCount !== right.learnerCount) {
      return right.learnerCount - left.learnerCount;
    }

    return right.managedResourceCount - left.managedResourceCount;
  })[0] ?? null;
}

export function getTeacherCoursePaths(course: TeacherDashboardCourseSummary | null) {
  if (!course) {
    return {
      campusHref: "/mi-cuenta",
      resourcesHref: "/mi-cuenta",
      trackingHref: "/mi-cuenta",
      forumHref: "/mi-cuenta"
    };
  }

  return {
    campusHref: buildCourseContentHref(course.space.course.slug),
    resourcesHref: buildCourseResourcesHref(course.space.course.slug, "resource-manager-top"),
    trackingHref: buildCourseTrackingHref({
      courseSlug: course.space.course.slug,
      submissionId: course.pendingReviewItems[0]?.id ?? null
    }),
    forumHref: buildCourseForumHref(course.space.course.slug)
  };
}

export function getTeacherGlobalSummary(courses: TeacherDashboardCourseSummary[]) {
  const allPending = courses.flatMap((course) => course.pendingReviewItems);
  const activeLearners = new Set(courses.flatMap((course) => course.learnerIds)).size;
  const resources = courses.reduce((total, course) => total + course.managedResourceCount, 0);
  const exercises = courses.reduce((total, course) => total + course.exerciseCount, 0);
  const averageCompletionRate =
    courses.length > 0
      ? Math.round(
          courses.reduce((total, course) => total + course.averageCompletionRate, 0) /
            courses.length
        )
      : 0;

  return {
    pendingReviews: allPending.length,
    activeLearners,
    resources,
    exercises,
    averageCompletionRate
  };
}

export function getReviewedSubmissionsCount(courses: TeacherDashboardCourseSummary[]) {
  return courses.reduce((total, course) => total + course.reviewedSubmissionCount, 0);
}

export function getTotalSubmissionsCount(courses: TeacherDashboardCourseSummary[]) {
  return courses.reduce((total, course) => total + course.totalSubmissionCount, 0);
}

function buildTeacherActivity(input: {
  courses: TeacherDashboardCourseSummary[];
  forumNotifications: DashboardNotificationSnapshot["forumNotifications"]["notifications"];
  platformNotifications: DashboardNotificationSnapshot["platformNotifications"]["notifications"];
}) {
  const submissionItems = input.courses.flatMap((course) => course.recentSubmissionActivity);

  const platformItems = input.platformNotifications.map((notification) => ({
    id: `platform-${notification.id}`,
    href: resolvePlatformNotificationHref({
      category: notification.category,
      linkPath: notification.linkPath,
      metadataJson: notification.metadataJson
    }),
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

export function TeacherSectionSkeleton(input: { title: string; lines?: number }) {
  return (
    <Card className="p-6">
      <div className="h-8 w-52 animate-pulse rounded-full bg-[var(--color-surface)]" />
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

export async function TeacherUnreadBadge(input: {
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

export async function TeacherRecentActivitySection(input: {
  courses: TeacherDashboardCourseSummary[];
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
}) {
  const snapshot = await input.notificationSnapshotPromise;
  const recentActivity = buildTeacherActivity({
    courses: input.courses,
    forumNotifications: snapshot.forumNotifications.notifications,
    platformNotifications: snapshot.platformNotifications.notifications
  });

  return (
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
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{item.body}</p>
            </Link>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-[rgba(12,113,195,0.18)] bg-white p-5 text-sm leading-7 text-[var(--color-muted)]">
            Sin actividad reciente. Las actualizaciones del alumnado apareceran aqui cuando haya
            entregas, avisos o movimiento en el foro.
          </div>
        )}
      </div>
    </Card>
  );
}

export async function TeacherCommunityCard(input: {
  paths: ReturnType<typeof getTeacherCoursePaths>;
  resources: number;
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
}) {
  const snapshot = await input.notificationSnapshotPromise;

  return (
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
            {snapshot.forumNotifications.unreadCount}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
            Notificaciones no leidas asociadas a tus cursos.
          </p>
        </div>

        <div className="rounded-[22px] bg-[var(--color-surface)] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Recursos
          </p>
          <p className="mt-3 text-[2rem] font-semibold text-[var(--color-ink)]">{input.resources}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
            Materiales o ejercicios gestionados desde el campus.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href={input.paths.forumHref} variant="secondary">
            Abrir foro
          </ButtonLink>
          <ButtonLink href={input.paths.resourcesHref} prefetch variant="ghost">
            Ir a recursos
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

export async function TeacherPreferencesCard(input: {
  notificationSnapshotPromise: Promise<DashboardNotificationSnapshot>;
}) {
  const preference = (await input.notificationSnapshotPromise).preference;

  return (
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
  );
}
