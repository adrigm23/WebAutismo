"use client";

import Link from "next/link";
import { X, CheckCircle2, Circle, Lock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CourseProgressDetails } from "@/lib/course-progress";

type LessonOutlineProps = {
  course: CatalogCourse;
  progress: CourseProgressDetails;
  currentModuleIndex: number;
  onClose: () => void;
};

type ModuleStatus = "completed" | "current" | "pending";

function getModuleStatus(
  index: number,
  currentModuleIndex: number,
  isCompleted: boolean,
): ModuleStatus {
  if (isCompleted) return "completed";
  if (index === currentModuleIndex) return "current";
  return "pending";
}

function ModuleStatusIcon({
  status,
  index,
}: {
  status: ModuleStatus;
  index: number;
}) {
  if (status === "completed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
        {index + 1}
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-white">
      <Circle className="h-3.5 w-3.5 text-[var(--color-muted)]" />
    </span>
  );
}

export function LessonOutline({
  course,
  progress,
  currentModuleIndex,
  onClose,
}: LessonOutlineProps) {
  const modules = progress.modules;

  return (
    <aside className="flex h-full w-[22rem] shrink-0 flex-col border-l border-[var(--color-border)] bg-white">
      {/* Sidebar header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Temario del Curso
          </h2>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          onClick={onClose}
          type="button"
          aria-label="Cerrar temario"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto py-3">
        {modules.map((module, index) => {
          const status = getModuleStatus(index, currentModuleIndex, module.isCompleted);
          const isCurrent = index === currentModuleIndex;
          const href = `/mis-cursos/${course.slug}/leccion/${index}`;

          return (
            <Link
              key={module.id}
              href={href}
              className={cn(
                "group mx-2 mb-1 flex items-start gap-3 rounded-xl px-3 py-3 transition-all",
                isCurrent
                  ? "bg-[var(--color-primary)] text-white"
                  : "hover:bg-[var(--color-surface)]",
              )}
            >
              {/* Status icon */}
              <div className="mt-0.5">
                {status === "completed" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </span>
                )}
                {status === "current" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                )}
                {status === "pending" && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-muted)]">
                      {index + 1}
                    </span>
                  </span>
                )}
              </div>

              {/* Module info */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug",
                    isCurrent ? "text-white" : "text-[var(--color-ink)]",
                  )}
                >
                  {module.title}
                </p>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-2 text-xs",
                    isCurrent ? "text-white/60" : "text-[var(--color-muted)]",
                  )}
                >
                  {isCurrent && (
                    <span className="font-medium text-white/80">• En curso</span>
                  )}
                  {!isCurrent && module.isCompleted && (
                    <span className="text-emerald-600 font-medium">Completado</span>
                  )}
                  {!isCurrent && !module.isCompleted && (
                    <span>{module.estimatedTime}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer: course progress */}
      <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>
            {progress.completedModules} de {progress.totalModules} módulos
          </span>
          <span className="font-semibold text-emerald-600">
            {Math.round(progress.completionRate)}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress.completionRate}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
