import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare, MoveRight, Pin } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StateBanner } from "@/components/ui/state-banner";
import { SurfaceCard } from "@/components/ui/surface-card";
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

export async function generateMetadata({ params }: ForumCategoryPageProps): Promise<Metadata> {
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
  const announcementCount = forumData.threads.filter(
    (thread) => thread.type === "ANNOUNCEMENT"
  ).length;
  const baseQuery = {
    q: selectedQuery || undefined,
    sort: selectedSort || undefined
  };

  const filters = [
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
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}/foro`} prefetch>
          Comunidad
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">{forumData.category.title}</span>
      </div>

      <SurfaceCard
        actions={
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/mis-cursos/${course.slug}/foro/${categorySlug}/nuevo`} prefetch>
              Nuevo hilo
            </ButtonLink>
            {canModerate ? (
              <ButtonLink
                href={`/mis-cursos/${course.slug}/foro/moderacion`}
                prefetch
                variant="neutral"
              >
                Moderación
              </ButtonLink>
            ) : null}
          </div>
        }
        className="border-[rgba(22,60,88,0.1)] bg-white/90"
        padding="md"
      >
        <SectionHeader
          description={forumData.category.description}
          eyebrow={
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge tone={canModerate ? "info" : "warning"}>{getRoleLabel(access.role)}</Badge>
              <Badge className="hidden sm:inline-flex" tone="outline">
                Categoría activa
              </Badge>
            </span>
          }
          title={forumData.category.title}
        />

        <div className="mt-5 grid gap-3 border-t border-[rgba(22,60,88,0.08)] pt-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total", value: formatCompactNumber(totalThreads) },
            { label: "Abiertos", value: String(openCount) },
            { label: "Sin respuesta", value: String(unansweredCount) },
            { label: "Resueltos", value: String(resolvedCount) },
            { label: "Anuncios", value: String(announcementCount) }
          ].map((metric) => (
            <div
              className="rounded-[var(--radius-md)] bg-[rgba(248,245,239,0.72)] px-4 py-3"
              key={metric.label}
            >
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {metric.label}
              </p>
              <p className="mt-1.5 font-premium text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex w-max min-w-full gap-2 px-1">
          {filters.map((tab) => (
            <Link
              className={
                tab.active
                  ? "inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] border border-[rgba(22,60,88,0.18)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
                  : "inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-[var(--color-ink-soft)] transition hover:bg-white hover:text-[var(--color-primary)]"
              }
              href={tab.href}
              key={tab.label}
              prefetch
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <SurfaceCard className="border-[rgba(22,60,88,0.08)] bg-white/88 p-0" padding="md">
        {filteredThreads.length ? (
          <div className="divide-y divide-[rgba(22,60,88,0.08)]">
            {filteredThreads.map((thread) => (
              <Link
                className="group block px-5 py-4 transition hover:bg-[rgba(22,60,88,0.03)] sm:px-6 sm:py-5"
                href={`/mis-cursos/${course.slug}/foro/${categorySlug}/${thread.id}`}
                key={thread.id}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.isPinned ? (
                      <Badge tone="warning">
                        <Pin className="mr-1 h-3.5 w-3.5" />
                        Fijado
                      </Badge>
                    ) : null}
                    {thread.type === "ANNOUNCEMENT" ? <Badge tone="brand">Anuncio</Badge> : null}
                    {thread.isResolved ? <Badge tone="success">Resuelto</Badge> : null}
                    {thread.isClosed ? <Badge tone="outline">Cerrado</Badge> : null}
                    <Badge tone={canModerateCourse(thread.authorRole) ? "info" : "warning"}>
                      {getRoleLabel(thread.authorRole)}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-premium text-[1.24rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.45rem]">
                        {thread.title}
                      </h2>
                      <p className="mt-2.5 line-clamp-3 max-w-4xl whitespace-pre-line break-words text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                        {thread.body}
                      </p>
                    </div>
                    <MoveRight className="mt-1 hidden h-5 w-5 shrink-0 text-[var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)] sm:block" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-sm text-[var(--color-muted)]">
                    <span>{thread.author.name}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(thread.createdAt)}</span>
                    {thread.type === "ANNOUNCEMENT" &&
                    thread.scheduledFor &&
                    !thread.publishedAt ? (
                      <>
                        <span>•</span>
                        <span>Se publica {formatDateTime(thread.scheduledFor)}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[rgba(248,245,239,0.8)] px-3 py-1.5 font-medium text-[var(--color-ink-soft)]">
                      <MessageSquare className="h-4 w-4 text-[var(--color-muted)]" />
                      <span>{thread._count.posts} respuestas</span>
                    </div>
                    <span className="text-[var(--color-muted)]">
                      Última actividad {formatRelativeTime(thread.lastActivityAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            align="center"
            description="Cambia los filtros o crea un nuevo hilo para abrir conversación en esta categoría."
            title="No hay hilos que coincidan con la vista actual"
          />
        )}
      </SurfaceCard>

      {pagination.totalPages > 1 ? (
        <StateBanner
          actions={
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
                  variant="neutral"
                >
                  Página anterior
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
                  variant="neutral"
                >
                  Página siguiente
                </ButtonLink>
              ) : null}
            </div>
          }
          description={`Página ${pagination.page} de ${pagination.totalPages} · ${pagination.totalItems} hilos visibles en esta categoría.`}
          tone="info"
        />
      ) : null}
    </div>
  );
}
