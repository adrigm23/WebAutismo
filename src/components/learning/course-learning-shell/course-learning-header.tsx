"use client";

import Link from "next/link";
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

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

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
        <div className="app-container py-4 sm:py-5">
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
              <p className="mt-3 max-w-[52rem] text-[1rem] leading-7 text-[var(--color-ink)]/86">
                {getHeroDescription(activeTab)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-[var(--radius-lg)] border border-[rgba(22,60,88,0.08)] bg-white/70 p-1.5 shadow-[var(--shadow-inset-soft)]">
              {tabItems.map((item) => (
                <button
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-[var(--radius-md)] px-4 text-[0.98rem] font-medium tracking-[-0.02em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-canvas)]",
                    item.value === activeTab
                      ? "bg-[var(--color-surface-elevated)] text-[var(--color-ink)] shadow-[0_8px_18px_-16px_rgba(22,60,88,0.28)]"
                      : "text-[var(--color-ink-soft)] hover:bg-white/92 hover:text-[var(--color-ink)]",
                  )}
                  key={item.value}
                  onClick={() => onTabChange(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-[rgba(22,60,88,0.08)] bg-white/82" tone="outline">
                {statusLabel}
              </Badge>
              <Button
                className="border-[rgba(22,60,88,0.12)] bg-white/68 px-4 shadow-none hover:bg-white"
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
        </div>
      </section>
    </div>
  );
}

export function FocusedTaskHeader(input: {
  courseTitle: string;
  fullName: string;
  moduleTitle?: string | null;
  onBack: () => void;
  statusLabel: string;
}) {
  const initials = getUserInitials(input.fullName);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(22,60,88,0.08)] bg-[rgba(255,253,250,0.96)] backdrop-blur-xl">
      <div className="app-container">
        <div className="mx-auto flex max-w-[71rem] items-center justify-between gap-4 py-3 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              aria-label="Volver a todas las tareas"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink)] transition-colors duration-[var(--motion-duration-base)] hover:bg-[rgba(22,60,88,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              onClick={input.onBack}
              type="button"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                {input.moduleTitle ?? "Tarea del curso"}
              </p>
              <p className="truncate text-[0.98rem] font-medium tracking-[-0.02em] text-[var(--color-ink)] sm:text-[1.08rem]">
                {input.courseTitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Badge
              className="gap-2 border border-[rgba(22,60,88,0.1)] bg-white/90 px-3 py-1.5 text-[0.86rem] font-medium text-[var(--color-ink)]"
              shape="rounded"
              tone="outline"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-soft)]" />
              {input.statusLabel}
            </Badge>

            <Link
              aria-label={`Abrir mi cuenta de ${input.fullName}`}
              className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(180deg,#d7e4ee_0%,#b9cbdc_100%)] text-sm font-semibold text-[var(--color-primary)] transition-transform duration-[var(--motion-duration-base)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              href="/mi-cuenta"
            >
              {initials}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
