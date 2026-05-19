"use client";

import Link from "next/link";
import { FolderOpen, LayoutPanelTop, LifeBuoy, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildCourseForumHref, buildCourseTrackingHref } from "@/lib/course-navigation";
import { cn } from "@/lib/utils";
import { SimpleModeToggle, WorkspaceTabButton } from "./primitives";
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
  if (!canModerate) {
    return (
      <header className="sticky top-0 z-30 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.94)] backdrop-blur-md">
        <div className="site-container py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  Campus del curso
                </p>
                <h1 className="mt-2 text-display-md font-semibold text-[var(--color-ink)]">
                  {courseTitle}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                  Empieza por la lección activa y abre tus tareas solo cuando lo necesites.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                  href="/mis-cursos"
                >
                  Mis cursos
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                  href="/mi-cuenta"
                >
                  Mi cuenta
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  href={buildCourseForumHref(courseSlug)}
                >
                  Foro
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[rgba(12,113,195,0.08)] pt-3">
              <WorkspaceTabButton
                active={activeTab === "content"}
                icon={LayoutPanelTop}
                label="Lección"
                onClick={() => onTabChange("content")}
              />
              <WorkspaceTabButton
                active={activeTab === "resources"}
                icon={FolderOpen}
                label="Tareas"
                onClick={onResourcesClick}
              />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.94)] backdrop-blur-md">
      <div className="site-container py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={canModerate ? "info" : "warning"}>{roleLabel}</Badge>
                <Badge tone="outline">{canModerate ? "Campus docente" : "Campus del curso"}</Badge>
              </div>
              <h1 className="mt-3 text-display-md font-semibold text-[var(--color-ink)]">
                {courseTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                El campus mantiene contenido, tareas y soporte dentro del mismo recorrido para no
                romper el contexto de aprendizaje.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                href="/mi-cuenta"
              >
                Mi cuenta
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                href="/mis-cursos"
              >
                Mis cursos
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-primary)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)] transition"
                href={`/mis-cursos/${courseSlug}`}
              >
                Campus
              </Link>
              {canModerate ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                  href={buildCourseTrackingHref({ courseSlug })}
                >
                  Seguimiento
                </Link>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                href={buildCourseForumHref(courseSlug)}
              >
                Foro
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(12,113,195,0.08)] pt-3 xl:flex-row xl:items-center xl:justify-between">
            <nav aria-label="Navegacion del campus" className="flex flex-wrap items-center gap-2">
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
              <WorkspaceTabButton
                active={activeTab === "support"}
                icon={MessageSquareText}
                label="Comunidad"
                onClick={() => onTabChange("support")}
              />
              <Link
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold transition",
                  "text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                )}
                href={buildCourseForumHref(courseSlug)}
              >
                <LifeBuoy className="h-4 w-4" />
                Foro real
              </Link>
            </nav>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <SimpleModeToggle active={simpleMode} onClick={onSimpleModeChange} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
