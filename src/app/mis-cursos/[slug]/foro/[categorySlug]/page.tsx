import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare, MoveRight, Pin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel
} from "@/lib/course-community";
import { getForumThreads } from "@/lib/forum";
import { firstValue, formatCompactNumber, formatDateTime, formatRelativeTime } from "@/lib/utils";

type ForumCategoryPageProps = {
  params: Promise<{ slug: string; categorySlug: string }>;
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
    status?: string | string[];
    type?: string | string[];
    filter?: string | string[];
    page?: string | string[];
  }>;
};

function buildFilterHref(
  courseSlug: string,
  categorySlug: string,
  values: Record<string, string | null | undefined>
) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return `/mis-cursos/${courseSlug}/foro/${categorySlug}${query ? `?${query}` : ""}`;
}

export async function generateMetadata({
  params
}: ForumCategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Foro | ${categorySlug} | ${course.title}` : "Foro",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumCategoryPage({
  params,
  searchParams
}: ForumCategoryPageProps) {
  const { slug, categorySlug } = await params;
  const { q, sort, status, type, filter, page } = await searchParams;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro/${categorySlug}`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const selectedSort = firstValue(sort);
  const selectedStatus = firstValue(status);
  const selectedType = firstValue(type);
  const selectedFilter = firstValue(filter);
  const selectedQuery = firstValue(q)?.trim() ?? "";
  const currentPage = Math.max(Number.parseInt(firstValue(page) ?? "1", 10) || 1, 1);

  const forumData = await getForumThreads(
    course.slug,
    categorySlug,
    {
      q: selectedQuery || undefined,
      sort:
        selectedSort === "created" || selectedSort === "recent" || selectedSort === "activity"
          ? selectedSort
          : "activity",
      status:
        selectedStatus === "open" ||
        selectedStatus === "closed" ||
        selectedStatus === "resolved"
          ? selectedStatus
          : undefined,
      type:
        selectedType === "announcement" || selectedType === "discussion"
          ? selectedType
          : undefined,
      filter: selectedFilter === "unanswered" ? "unanswered" : undefined,
      page: currentPage
    },
    access.role
  );

  if (!forumData) {
    notFound();
  }

  const canModerate = canModerateCourse(access.role);
  const filteredThreads = forumData.threads;
  const pagination = forumData.pagination;

  const totalThreads = forumData.threads.length;
  const openCount = forumData.threads.filter((thread) => !thread.isClosed).length;
  const unansweredCount = forumData.threads.filter((thread) => thread._count.posts === 0).length;
  const resolvedCount = forumData.threads.filter((thread) => thread.isResolved).length;
  const announcementCount = forumData.threads.filter((thread) => thread.type === "ANNOUNCEMENT").length;
  const baseQuery = {
    q: selectedQuery || undefined,
    sort: selectedSort || undefined
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link
          className="hover:text-[var(--color-primary)]"
          href={`/mis-cursos/${course.slug}/foro`}
          prefetch
        >
          Foro
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">{forumData.category.title}</span>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4rem]">
            {forumData.category.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
            {forumData.category.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/mis-cursos/${course.slug}/foro/${categorySlug}/nuevo`} prefetch>
            Nuevo hilo
          </ButtonLink>
          {canModerate ? (
            <ButtonLink href={`/mis-cursos/${course.slug}/foro/moderacion`} prefetch variant="secondary">
              Moderación
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          {
            label: "Todos",
            active: !selectedStatus && !selectedType && !selectedFilter,
            href: buildFilterHref(course.slug, categorySlug, {
              ...baseQuery,
              status: null,
              type: null,
              filter: null
            })
          },
          {
            label: "Abiertos",
            active: selectedStatus === "open",
            href: buildFilterHref(course.slug, categorySlug, {
              ...baseQuery,
              status: "open",
              type: null,
              filter: null
            })
          },
          {
            label: "Sin respuesta",
            active: selectedFilter === "unanswered",
            href: buildFilterHref(course.slug, categorySlug, {
              ...baseQuery,
              status: null,
              type: null,
              filter: "unanswered"
            })
          },
          {
            label: "Resueltos",
            active: selectedStatus === "resolved",
            href: buildFilterHref(course.slug, categorySlug, {
              ...baseQuery,
              status: "resolved",
              type: null,
              filter: null
            })
          },
          {
            label: "Anuncios",
            active: selectedType === "announcement",
            href: buildFilterHref(course.slug, categorySlug, {
              ...baseQuery,
              status: null,
              type: "announcement",
              filter: null
            })
          }
        ].map((tab) => (
          <Link
            className={`rounded-full border px-5 py-2 text-base font-medium transition ${
              tab.active
                ? "border-[rgba(12,113,195,0.16)] bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)]"
            }`}
            href={tab.href}
            key={tab.label}
            prefetch
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Total
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {formatCompactNumber(totalThreads)}
          </p>
        </div>
        <div className="rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Abiertos
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {openCount}
          </p>
        </div>
        <div className="rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Sin respuesta
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {unansweredCount}
          </p>
        </div>
        <div className="rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Resueltos
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {resolvedCount}
          </p>
        </div>
        <div className="rounded-[26px] border border-[rgba(12,113,195,0.12)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Anuncios
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {announcementCount}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredThreads.length ? (
          filteredThreads.map((thread) => (
            <Link
              className="group relative block overflow-hidden rounded-[30px] border border-[rgba(12,113,195,0.14)] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(34,34,33,0.05)] transition hover:-translate-y-1 hover:border-[var(--color-primary)]"
              href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${thread.id}`}
              key={thread.id}
            >
              <div
                className={`absolute inset-y-0 left-0 w-1 ${
                  thread.type === "ANNOUNCEMENT"
                    ? "bg-[linear-gradient(180deg,#ffb606,#f0d07a)]"
                    : thread.isResolved
                      ? "bg-[linear-gradient(180deg,#2ea3f2,#9fd2ff)]"
                      : "bg-[linear-gradient(180deg,#0c71c3,#69b4ff)]"
                }`}
              />

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.isPinned ? (
                      <Badge tone="accent">
                        <Pin className="mr-1 h-3.5 w-3.5" />
                        Fijado
                      </Badge>
                    ) : null}
                    {thread.type === "ANNOUNCEMENT" ? <Badge tone="default">Anuncio</Badge> : null}
                    {thread.isResolved ? <Badge tone="teacher">Resuelto</Badge> : null}
                    {thread.isClosed ? <Badge tone="muted">Cerrado</Badge> : null}
                    <Badge tone={canModerateCourse(thread.authorRole) ? "teacher" : "student"}>
                      {getRoleLabel(thread.authorRole)}
                    </Badge>
                  </div>

                  <h2 className="mt-4 text-[2.15rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {thread.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 max-w-4xl whitespace-pre-line text-base leading-8 text-[var(--color-muted)]">
                    {thread.body}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                    <span>{thread.author.name}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(thread.createdAt)}</span>
                    {thread.type === "ANNOUNCEMENT" && thread.scheduledFor && !thread.publishedAt ? (
                      <>
                        <span>•</span>
                        <span>Se publica {formatDateTime(thread.scheduledFor)}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-w-[12rem] flex-row items-center justify-between gap-4 lg:flex-col lg:items-end">
                  <MoveRight className="hidden h-5 w-5 text-[var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)] lg:block" />
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
                      <MessageSquare className="h-5 w-5 text-[var(--color-muted)]" />
                      <span>{thread._count.posts}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Último mensaje {formatRelativeTime(thread.lastActivityAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[30px] border border-dashed border-[rgba(12,113,195,0.2)] bg-white px-6 py-10 text-[var(--color-muted)]">
            No hay hilos que coincidan con los filtros actuales.
          </div>
        )}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4">
          <p className="text-sm text-[var(--color-muted)]">
            Pagina {pagination.page} de {pagination.totalPages} · {pagination.totalItems} hilos
          </p>
          <div className="flex flex-wrap gap-3">
            {pagination.hasPreviousPage ? (
              <ButtonLink
                href={buildFilterHref(course.slug, categorySlug, {
                  q: selectedQuery || undefined,
                  sort: selectedSort || undefined,
                  status: selectedStatus || undefined,
                  type: selectedType || undefined,
                  filter: selectedFilter || undefined,
                  page: String(pagination.page - 1)
                })}
                variant="secondary"
              >
                Pagina anterior
              </ButtonLink>
            ) : null}
            {pagination.hasNextPage ? (
              <ButtonLink
                href={buildFilterHref(course.slug, categorySlug, {
                  q: selectedQuery || undefined,
                  sort: selectedSort || undefined,
                  status: selectedStatus || undefined,
                  type: selectedType || undefined,
                  filter: selectedFilter || undefined,
                  page: String(pagination.page + 1)
                })}
                variant="secondary"
              >
                Pagina siguiente
              </ButtonLink>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
