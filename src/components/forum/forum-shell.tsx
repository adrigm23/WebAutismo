"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Archive,
  Bell,
  BookOpen,
  CircleHelp,
  FolderKanban,
  GraduationCap,
  MessageSquareText,
  Search,
  ShieldCheck
} from "lucide-react";
import {
  markAllForumNotificationsReadAction,
  markForumNotificationReadAction
} from "@/actions/forum";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { buildCourseResourcesHref, buildCourseTrackingHref } from "@/lib/course-navigation";
import { getForumCategoryPreset } from "@/lib/forum-presentation";
import { siteConfig } from "@/lib/site";
import { cn, formatRelativeTime } from "@/lib/utils";

type ForumShellProps = {
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
  categories: Array<{
    id: string;
    slug: string;
    title: string;
    _count: {
      threads: number;
    };
  }>;
  forumNotifications: {
    unreadCount: number;
    notifications: Array<{
      id: string;
      title: string;
      body: string;
      linkPath: string;
      readAt: Date | null;
      createdAt: Date;
    }>;
  };
  children: ReactNode;
};

const reservedSections = new Set(["nuevo", "moderacion", "historico"]);

export function ForumShell({
  course,
  user,
  roleLabel,
  canModerate,
  categories,
  forumNotifications,
  children
}: ForumShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forumRootPath = `/mis-cursos/${course.slug}/foro`;
  const currentQuery = searchParams.get("q") ?? "";
  const relativePath = pathname.startsWith(forumRootPath)
    ? pathname.slice(forumRootPath.length)
    : "";
  const pathSegments = relativePath.split("/").filter(Boolean);
  const currentCategorySlug =
    pathSegments[0] && !reservedSections.has(pathSegments[0]) ? pathSegments[0] : null;
  const newThreadHref = currentCategorySlug
    ? `${forumRootPath}/${currentCategorySlug}/nuevo`
    : `${forumRootPath}/nuevo`;
  const nextPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("");
  const totalThreads = categories.reduce((sum, category) => sum + category._count.threads, 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ef_0%,#f4f7fb_52%,#fbfaf8_100%)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.92)] backdrop-blur-xl">
        <div className="site-container py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={canModerate ? "info" : "warning"}>{roleLabel}</Badge>
                  <Badge tone="outline">Comunidad del curso</Badge>
                </div>
                <p className="mt-3 text-display-md font-semibold text-[var(--color-ink)]">
                  {course.title}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                  La comunidad mantiene anuncios, dudas y conversaciones del curso dentro del mismo
                  producto autenticado que campus, seguimiento y cuenta.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {[
                  { href: "/mi-cuenta", label: "Mi cuenta" },
                  { href: "/mis-cursos", label: "Mis cursos" },
                  { href: `/mis-cursos/${course.slug}`, label: "Campus" },
                  ...(canModerate
                    ? [{ href: buildCourseTrackingHref({ courseSlug: course.slug }), label: "Seguimiento" }]
                    : []),
                  { href: forumRootPath, label: "Comunidad", active: true }
                ].map((item) => (
                  <Link
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold transition",
                      item.active
                        ? "border border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                        : "text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[rgba(12,113,195,0.08)] pt-3 xl:flex-row xl:items-center xl:justify-between">
              <form action={pathname} className="w-full xl:max-w-[24rem]">
                <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-pill)] border border-[rgba(12,113,195,0.14)] bg-[#f3f1ee] px-4 text-[var(--color-muted)] shadow-[var(--shadow-inset-soft)]">
                  <Search className="h-5 w-5 shrink-0" />
                  <input
                    className="w-full bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
                    defaultValue={currentQuery}
                    name="q"
                    placeholder="Buscar en la comunidad..."
                    type="search"
                  />
                </label>
              </form>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <ButtonLink href={newThreadHref}>Nuevo hilo</ButtonLink>
                <ButtonLink href={`/mis-cursos/${course.slug}`} variant="secondary">
                  Volver al campus
                </ButtonLink>

                <details className="relative">
                  <summary className="flex h-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-pill)] border border-[rgba(12,113,195,0.18)] bg-white px-4 text-[var(--color-ink)] shadow-[var(--shadow-inset-soft)] transition hover:border-[var(--color-primary)]">
                    <Bell className="h-5 w-5" />
                    {forumNotifications.unreadCount ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {forumNotifications.unreadCount > 9 ? "9+" : forumNotifications.unreadCount}
                      </span>
                    ) : null}
                  </summary>

                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.14)] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,33,0.12)] sm:max-w-[22rem]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                          Notificaciones
                        </p>
                        <p className="text-sm text-[var(--color-muted)]">
                          {forumNotifications.unreadCount} sin leer
                        </p>
                      </div>
                      {forumNotifications.unreadCount ? (
                        <form action={markAllForumNotificationsReadAction}>
                          <input name="nextPath" type="hidden" value={nextPath} />
                          <button
                            className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary-strong)]"
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
                            className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.12)] bg-[#fcfbf8] p-4"
                            key={notification.id}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                                  notification.readAt ? "bg-[rgba(12,113,195,0.2)]" : "bg-[var(--color-accent)]"
                                }`}
                              />
                              <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                              {notification.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                              {notification.body}
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <Link
                                className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-strong)]"
                                href={notification.linkPath}
                              >
                                Abrir
                              </Link>
                              {!notification.readAt ? (
                                <form action={markForumNotificationReadAction}>
                                  <input name="nextPath" type="hidden" value={nextPath} />
                                  <input name="notificationId" type="hidden" value={notification.id} />
                                  <button
                                    className="text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
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

                <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white px-3 py-2 xl:max-w-[16rem]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
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

      <div className="site-container grid min-h-[calc(100vh-74px)] gap-6 py-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-8">
        <aside className="lg:sticky lg:top-[7.4rem] lg:self-start">
          <div className="flex flex-col gap-4">
            <div className="ui-card-base px-4 py-4">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-white">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                    {course.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Comunidad privada / {roleLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="ui-card-base rounded-[var(--radius-md)] px-4 py-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Actividad del foro
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {totalThreads}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">temas visibles</p>
                </div>
                <div className="text-right">
                  <p className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {forumNotifications.unreadCount}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">sin leer</p>
                </div>
              </div>
            </div>

            <nav className="ui-card-base p-3">
              {categories.length ? (
                categories.map((category) => {
                  const preset = getForumCategoryPreset(category.slug);
                  const Icon = preset.icon;
                  const href = `${forumRootPath}/${category.slug}`;
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white",
                        isActive && "bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_rgba(12,113,195,0.08)]"
                      )}
                      href={href}
                      key={category.id}
                      prefetch
                    >
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                          isActive ? "bg-white" : preset.softClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{category.title}</p>
                      </div>
                      <span className="text-xs text-[var(--color-muted)]">{category._count.threads}</span>
                    </Link>
                  );
                })
              ) : (
                <div className="ui-empty-state px-4 py-5 text-sm leading-7 text-[var(--color-muted)]">
                  No hay categorias visibles en este curso.
                </div>
              )}
            </nav>

            <div className="ui-card-base p-3">
              <div className="space-y-2">
                {canModerate ? (
                  <>
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition hover:bg-white",
                        pathname.startsWith(`${forumRootPath}/moderacion`)
                          ? "bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]"
                          : "text-[var(--color-ink)]"
                      )}
                      href={`${forumRootPath}/moderacion`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Panel de moderacion</span>
                    </Link>
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition hover:bg-white",
                        pathname.startsWith(`${forumRootPath}/historico`)
                          ? "bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]"
                          : "text-[var(--color-ink)]"
                      )}
                      href={`${forumRootPath}/historico`}
                    >
                      <Archive className="h-4 w-4" />
                      <span>Archivo</span>
                    </Link>
                  </>
                ) : null}

                <Link
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  href={`/mis-cursos/${course.slug}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Volver al curso</span>
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  href="/mi-cuenta"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Mi cuenta</span>
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  href={buildCourseResourcesHref(course.slug)}
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>Recursos y tareas</span>
                </Link>
                <a
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  href={`mailto:${siteConfig.supportEmail}`}
                >
                  <CircleHelp className="h-4 w-4" />
                  <span>Soporte</span>
                </a>
              </div>
            </div>

            <div className="ui-card-base mt-auto px-4 py-4 text-sm text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-ink)]">{siteConfig.name}</p>
              <p className="mt-2 leading-6">
                Comunidad privada por curso. Los anuncios, dudas y respuestas siguen el mismo
                recorrido autenticado del campus.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <main>{children}</main>
          <footer className="border-t border-[rgba(12,113,195,0.12)] px-1 py-6 text-sm text-[var(--color-muted)]">
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
