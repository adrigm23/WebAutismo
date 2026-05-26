"use client";

import { FolderOpen, LayoutPanelTop, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoursePrivateHeader } from "@/components/learning/course-private-header";
import { WorkspaceTabButton } from "./primitives";
import type { SidebarTab } from "./types";

type CourseLearningHeaderProps = {
  fullName: string;
  courseSlug: string;
  courseTitle: string;
  roleLabel: string;
  canModerate: boolean;
  showTrackingNav: boolean;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onResourcesClick: () => void;
};

export function CourseLearningHeader({
  fullName,
  courseSlug,
  courseTitle,
  roleLabel,
  canModerate,
  showTrackingNav,
  activeTab,
  onTabChange,
  onResourcesClick,
}: CourseLearningHeaderProps) {
  return (
    <div>
      <CoursePrivateHeader
        activeSection="campus"
        courseSlug={courseSlug}
        fullName={fullName}
        roleLabel={roleLabel}
        showTrackingNav={showTrackingNav}
      />

      <section className="border-b border-[var(--color-border-subtle)] bg-[rgba(250,247,242,0.88)]">
        <div className="site-container py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={canModerate ? "info" : "warning"}>
                    {roleLabel}
                  </Badge>
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

              <div className="flex flex-wrap items-center gap-2">
                {showTrackingNav ? (
                  <Badge tone="info">Docencia integrada</Badge>
                ) : (
                  <Badge tone="outline">Ruta privada</Badge>
                )}
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
      </section>
    </div>
  );
}
