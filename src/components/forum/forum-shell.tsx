import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
} from "lucide-react";
import {
  markAllForumNotificationsReadAction,
  markForumNotificationReadAction,
} from "@/actions/forum";
import {
  ForumShellNewThreadButton,
  ForumShellNextPathInput,
} from "@/components/forum/forum-shell-url-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ForumShellCategory = {
  id: string;
  slug: string;
  title: string;
  _count: {
    threads: number;
  };
};

export type ForumShellNotification = {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdRelativeLabel?: string;
};

export type ForumShellProps = {
  course: {
    slug: string;
    title: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  roleLabel: string;
  canModerate: boolean;
  showTrackingNav: boolean;
  categories: ForumShellCategory[];
  forumNotifications: {
    unreadCount: number;
    notifications: ForumShellNotification[];
  };
  children: ReactNode;
};

export function ForumShell({
  course,
  roleLabel,
  canModerate,
  forumNotifications,
  children,
}: ForumShellProps) {
  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-8 pb-0">
        <header
          className="relative overflow-hidden rounded-xl border border-[#c4c6cf] bg-white p-6 md:p-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
        >
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#adc8f5] rounded-full opacity-10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            {canModerate && (
              <div className="flex items-center gap-2 mb-2">
                <Badge tone="info">{roleLabel}</Badge>
                <Badge tone="outline" className="hidden sm:inline-flex">Foro integrado</Badge>
              </div>
            )}
            <h2 className="text-2xl md:text-[28px] font-bold text-[var(--color-primary)] mb-1 leading-tight">
              Comunidad
            </h2>
            <p className="text-sm text-[#43474e]">
              Un espacio seguro y estructurado para compartir dudas y conversaciones del curso.
            </p>
          </div>
          <div className="relative z-10 shrink-0 flex flex-wrap items-center gap-2">
            <ForumShellNewThreadButton courseSlug={course.slug} />
            {canModerate && (
              <ButtonLink href={`/mis-cursos/${course.slug}/foro/moderacion`} variant="neutral" size="sm">
                Moderación
              </ButtonLink>
            )}
            {/* Notifications bell */}
            <details className="relative">
              <summary className="flex h-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#c4c6cf] bg-white px-3 text-[#43474e] transition hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#022448] focus-visible:ring-offset-2">
                <Bell className="h-4 w-4" />
                {forumNotifications.unreadCount ? (
                  <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {forumNotifications.unreadCount > 9
                      ? "9+"
                      : forumNotifications.unreadCount}
                  </span>
                ) : null}
              </summary>

              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-xl border border-[#c4c6cf] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,33,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[#111c2c]">
                      Notificaciones
                    </p>
                    <p className="text-sm text-[#43474e]">
                      {forumNotifications.unreadCount} sin leer
                    </p>
                  </div>
                  {forumNotifications.unreadCount ? (
                    <form action={markAllForumNotificationsReadAction}>
                      <ForumShellNextPathInput />
                      <button
                        className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#022448] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        type="submit"
                      >
                        Marcar todas
                      </button>
                    </form>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  {forumNotifications.notifications.length ? (
                    forumNotifications.notifications.map(
                      (notification) => (
                        <div
                          className="rounded-lg border border-[#c4c6cf] bg-[#f9f9ff] p-4"
                          key={notification.id}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex h-2.5 w-2.5 rounded-full",
                                notification.readAt
                                  ? "bg-[#c4c6cf]"
                                  : "bg-[var(--color-primary)]",
                              )}
                            />
                            <span className="text-xs uppercase tracking-[0.14em] text-[#43474e]">
                              {notification.createdRelativeLabel ?? ""}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-[#111c2c]">
                            {notification.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#43474e]">
                            {notification.body}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <Link
                              className="text-sm font-medium text-[var(--color-primary)] hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#022448] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              href={notification.linkPath}
                            >
                              Abrir
                            </Link>
                            {!notification.readAt ? (
                              <form
                                action={markForumNotificationReadAction}
                              >
                                <ForumShellNextPathInput />
                                <input
                                  name="notificationId"
                                  type="hidden"
                                  value={notification.id}
                                />
                                <button
                                  className="text-sm font-medium text-[#43474e] transition hover:text-[#111c2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#022448] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                                  type="submit"
                                >
                                  Marcar leída
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="px-4 py-5 text-sm text-[#43474e] text-center">
                      No hay notificaciones del foro en este curso.
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </header>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-10">
        {children}
      </div>
    </div>
  );
}
