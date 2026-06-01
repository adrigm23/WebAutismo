import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Lock,
  MessageSquareText,
  MoveRight,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricPanel } from "@/components/ui/metric-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import {
  canAccessCourseCommunity,
  canModerateCourse,
  getRoleLabel,
} from "@/lib/course-community";
import {
  getForumCategories,
  getForumSpaceHistory,
  getRecentForumThreads,
} from "@/lib/forum";
import { getForumCategoryPreset } from "@/lib/forum-presentation";
import { cn, firstValue, formatCompactNumber, formatRelativeTime } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

type ForumHomePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: ForumHomePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Foro | ${course.title}` : "Foro",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ForumHomePage({
  params,
  searchParams,
}: ForumHomePageProps) {
  const { slug } = await params;
  const { q } = await searchParams;
  const course = await getCatalogCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await requireUser(`/mis-cursos/${course.slug}/foro`);
  const access = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug: course.slug,
    userGlobalRole: user.globalRole,
    userIsActive: user.isActive,
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const canModerate = canModerateCourse(access.role);

  const [categories, history, recentThreads] = await Promise.all([
    getForumCategories(course.slug, access.role),
    getForumSpaceHistory(course.slug),
    getRecentForumThreads(course.slug, access.role, 5),
  ]);

  const query = firstValue(q)?.trim().toLowerCase() ?? "";
  const visibleCategories = query
    ? categories.filter((category) =>
        `${category.title} ${category.description}`
          .toLowerCase()
          .includes(query),
      )
    : categories;
  const totalThreads = categories.reduce(
    (sum, category) => sum + category._count.threads,
    0,
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link
          className="hover:text-[var(--color-primary)]"
          href={`/mis-cursos/${course.slug}`}
        >
          {course.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Comunidad</span>
      </div>

      {/* Header card */}
      <SurfaceCard
        actions={
          canModerate ? (
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={`/mis-cursos/${course.slug}/foro/moderacion`}
                variant="neutral"
              >
                Moderación
              </ButtonLink>
              <ButtonLink
                href={`/mis-cursos/${course.slug}/foro/historico`}
                variant="subtle"
              >
                Histórico
              </ButtonLink>
            </div>
          ) : null
        }
        className="border-[rgba(22,60,88,0.1)] bg-white/90"
        padding="md"
      >
        <SectionHeader
          description="La comunidad acompaña el curso: anuncios, preguntas y conversaciones recuperables sin cambiar de contexto."
          eyebrow={
            canModerate ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <Badge tone="info">{getRoleLabel(access.role)}</Badge>
                <Badge className="hidden sm:inline-flex" tone="outline">
                  {history.activeSpace.editionLabel}
                </Badge>
              </span>
            ) : (
              <Badge tone="outline">
                {history.activeSpace.editionLabel}
              </Badge>
            )
          }
          title="Conversaciones del curso"
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <MetricPanel
            detail="Temas visibles en la edición actual."
            label="Hilos"
            tone="default"
            value={formatCompactNumber(totalThreads)}
          />
          <MetricPanel
            detail="Categorías activas para orientar la conversación."
            label="Categorías"
            tone="brand"
            value={categories.length}
          />
        </div>

        {/* Histórico solo visible para moderadores */}
        {canModerate && history.archivedSpaces.length > 0 && (
          <div className="mt-3">
            <MetricPanel
              detail="Espacios previos conservados para consulta docente."
              label="Histórico"
              tone="warning"
              value={history.archivedSpaces.length}
            />
          </div>
        )}
      </SurfaceCard>

      {/* Últimas conversaciones — solo si hay datos */}
      {recentThreads.length > 0 && (
        <SurfaceCard
          className="border-[rgba(22,60,88,0.08)] bg-white/88"
          padding="md"
        >
          <h2 className="font-premium text-heading-md font-semibold text-[var(--color-ink)]">
            Últimas conversaciones
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Actividad más reciente de la comunidad de este curso.
          </p>
          <div className="mt-5 divide-y divide-[rgba(22,60,88,0.07)]">
            {recentThreads.map((thread) => (
              <Link
                key={thread.id}
                className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0 hover:text-[var(--color-primary)]"
                href={`/mis-cursos/${course.slug}/foro/${thread.category.slug}/${thread.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)] transition group-hover:text-[var(--color-primary)]">
                    {thread.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className="rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 font-medium text-[var(--color-primary)]">
                      {thread.category.title}
                    </span>
                    <span>{formatRelativeTime(thread.lastActivityAt)}</span>
                    {thread.postCount > 0 && (
                      <span>
                        {thread.postCount}{" "}
                        {thread.postCount === 1 ? "respuesta" : "respuestas"}
                      </span>
                    )}
                  </div>
                </div>
                <MoveRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]" />
              </Link>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Grid de categorías */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.length ? (
          visibleCategories.map((category) => {
            const preset = getForumCategoryPreset(category.slug);
            const Icon = preset.icon;

            return (
              <Link
                className="group"
                href={`/mis-cursos/${course.slug}/foro/${category.slug}`}
                key={category.id}
              >
                <SurfaceCard
                  className="h-full border-[rgba(22,60,88,0.08)] bg-white/84 transition duration-[var(--motion-duration-base)] hover:-translate-y-[1px] hover:border-[rgba(22,60,88,0.14)]"
                  padding="md"
                  variant="interactive"
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={cn(
                          "grid h-11 w-11 place-items-center rounded-2xl",
                          preset.iconClass,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <MoveRight className="h-5 w-5 shrink-0 text-[var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)]" />
                    </div>

                    <div className="mt-4 min-w-0">
                      <h2 className="font-premium text-[1.28rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.5rem]">
                        {category.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                        {category.description}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                      {preset.expectedContent}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
                      <span className="font-medium text-[var(--color-ink-soft)]">
                        {category._count.threads} temas
                      </span>
                      <span className="text-[var(--color-muted)]">
                        Abrir conversación
                      </span>
                    </div>
                  </div>
                </SurfaceCard>
              </Link>
            );
          })
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              align="center"
              description="Prueba con otro término o limpia la búsqueda para volver a ver todas las categorías activas del curso."
              icon={<MessageSquareText className="h-5 w-5" />}
              title="No hay categorías que coincidan con esta búsqueda"
              tone="subtle"
            />
          </div>
        )}

        {/* Card de moderación — solo para docentes */}
        {canModerate ? (
          <SurfaceCard
            className="border-[rgba(22,60,88,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,247,251,0.88))] md:col-span-2 xl:col-span-1"
            padding="md"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Lock className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
              </div>

              <div className="mt-5">
                <Badge tone="info">Docencia</Badge>
                <h2 className="mt-3 font-premium text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  Gestión de comunidad
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Revisa contenido reportado o consulta espacios anteriores sin
                  separar el foro del resto del campus.
                </p>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <ButtonLink
                  href={`/mis-cursos/${course.slug}/foro/moderacion`}
                  variant="neutral"
                >
                  Abrir moderación
                </ButtonLink>
                <ButtonLink
                  href={`/mis-cursos/${course.slug}/foro/historico`}
                  variant="subtle"
                >
                  Ver histórico
                </ButtonLink>
              </div>
            </div>
          </SurfaceCard>
        ) : null}
      </div>
    </div>
  );
}
