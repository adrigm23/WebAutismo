import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CircleHelp,
  FolderKanban,
  GraduationCap,
  MessageSquareText,
  Search
} from "lucide-react";
import {
  markAllForumNotificationsReadAction,
  markForumNotificationReadAction
} from "@/actions/forum";
import {
  ForumShellCategoryDesktopNav,
  ForumShellDesktopModerationLinks,
  ForumShellMobileCategoryList
} from "@/components/forum/forum-shell-active-nav";
import {
  ForumShellNewThreadButton,
  ForumShellNextPathInput,
  ForumShellSearchInput
} from "@/components/forum/forum-shell-url-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { buildCourseResourcesHref, buildCourseTrackingHref } from "@/lib/course-navigation";
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
  categories,
  forumNotifications,
  children
}: ForumShellProps) {
  const forumRootPath = `/mis-cursos/${course.slug}/foro`;
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("");
  const totalThreads = categories.reduce((sum, category) => sum + category._count.threads, 0);
  const topNavItems = [
    { href: `/mis-cursos/${course.slug}`, label: "Campus" },
    { href: forumRootPath, label: "Comunidad", active: true },
    ...(canModerate
      ? [{ href: buildCourseTrackingHref({ courseSlug: course.slug }), label: "Seguimiento" }]
      : []),
    { href: "/mis-cursos", label: "Mis cursos" },
    { href: "/mi-cuenta", label: "Mi cuenta" }
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[linear-gradient(180deg,#f8f5ef_0%,#f5f7fb_48%,#fcfbf8_100%)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-40 border-b border-[rgba(22,60,88,0.1)] bg-[rgba(248,245,239,0.9)] backdrop-blur-xl">
        <div className="site-container py-2.5">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={canModerate ? "info" : "warning"}>{roleLabel}</Badge>
                  <Badge className="hidden sm:inline-flex" tone="outline">
                    Comunidad integrada
                  </Badge>
                </div>
                <p className="mt-1.5 font-premium text-display-sm font-semibold text-[var(--color-ink)] sm:text-display-md">
                  {course.title}
                </p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                  Un espacio de conversación dentro del campus para seguir el curso, plantear
                  dudas y compartir avances sin perder contexto.
                </p>
              </div>

              <nav
                aria-label="Navegación del foro"
                className="hidden flex-wrap items-center gap-2 lg:flex lg:justify-end"
              >
                {topNavItems.map((item) => (
                  <Link
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
                      item.active
                        ? "border border-[rgba(22,60,88,0.18)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                        : "text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-primary)]"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-[rgba(22,60,88,0.08)] pt-2 lg:flex-row lg:items-center lg:justify-between">
              <form className="w-full lg:max-w-[24rem]" method="get">
                <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.1)] bg-[rgba(255,255,255,0.8)] px-4 text-[var(--color-muted)] shadow-[var(--shadow-inset-soft)] transition focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-surface-canvas)]">
                  <Search className="h-5 w-5 shrink-0" />
                  <ForumShellSearchInput />
                </label>
              </form>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <ForumShellNewThreadButton courseSlug={course.slug} />
                <ButtonLink href={`/mis-cursos/${course.slug}`} variant="secondary">
                  Volver al campus
                </ButtonLink>

                <details className="relative">
                  <summary className="flex h-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.12)] bg-white px-4 text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] transition hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]">
                    <Bell className="h-5 w-5" />
                    {forumNotifications.unreadCount ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {forumNotifications.unreadCount > 9 ? "9+" : forumNotifications.unreadCount}
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
                        forumNotifications.notifications.map((notification) => (
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
                                    : "bg-[var(--color-accent)]"
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
                                <form action={markForumNotificationReadAction}>
                                  <ForumShellNextPathInput />
                                  <input name="notificationId" type="hidden" value={notification.id} />
                                  <button
                                    className="text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                                    type="submit"
                                  >
                                    Marcar leída
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="ui-empty-state px-4 py-5 text-sm text-[var(--color-muted)]">
                          No hay notificaciones del foro en este curso.
                        </div>
                      )}
                    </div>
                  </div>
                </details>

                <div className="hidden min-w-0 items-center gap-3 rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.12)] bg-white/92 px-3 py-2 lg:flex lg:max-w-[16rem]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-sm font-semibold text-[var(--color-primary)]">
                    {initials}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{roleLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="site-container min-h-[calc(100vh-74px)] py-5 lg:grid lg:grid-cols-[14.75rem_minmax(0,1fr)] lg:gap-7 lg:py-7">
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
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">{roleLabel}</p>
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

            <ForumShellCategoryDesktopNav categories={categories} courseSlug={course.slug} />

            <div className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.07)] bg-white/72 p-2.5 shadow-[var(--shadow-soft)]">
              <div className="space-y-1">
                {canModerate ? <ForumShellDesktopModerationLinks courseSlug={course.slug} /> : null}

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
                  <p className="font-medium text-[var(--color-ink-soft)]">{siteConfig.shortName}</p>
                  <p className="mt-1.5 leading-6">
                    Comunidad privada del curso, integrada en el mismo recorrido del campus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6 lg:space-y-0">
          <div className="space-y-3 lg:hidden">
            <section className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.08)] bg-white/82 px-4 py-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Comunidad del curso</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    {totalThreads} temas visibles y {forumNotifications.unreadCount} avisos sin leer.
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                  href={`/mis-cursos/${course.slug}`}
                >
                  Campus
                </Link>
              </div>
            </section>
          </div>

          <main>{children}</main>

          <div className="space-y-3 lg:hidden">
            <section className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.08)] bg-white/82 px-4 py-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Categorías</p>
                {canModerate ? (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                      className="font-medium text-[var(--color-primary)]"
                      href={`${forumRootPath}/moderacion`}
                    >
                      Moderación
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

              <ForumShellMobileCategoryList categories={categories} courseSlug={course.slug} />

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link className="font-medium text-[var(--color-primary)]" href={buildCourseResourcesHref(course.slug)}>
                  Recursos y tareas
                </Link>
                <a className="font-medium text-[var(--color-primary)]" href={`mailto:${siteConfig.supportEmail}`}>
                  Soporte
                </a>
              </div>
            </section>
          </div>

          <footer className="border-t border-[rgba(22,60,88,0.1)] px-1 py-6 text-sm text-[var(--color-muted)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>{siteConfig.shortName}</span>
              <span>Campus privado por curso</span>
              <span>Moderación y archivo por edición</span>
              <span>{siteConfig.supportEmail}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
