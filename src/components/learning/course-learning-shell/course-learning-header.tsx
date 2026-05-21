"use client";

import { FolderOpen, LayoutPanelTop, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  buildCourseForumHref,
  buildCourseTrackingHref,
} from "@/lib/course-navigation";
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
};

export function CourseLearningHeader({
  courseSlug,
  courseTitle,
  roleLabel,
  canModerate,
  activeTab,
  onTabChange,
  onResourcesClick,
}: CourseLearningHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border-subtle)] bg-[rgba(250,247,242,0.88)] backdrop-blur-xl">
      <div className="site-container py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={canModerate ? "info" : "warning"}>{roleLabel}</Badge>
                <Badge tone="outline">Campus</Badge>
              </div>
              <h1 className="font-premium mt-3 text-display-sm font-semibold text-[var(--color-ink)]">
                {courseTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-body-sm text-[var(--color-muted)]">
                {canModerate
                  ? "Empieza por lo pendiente y usa el contenido como apoyo."
                  : "Sigue la leccion activa, abre la tarea cuando toque y mantente dentro del mismo hilo de aprendizaje."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 xl:justify-end">
              <ButtonLink href={`/mis-cursos/${courseSlug}`} size="sm" variant="neutral">
                Campus
              </ButtonLink>
              {canModerate ? (
                <ButtonLink
                  href={buildCourseTrackingHref({ courseSlug })}
                  size="sm"
                  variant="subtle"
                >
                  Seguimiento
                </ButtonLink>
              ) : null}
              <ButtonLink href={buildCourseForumHref(courseSlug)} size="sm" variant="subtle">
                Foro
              </ButtonLink>
              <ButtonLink href="/mi-cuenta" size="sm" variant="subtle">
                Mi cuenta
              </ButtonLink>
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-2.5">
            <nav
              aria-label="Navegacion del campus"
              className="flex flex-wrap items-center gap-1.5"
            >
              <WorkspaceTabButton
                active={activeTab === "content"}
                icon={LayoutPanelTop}
                label="Contenido"
                onClick={() => onTabChange("content")}
              />
              <WorkspaceTabButton
                active={activeTab === "resources"}
                icon={FolderOpen}
                label="Recursos"
                onClick={onResourcesClick}
              />
              <WorkspaceTabButton
                active={activeTab === "support"}
                icon={MessageSquareText}
                label="Comunidad"
                onClick={() => onTabChange("support")}
              />
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
