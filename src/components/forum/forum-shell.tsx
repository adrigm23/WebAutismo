"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  MessageSquareText,
  Search,
  ShieldCheck
} from "lucide-react";
import {
  markAllForumNotificationsReadAction,
  markForumNotificationReadAction
} from "@/actions/forum";
import { ButtonLink } from "@/components/ui/button";
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ef_0%,#f4f7fb_52%,#fbfaf8_100%)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-40 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.92)] backdrop-blur-xl">
        <div className="flex min-h-[4.6rem] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              className="flex items-center gap-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-[var(--color-primary)]"
              href="/mi-cuenta"
            >
              <GraduationCap className="h-6 w-6" />
              <span className="truncate">{siteConfig.name}</span>
            </Link>

            <nav className="hidden items-center gap-5 lg:flex">
              {[
                {
                  href: "/mi-cuenta",
                  label: "Mis cursos",
                  active: pathname === "/mi-cuenta"
                },
                {
                  href: `/mis-cursos/${course.slug}`,
                  label: "Curso",
                  active: pathname === `/mis-cursos/${course.slug}`
                },
                {
                  href: forumRootPath,
                  label: "Foros",
                  active: pathname.startsWith(forumRootPath)
                },
                {
                  href: "/cursos",
                  label: "Cursos",
                  active:
                    pathname === "/cursos" || (pathname.startsWith("/cursos/") && !pathname.startsWith("/mis-cursos/"))
                }
              ].map((item) => (
                <Link
                  className={cn(
                    "border-b-2 border-transparent pb-1 text-[0.95rem] font-medium text-[var(--color-ink)] transition hover:text-[var(--color-primary)]",
                    item.active && "border-[var(--color-primary)] text-[var(--color-primary)]"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <form action={pathname} className="hidden xl:block">
              <label className="flex h-11 w-[18.5rem] items-center gap-3 rounded-full border border-[rgba(12,113,195,0.14)] bg-[#f3f1ee] px-4 text-[var(--color-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <Search className="h-5 w-5 shrink-0" />
                <input
                  className="w-full bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
                  defaultValue={currentQuery}
                  name="q"
                  placeholder="Buscar en el foro..."
                  type="search"
                />
              </label>
            </form>

            <ButtonLink className="hidden sm:inline-flex px-4 py-2.5 text-sm" href={`/mis-cursos/${course.slug}`} variant="secondary">
              Ver curso
            </ButtonLink>

            <details className="relative">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[rgba(12,113,195,0.18)] bg-white text-[var(--color-ink)] shadow-[0_8px_20px_rgba(34,34,33,0.06)] transition hover:border-[var(--color-primary)]">
                <Bell className="h-5 w-5" />
                {forumNotifications.unreadCount ? (
                  <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-semibold text-white">
                    {forumNotifications.unreadCount > 9 ? "9+" : forumNotifications.unreadCount}
                  </span>
                ) : null}
              </summary>

              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[22rem] rounded-[24px] border border-[rgba(12,113,195,0.14)] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,33,0.12)]">
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
                        className="rounded-[20px] border border-[rgba(12,113,195,0.12)] bg-[#fcfbf8] p-4"
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
                                Marcar leida
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[rgba(12,113,195,0.18)] px-4 py-5 text-sm text-[var(--color-muted)]">
                      No hay notificaciones del foro en este curso.
                    </div>
                  )}
                </div>
              </div>
            </details>

            <div className="grid h-11 w-11 place-items-center rounded-full border border-[rgba(12,113,195,0.18)] bg-white text-sm font-semibold text-[var(--color-primary)] shadow-[0_8px_20px_rgba(34,34,33,0.06)]">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-74px)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b border-[rgba(12,113,195,0.12)] bg-[#f4f1ec] lg:sticky lg:top-[74px] lg:h-[calc(100vh-74px)] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-5 py-5">
            <div className="rounded-[26px] border border-[rgba(12,113,195,0.1)] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(34,34,33,0.05)]">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-white">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                    {course.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Foro del curso / {roleLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[rgba(12,113,195,0.12)] bg-white px-4 py-4 shadow-[0_12px_24px_rgba(34,34,33,0.04)]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Actividad del foro
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {categories.reduce((sum, category) => sum + category._count.threads, 0)}
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

            <ButtonLink
              className="mt-4 w-full justify-center rounded-2xl py-3.5 text-base"
              href={newThreadHref}
              prefetch
            >
              + Nuevo hilo
            </ButtonLink>

            <nav className="mt-6 space-y-2">
              {categories.length ? (
                categories.map((category) => {
                  const preset = getForumCategoryPreset(category.slug);
                  const Icon = preset.icon;
                  const href = `${forumRootPath}/${category.slug}`;
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white",
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
                <div className="rounded-2xl border border-dashed border-[rgba(12,113,195,0.18)] bg-white px-4 py-5 text-sm leading-7 text-[var(--color-muted)]">
                  No hay categorias visibles en este curso.
                </div>
              )}
            </nav>

            <div className="mt-6 border-t border-[rgba(12,113,195,0.12)] pt-6">
              <div className="space-y-2">
                {canModerate ? (
                  <>
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white",
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
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white",
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
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  href={`/mis-cursos/${course.slug}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Volver al curso</span>
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
                  href="/mi-cuenta"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Mi cuenta</span>
                </Link>
              </div>
            </div>

            <div className="mt-auto border-t border-[rgba(12,113,195,0.12)] pt-6">
              <div className="grid gap-2 text-sm text-[var(--color-muted)]">
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <LibraryBig className="h-4 w-4" />
                  <span>Biblioteca del curso</span>
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </div>
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <CalendarDays className="h-4 w-4" />
                  <span>Calendario academico</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <Bell className="h-4 w-4" />
                  <span>Actividad y avisos</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <CircleHelp className="h-4 w-4" />
                  <span>Soporte</span>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-[rgba(12,113,195,0.1)] bg-white px-4 py-4 text-sm text-[var(--color-muted)]">
                <p className="font-semibold text-[var(--color-ink)]">{siteConfig.name}</p>
                <p className="mt-2 leading-6">
                  {`Copyright 2024 ${siteConfig.shortName}. Foro organizado por curso y edicion.`}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <main className="px-4 py-8 sm:px-6 lg:px-12 lg:py-12">{children}</main>
          <footer className="border-t border-[rgba(12,113,195,0.12)] px-4 py-6 text-sm text-[var(--color-muted)] sm:px-6 lg:px-12">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>{`Copyright 2024 ${siteConfig.shortName}.`}</span>
              <span>Campus privado por curso</span>
              <span>Moderacion y archivo por edicion</span>
              <span>Contacto institucional</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
