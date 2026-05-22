"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ShieldCheck } from "lucide-react";
import type { ForumShellCategory } from "@/components/forum/forum-shell";
import { getForumCategoryPreset } from "@/lib/forum-presentation";
import { cn } from "@/lib/utils";

function isForumItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type ForumShellCategoryNavProps = {
  categories: ForumShellCategory[];
  courseSlug: string;
};

export function ForumShellCategoryDesktopNav({
  categories,
  courseSlug
}: ForumShellCategoryNavProps) {
  const pathname = usePathname();
  const forumRootPath = `/mis-cursos/${courseSlug}/foro`;

  return (
    <nav className="rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.07)] bg-white/74 p-2.5 shadow-[var(--shadow-soft)]">
      <p className="px-3 pb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Categorías
      </p>
      {categories.length ? (
        categories.map((category) => {
          const preset = getForumCategoryPreset(category.slug);
          const Icon = preset.icon;
          const href = `${forumRootPath}/${category.slug}`;
          const isActive = isForumItemActive(pathname, href);

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-[rgba(22,60,88,0.08)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_rgba(22,60,88,0.08)]"
                  : "text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]"
              )}
              href={href}
              key={category.id}
              prefetch
            >
              <div
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
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
          No hay categorías visibles en este curso.
        </div>
      )}
    </nav>
  );
}

type ForumShellDesktopModerationLinksProps = {
  courseSlug: string;
};

export function ForumShellDesktopModerationLinks({
  courseSlug
}: ForumShellDesktopModerationLinksProps) {
  const pathname = usePathname();
  const forumRootPath = `/mis-cursos/${courseSlug}/foro`;

  return (
    <>
      <Link
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith(`${forumRootPath}/moderacion`)
            ? "bg-[rgba(22,60,88,0.08)] text-[var(--color-primary)]"
            : "text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]"
        )}
        href={`${forumRootPath}/moderacion`}
      >
        <ShieldCheck className="h-4 w-4" />
        <span>Panel de moderación</span>
      </Link>
      <Link
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith(`${forumRootPath}/historico`)
            ? "bg-[rgba(22,60,88,0.08)] text-[var(--color-primary)]"
            : "text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]"
        )}
        href={`${forumRootPath}/historico`}
      >
        <Archive className="h-4 w-4" />
        <span>Archivo</span>
      </Link>
    </>
  );
}

export function ForumShellMobileCategoryList({
  categories,
  courseSlug
}: ForumShellCategoryNavProps) {
  const pathname = usePathname();
  const forumRootPath = `/mis-cursos/${courseSlug}/foro`;

  if (!categories.length) {
    return (
      <div className="ui-empty-state mt-3 px-4 py-5 text-sm text-[var(--color-muted)]">
        No hay categorías visibles en este curso.
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {categories.map((category) => {
        const preset = getForumCategoryPreset(category.slug);
        const Icon = preset.icon;
        const href = `${forumRootPath}/${category.slug}`;
        const isActive = isForumItemActive(pathname, href);

        return (
          <Link
            className={cn(
              "inline-flex max-w-full min-w-0 items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-[rgba(22,60,88,0.18)] bg-white text-[var(--color-primary)]"
                : "border-[rgba(22,60,88,0.1)] bg-[#faf8f4] text-[var(--color-ink)]"
            )}
            href={href}
            key={category.id}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{category.title}</span>
            <span className="text-xs text-[var(--color-muted)]">{category._count.threads}</span>
          </Link>
        );
      })}
    </div>
  );
}
