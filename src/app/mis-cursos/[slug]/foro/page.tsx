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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link className="hover:text-[var(--color-primary)]" href={`/mis-cursos/${course.slug}`}>
          {course.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--color-ink)]">Foro</span>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={canModerate ? "teacher" : "student"}>{getRoleLabel(access.role)}</Badge>
            <Badge tone="muted">{history.activeSpace.editionLabel}</Badge>
          </div>
          <h1 className="mt-3 text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)] sm:text-[3.25rem]">
            Categorías del foro
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            Participa en discusiones, comparte materiales y mantén organizada la conversación de esta edición del curso.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-white px-4 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Hilos
            </p>
            <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {formatCompactNumber(totalThreads)}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-white px-4 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Categorías
            </p>
            <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {categories.length}
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(12,113,195,0.12)] bg-white px-4 py-4 shadow-[0_16px_32px_rgba(34,34,33,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Archivo
            </p>
            <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
              {history.archivedSpaces.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.length ? (
          visibleCategories.map((category) => {
            const preset = getForumCategoryPreset(category.slug);
            const Icon = preset.icon;

            return (
              <Link
                className="group relative overflow-hidden rounded-[28px] border border-[rgba(12,113,195,0.14)] bg-white px-5 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)] transition hover:-translate-y-1 hover:border-[var(--color-primary)] min-h-[16.5rem]"
                href={`/mis-cursos/${course.slug}/foro/${category.slug}`}
                key={category.id}
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${preset.accentClass}`} />
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${preset.iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <MoveRight className="h-5 w-5 text-[var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)]" />
                  </div>

                  <div className="mt-5">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                      {category.title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-3 pt-6">
                    <div className={`rounded-[20px] px-4 py-3 ${preset.softClass}`}>
                      <p className="text-sm leading-6 text-[var(--color-ink)]">
                        {preset.expectedContent}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-5 border-t border-[rgba(12,113,195,0.12)] pt-4 text-sm text-[var(--color-ink)]">
                      <span>{category._count.threads} temas</span>
                      <span className="text-[var(--color-muted)]">
                        {history.activeSpace.editionLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-[30px] border border-dashed border-[rgba(12,113,195,0.2)] bg-white px-6 py-10 text-[var(--color-muted)] lg:col-span-3">
            No hay categorías que coincidan con la búsqueda actual.
          </div>
        )}

        {canModerate ? (
          <div className="relative overflow-hidden rounded-[28px] border border-[rgba(12,113,195,0.14)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,241,236,0.98))] px-5 py-5 shadow-[0_18px_40px_rgba(34,34,33,0.05)] md:col-span-2 xl:col-span-1">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_40%,rgba(12,113,195,0.04)_40%,rgba(12,113,195,0.04)_44%,transparent_44%,transparent_84%,rgba(12,113,195,0.03)_84%,rgba(12,113,195,0.03)_88%,transparent_88%)]" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(12,113,195,0.08)] text-[var(--color-primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Lock className="h-5 w-5 text-[var(--color-muted)]" />
              </div>

              <div className="mt-5">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                  Panel admin
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--color-muted)]">
                  Moderación, restauración de contenido, actividad reciente y gestión de ediciones archivadas.
                </p>
              </div>

              <div className="mt-auto space-y-3 pt-6">
                <ButtonLink href={`/mis-cursos/${course.slug}/foro/moderacion`} variant="secondary">
                  Abrir moderación
                </ButtonLink>
                <ButtonLink href={`/mis-cursos/${course.slug}/foro/historico`} variant="ghost">
                  Abrir histórico
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!canModerate ? (
        <div className="rounded-[28px] border border-[rgba(12,113,195,0.12)] bg-white px-6 py-5 text-sm leading-7 text-[var(--color-muted)] shadow-[0_18px_40px_rgba(34,34,33,0.04)]">
          Esta vista muestra solo la edición activa del foro. El histórico y las herramientas de moderación están reservados a profesorado y administración.
        </div>
      ) : null}
    </div>
  );
}
