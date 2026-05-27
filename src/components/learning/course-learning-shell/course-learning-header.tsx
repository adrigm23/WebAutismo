"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoursePrivateHeader } from "@/components/learning/course-private-header";
import { cn } from "@/lib/utils";
import type { SidebarTab } from "./types";

type CourseLearningHeaderProps = {
  fullName: string;
  courseSlug: string;
  courseTitle: string;
  roleLabel: string;
  showTrackingNav: boolean;
  activeTab: SidebarTab;
  statusLabel: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onTabChange: (tab: SidebarTab) => void;
};

function getHeroDescription(tab: SidebarTab) {
  if (tab === "resources") {
    return "Material complementario, guias practicas y plantillas descargables para apoyar el proceso de aprendizaje.";
  }

  if (tab === "support") {
    return "Conversacion del curso, dudas abiertas y soporte contextual dentro del mismo recorrido.";
  }

  return "Retoma el contenido activo y mantente dentro del mismo hilo de aprendizaje.";
}

const tabItems: Array<{
  label: string;
  value: SidebarTab;
}> = [
  { label: "Contenido", value: "content" },
  { label: "Recursos", value: "resources" },
  { label: "Comunidad", value: "support" },
];

export function CourseLearningHeader({
  fullName,
  courseSlug,
  courseTitle,
  roleLabel,
  showTrackingNav,
  activeTab,
  statusLabel,
  primaryActionLabel,
  onPrimaryAction,
  onTabChange,
}: CourseLearningHeaderProps) {
  return (
    <div className="border-b border-[rgba(22,60,88,0.08)] bg-[linear-gradient(180deg,#fbfaf8_0%,#f7f5fb_62%,#f6f5fa_100%)]">
      <CoursePrivateHeader
        activeSection="campus"
        courseSlug={courseSlug}
        fullName={fullName}
        roleLabel={roleLabel}
        showTrackingNav={showTrackingNav}
      />

      <section>
        <div className="app-container py-5 sm:py-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 text-[0.92rem] text-[var(--color-ink-soft)]">
                <span>Mis cursos</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="truncate">{courseTitle}</span>
              </div>

              <h1 className="font-premium mt-3 max-w-[19ch] text-[clamp(2rem,3.5vw,3rem)] leading-[1.03] font-semibold tracking-[-0.055em] text-[var(--color-primary)] text-balance">
                {courseTitle}
              </h1>
              <p className="mt-3 max-w-[58rem] text-[1rem] leading-7 text-[var(--color-ink)]/86">
                {getHeroDescription(activeTab)}
              </p>
              <Badge className="mt-4" tone="outline">
                {statusLabel}
              </Badge>
            </div>

            <div className="self-start lg:pt-1">
              <Button
                className="border-[rgba(22,60,88,0.12)] bg-white/62 px-4 shadow-none hover:bg-white/88"
                onClick={onPrimaryAction}
                size="md"
                type="button"
                variant="subtle"
              >
                {primaryActionLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav
            aria-label="Secciones del curso"
            className="mt-6 flex items-center gap-6 border-b border-[rgba(22,60,88,0.08)]"
          >
            {tabItems.map((item) => (
              <button
                className={cn(
                  "border-b-2 px-0 pb-2.5 text-[1rem] font-medium tracking-[-0.02em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
                  item.value === activeTab
                    ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-ink-soft)] hover:border-[rgba(22,60,88,0.18)] hover:text-[var(--color-ink)]",
                )}
                key={item.value}
                onClick={() => onTabChange(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
