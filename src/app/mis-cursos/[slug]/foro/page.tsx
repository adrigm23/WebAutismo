import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock, MoveRight, ShieldCheck } from "lucide-react";
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
import { getForumCategories, getForumSpaceHistory } from "@/lib/forum";
import { getForumCategoryPreset } from "@/lib/forum-presentation";
import { firstValue, formatCompactNumber } from "@/lib/utils";

type ForumHomePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ params }: ForumHomePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCatalogCourseBySlug(slug);

  return {
    title: course ? `Foro | ${course.title}` : "Foro",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ForumHomePage({
  params,
  searchParams
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
    userIsActive: user.isActive
  });

  if (!access.allowed) {
    redirect(`/checkout/${course.slug}`);
  }

  const [categories, history] = await Promise.all([
    getForumCategories(course.slug, access.role),
    getForumSpaceHistory(course.slug)
  ]);

  const query = firstValue(q)?.trim().toLowerCase() ?? "";
  const visibleCategories = query
    ? categories.filter((category) =>
        `${category.title} ${category.description}`.toLowerCase().includes(query)
      )
    : categories;
  const canModerate = canModerateCourse(access.role);
  const totalThreads = categories.reduce((sum, category) => sum + category._count.threads, 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}`}>
          {course.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Comunidad</span>
      </div>

      <section className="ui-card-base overflow-hidden">
        <div className="border-b border-[rgba(12,113,195,0.1)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={canModerate ? "info" : "warning"}>{getRoleLabel(access.role)}</Badge>
            <Badge tone="outline">{history.activeSpace.editionLabel}</Badge>
            <Badge tone="brand">Comunidad activa</Badge>
          </div>
          <h1 className="mt-4 text-display-md font-semibold text-[var(--color-ink)]">
            Categorías del foro
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            Accede a anuncios, dudas y conversaciones del curso dentro del mismo recorrido
            autenticado que campus, seguimiento y cuenta.
          </p>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-[#faf8f4] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Hilos visibles
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {formatCompactNumber(totalThreads)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-[#faf8f4] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Categorías
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {categories.length}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.1)] bg-[#faf8f4] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Archivo
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {history.archivedSpaces.length}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.length ? (
          visibleCategories.map((category) => {
            const preset = getForumCategoryPreset(category.slug);
            const Icon = preset.icon;

            return (
              <Link
                className="ui-card-base group relative flex min-h-[15.5rem] flex-col overflow-hidden px-5 py-5 transition hover:-translate-y-[2px] hover:border-[rgba(12,113,195,0.24)]"
                href={`/mis-cursos/${course.slug}/foro/${category.slug}`}
                key={category.id}
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${preset.accentClass}`} />
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${preset.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <MoveRight className="h-5 w-5 text-[var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)]" />
                </div>

                <div className="mt-5">
                  <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                    {category.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                    {category.description}
                  </p>
                </div>

                <div className="mt-auto space-y-3 pt-6">
                  <div className={`rounded-[var(--radius-md)] px-4 py-3 ${preset.softClass}`}>
                    <p className="text-sm leading-6 text-[var(--color-ink)]">
                      {preset.expectedContent}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(12,113,195,0.1)] pt-4 text-sm">
                    <span className="font-medium text-[var(--color-ink)]">
                      {category._count.threads} temas
                    </span>
                    <span className="text-[var(--color-muted)]">Abrir categoría</span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="ui-empty-state px-6 py-10 text-sm leading-7 text-[var(--color-muted)] md:col-span-2 xl:col-span-3">
            No hay categorías que coincidan con la búsqueda actual.
          </div>
        )}

        {canModerate ? (
          <div className="ui-card-base relative overflow-hidden px-5 py-5 md:col-span-2 xl:col-span-1">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_42%,rgba(12,113,195,0.04)_42%,rgba(12,113,195,0.04)_46%,transparent_46%,transparent_82%,rgba(255,182,6,0.06)_82%,rgba(255,182,6,0.06)_86%,transparent_86%)]" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.08)] text-[var(--color-primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Lock className="h-5 w-5 text-[var(--color-muted)]" />
              </div>

              <div className="mt-5">
                <Badge tone="info">Docencia y moderación</Badge>
                <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  Gestión de comunidad
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                  Revisa contenido reportado, restaura mensajes y consulta el histórico por
                  edición sin salir del área autenticada.
                </p>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <ButtonLink href={`/mis-cursos/${course.slug}/foro/moderacion`} variant="neutral">
                  Abrir moderación
                </ButtonLink>
                <ButtonLink href={`/mis-cursos/${course.slug}/foro/historico`} variant="subtle">
                  Ver histórico
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!canModerate ? (
        <div className="ui-state-panel px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
          Esta vista muestra la edición activa del foro. El histórico y las herramientas de
          moderación están reservados a profesorado y administración.
        </div>
      ) : null}
    </div>
  );
}
