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
    <div className="border-b border-[rgba(22,60,88,0.08)] bg-[linear-gradient(180deg,#fbfaf7_0%,#f7f5fb_100%)]">
      <CoursePrivateHeader
        activeSection="campus"
        courseSlug={courseSlug}
        fullName={fullName}
        roleLabel={roleLabel}
        showTrackingNav={showTrackingNav}
      />

      <section>
        <div className="app-container py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 text-[0.95rem] text-[var(--color-ink-soft)]">
                <span>Mis cursos</span>
                <ChevronRight className="h-4 w-4" />
                <span className="truncate">{courseTitle}</span>
              </div>

              <h1 className="font-premium mt-5 max-w-[18ch] text-[clamp(2.2rem,4.4vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.06em] text-[var(--color-primary)] text-balance">
                {courseTitle}
              </h1>
              <p className="mt-4 max-w-[54rem] text-[1.08rem] leading-8 text-[var(--color-ink)]/88">
                {getHeroDescription(activeTab)}
              </p>
              <Badge className="mt-5" tone="outline">
                {statusLabel}
              </Badge>
            </div>

            <div className="lg:pt-2">
              <Button onClick={onPrimaryAction} size="lg" type="button" variant="neutral">
                {primaryActionLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav
            aria-label="Secciones del curso"
            className="mt-8 flex items-center gap-8 border-b border-[rgba(22,60,88,0.08)]"
          >
            {tabItems.map((item) => (
              <button
                className={cn(
                  "border-b-2 px-0 pb-3 text-[1.02rem] font-medium tracking-[-0.02em] transition",
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
