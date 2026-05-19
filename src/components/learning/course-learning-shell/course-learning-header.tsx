"use client";

import Link from "next/link";
import { FolderOpen, LayoutPanelTop, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <header className="sticky top-0 z-30 border-b border-[rgba(12,113,195,0.12)] bg-[rgba(255,255,255,0.94)] backdrop-blur-md">
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
              <h1 className="mt-2 text-display-md font-semibold text-[var(--color-ink)]">
                {courseTitle}
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[var(--color-muted)]">
                {canModerate
                  ? "Empieza por lo pendiente y usa el contenido como apoyo."
                  : "Empieza por la leccion activa y continua desde ahi."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 xl:justify-end">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-primary)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)] transition"
                href={`/mis-cursos/${courseSlug}`}
              >
                Campus
              </Link>
              {canModerate ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                  href={buildCourseTrackingHref({ courseSlug })}
                >
                  Seguimiento
                </Link>
              ) : null}
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                href={buildCourseForumHref(courseSlug)}
              >
                Foro
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                href="/mi-cuenta"
              >
                Mi cuenta
              </Link>
            </div>
          </div>

          <div className="border-t border-[rgba(12,113,195,0.08)] pt-2.5">
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
