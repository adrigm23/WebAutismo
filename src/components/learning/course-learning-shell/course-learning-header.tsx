"use client";

import { FolderOpen, LayoutPanelTop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { buildCourseForumHref } from "@/lib/course-navigation";
import { cn } from "@/lib/utils";
import { WorkspaceTabButton } from "./primitives";
import type { SidebarTab } from "./types";

type CourseLearningHeaderProps = {
  courseSlug: string;
  courseTitle: string;
  roleLabel: string;
  canModerate: boolean;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onResourcesClick: () => void;
  simpleMode: boolean;
  onSimpleModeChange: () => void;
};

export function CourseLearningHeader({
  courseSlug,
  courseTitle,
  roleLabel,
  canModerate,
  activeTab,
  onTabChange,
  onResourcesClick,
  simpleMode,
  onSimpleModeChange
}: CourseLearningHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(12,113,195,0.12)] bg-white/95 backdrop-blur-md">
      <div className="px-6 py-4 lg:px-12">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-4">
                <ButtonLink className="px-0 text-lg font-medium" href="/mi-cuenta" prefetch variant="ghost">
                  Volver al dashboard
                </ButtonLink>
                <span className="hidden h-8 w-px bg-[var(--color-border)] lg:block" />
                <h1 className="truncate text-[2.15rem] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                  {courseTitle}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={canModerate ? "teacher" : "student"}>{roleLabel}</Badge>
              <Badge tone="muted">{canModerate ? "Espacio de seguimiento" : "Acceso vigente"}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(12,113,195,0.08)] pt-3 xl:flex-row xl:items-center xl:justify-between">
            <nav aria-label="Navegacion del campus" className="flex flex-wrap items-center gap-2">
              <ButtonLink className="px-4 py-2.5 text-sm" href={`/mis-cursos/${courseSlug}`} prefetch variant="secondary">
                Campus
              </ButtonLink>
              <ButtonLink className="px-4 py-2.5 text-sm" href={`/mis-cursos/${courseSlug}/foro`} prefetch variant="ghost">
                Foro
              </ButtonLink>
              {canModerate ? (
                <ButtonLink
                  className="px-4 py-2.5 text-sm"
                  href={`/mis-cursos/${courseSlug}/seguimiento`}
                  prefetch
                  variant="ghost"
                >
                  Seguimiento
                </ButtonLink>
              ) : null}
              <ButtonLink className="px-4 py-2.5 text-sm" href="/mi-cuenta" prefetch variant="ghost">
                Mi cuenta
              </ButtonLink>
            </nav>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <WorkspaceTabButton
                active={activeTab === "content"}
                icon={LayoutPanelTop}
                label="Contenido"
                onClick={() => onTabChange("content")}
              />
              <WorkspaceTabButton
                active={activeTab === "resources"}
                icon={FolderOpen}
                label="Recursos y tareas"
                onClick={onResourcesClick}
              />
              <ButtonLink
                className="px-4 py-2.5 text-sm"
                href={buildCourseForumHref(courseSlug)}
                prefetch
                variant="ghost"
              >
                Comunidad
              </ButtonLink>
              <button
                aria-label={
                  simpleMode
                    ? "Cambiar a vista completa del campus"
                    : "Cambiar a vista simple del campus"
                }
                aria-pressed={simpleMode}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center rounded-full border px-4 py-2 text-left transition",
                  simpleMode
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                )}
                onClick={onSimpleModeChange}
                type="button"
              >
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">Vista simple</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {simpleMode ? "Activa" : "Desactivada"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
