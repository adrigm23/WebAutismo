import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CircleHelp,
  FolderKanban,
  GraduationCap,
  MessageSquareText,
  Search,
} from "lucide-react";
import {
  markAllForumNotificationsReadAction,
  markForumNotificationReadAction,
} from "@/actions/forum";
import { CoursePrivateHeader } from "@/components/learning/course-private-header";
import {
  ForumShellCategoryDesktopNav,
  ForumShellDesktopModerationLinks,
  ForumShellMobileCategoryList,
} from "@/components/forum/forum-shell-active-nav";
import {
  ForumShellNewThreadButton,
  ForumShellNextPathInput,
  ForumShellSearchInput,
} from "@/components/forum/forum-shell-url-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  buildCourseResourcesHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
import { siteConfig } from "@/lib/site";
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
  user,
  roleLabel,
  canModerate,
  showTrackingNav,
  categories,
  forumNotifications,
  children,
}: ForumShellProps) {
  const forumRootPath = `/mis-cursos/${course.slug}/foro`;
  const totalThreads = categories.reduce(
    (sum, category) => sum + category._count.threads,
    0,
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-[linear-gradient(180deg,#f8f5ef_0%,#f5f7fb_48%,#fcfbf8_100%)] text-[var(--color-ink)]">
      <CoursePrivateHeader
        activeSection="forum"
        courseSlug={course.slug}
        fullName={user.name || user.email}
        roleLabel={roleLabel}
        showTrackingNav={showTrackingNav}
      />

      <div className="app-container min-h-[calc(100vh-74px)] py-5 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-6 lg:py-7 xl:grid-cols-[14.25rem_minmax(0,1fr)] xl:gap-7">
        <aside className="hidden lg:sticky lg:top-[7.4rem] lg:block lg:self-start">
          <div className="flex flex-col gap-3">
            <SurfaceCard
              className="border-[rgba(22,60,88,0.08)] bg-white/82"
              padding="md"
              variant="muted"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[18px] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-strong)_100%)] text-white shadow-[0_8px_20px_rgba(22,60,88,0.16)]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Comunidad del curso
                  </p>
                  <p className="mt-1.5 truncate font-premium text-[1.18rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                    {course.title}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    {roleLabel}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[rgba(22,60,88,0.08)] pt-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Temas
                  </p>
                  <p className="mt-1.5 font-premium text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {totalThreads}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">visibles</p>
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Avisos
                  </p>
                  <p className="mt-1.5 font-premium text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {forumNotifications.unreadCount}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">sin leer</p>
                </div>
              </div>
            </SurfaceCard>

            <ForumShellCategoryDesktopNav
              categories={categories}
              courseSlug={course.slug}
            />

            <div className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.07)] bg-white/72 p-2.5 shadow-[var(--shadow-soft)]">
              <div className="space-y-1">
                {canModerate ? (
                  <ForumShellDesktopModerationLinks courseSlug={course.slug} />
                ) : null}

                <Link
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-ink)]"
                  href={`/mis-cursos/${course.slug}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Volver al curso</span>
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-ink)]"
                  href="/mi-cuenta"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Mi cuenta</span>
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-ink)]"
                  href={buildCourseResourcesHref(course.slug)}
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>Recursos y tareas</span>
                </Link>
                <a
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-ink)]"
                  href={`mailto:${siteConfig.supportEmail}`}
                >
                  <CircleHelp className="h-4 w-4" />
                  <span>Soporte</span>
                </a>

                <div className="border-t border-[rgba(22,60,88,0.08)] px-3 pt-3 text-sm text-[var(--color-muted)]">
                  <p className="font-medium text-[var(--color-ink-soft)]">
                    {siteConfig.shortName}
                  </p>
                  <p className="mt-1.5 leading-6">
                    Comunidad privada del curso, integrada en el mismo recorrido
                    del campus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6 lg:space-y-0">
          <section className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.08)] bg-white/84 p-4 shadow-[var(--shadow-soft)] sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={canModerate ? "info" : "warning"}>
                      {roleLabel}
                    </Badge>
                    <Badge className="hidden sm:inline-flex" tone="outline">
                      Foro integrado
                    </Badge>
                  </div>
                  <p className="mt-2 font-premium text-display-sm font-semibold text-[var(--color-ink)] sm:text-display-md">
                    {course.title}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                    Un espacio de conversacion dentro del campus para seguir el
                    curso, plantear dudas y compartir avances sin perder
                    contexto.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <ForumShellNewThreadButton courseSlug={course.slug} />
                  <ButtonLink
                    href={`/mis-cursos/${course.slug}`}
                    variant="secondary"
                  >
                    Volver al campus
                  </ButtonLink>
                  {showTrackingNav ? (
                    <ButtonLink
                      href={buildCourseTrackingHref({
                        courseSlug: course.slug,
                      })}
                      variant="ghost"
                    >
                      Abrir seguimiento
                    </ButtonLink>
                  ) : null}

                  <details className="relative">
                    <summary className="flex h-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.12)] bg-white px-4 text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] transition hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]">
                      <Bell className="h-5 w-5" />
                      {forumNotifications.unreadCount ? (
                        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {forumNotifications.unreadCount > 9
                            ? "9+"
                            : forumNotifications.unreadCount}
                        </span>
                      ) : null}
                    </summary>

                    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.12)] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,33,0.12)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                            Notificaciones
                          </p>
                          <p className="text-sm text-[var(--color-muted)]">
                            {forumNotifications.unreadCount} sin leer
                          </p>
                        </div>
                        {forumNotifications.unreadCount ? (
                          <form action={markAllForumNotificationsReadAction}>
                            <ForumShellNextPathInput />
                            <button
                              className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                                className="rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.1)] bg-[#fcfbf8] p-4"
                                key={notification.id}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex h-2.5 w-2.5 rounded-full",
                                      notification.readAt
                                        ? "bg-[rgba(22,60,88,0.18)]"
                                        : "bg-[var(--color-accent)]",
                                    )}
                                  />
                                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                                    {notification.createdRelativeLabel ?? ""}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                                  {notification.title}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                                  {notification.body}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                  <Link
                                    className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                                        className="text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                                        type="submit"
                                      >
                                        Marcar leida
                                      </button>
                                    </form>
                                  ) : null}
                                </div>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="ui-empty-state px-4 py-5 text-sm text-[var(--color-muted)]">
                            No hay notificaciones del foro en este curso.
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="border-t border-[rgba(22,60,88,0.08)] pt-4">
                <form className="w-full lg:max-w-[24rem]" method="get">
                  <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.1)] bg-[rgba(255,255,255,0.8)] px-4 text-[var(--color-muted)] shadow-[var(--shadow-inset-soft)] transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-surface-canvas)]">
                    <Search className="h-5 w-5 shrink-0" />
                    <ForumShellSearchInput />
                  </label>
                </form>
              </div>
            </div>
          </section>

          <main>{children}</main>

          <div className="space-y-3 lg:hidden">
            <section className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.08)] bg-white/82 px-4 py-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Categorias
                </p>
                {canModerate ? (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                      className="font-medium text-[var(--color-primary)]"
                      href={`${forumRootPath}/moderacion`}
                    >
                      Moderacion
                    </Link>
                    <Link
                      className="font-medium text-[var(--color-primary)]"
                      href={`${forumRootPath}/historico`}
                    >
                      Archivo
                    </Link>
                  </div>
                ) : null}
              </div>

              <ForumShellMobileCategoryList
                categories={categories}
                courseSlug={course.slug}
              />

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link
                  className="font-medium text-[var(--color-primary)]"
                  href={buildCourseResourcesHref(course.slug)}
                >
                  Recursos y tareas
                </Link>
                <a
                  className="font-medium text-[var(--color-primary)]"
                  href={`mailto:${siteConfig.supportEmail}`}
                >
                  Soporte
                </a>
              </div>
            </section>
          </div>

          <footer className="border-t border-[rgba(22,60,88,0.1)] px-1 py-6 text-sm text-[var(--color-muted)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>{siteConfig.shortName}</span>
              <span>Campus privado por curso</span>
              <span>Moderacion y archivo por edicion</span>
              <span>{siteConfig.supportEmail}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
