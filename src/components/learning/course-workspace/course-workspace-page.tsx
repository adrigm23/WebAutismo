"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileArchive,
  FileText,
  PlayCircle,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CourseProgressDetails, CourseModuleProgressState } from "@/lib/course-progress";
import type { CampusResourceItem } from "@/lib/course-resources";

// ─── helpers ─────────────────────────────────────────────────────────────────

type ModuleStatus = "completed" | "in-progress" | "upcoming";

function getModuleStatus(
  modules: CourseModuleProgressState[],
  index: number,
): ModuleStatus {
  if (modules[index]?.isCompleted) return "completed";
  const firstIncomplete = modules.findIndex((m) => !m.isCompleted);
  if (index === firstIncomplete) return "in-progress";
  return "upcoming";
}

function getFileIcon(mimeType: string | null, resourceType: string) {
  if (mimeType?.startsWith("video/") || resourceType === "VIDEO") return Video;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType?.includes("zip") ||
    mimeType?.includes("archive") ||
    mimeType?.includes("compressed")
  )
    return FileArchive;
  return Archive;
}

function getLessonIcon(resource: CampusResourceItem) {
  if (
    resource.mimeType?.startsWith("video/") ||
    resource.linkUrl?.includes("youtube") ||
    resource.linkUrl?.includes("vimeo")
  )
    return PlayCircle;
  return Circle;
}

function formatMonthDay(date: Date | string): { month: string; day: string } {
  const d = date instanceof Date ? date : new Date(date);
  const month = d.toLocaleString("es-ES", { month: "short" }).toUpperCase();
  const day = String(d.getDate());
  return { month, day };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ProgressCard({
  progress,
  courseSlug,
  inProgressIndex,
}: {
  progress: CourseProgressDetails;
  courseSlug: string;
  inProgressIndex: number;
  inProgressTitle?: string;
}) {
  const pct = Math.round(progress.completionRate);
  const href = `/mis-cursos/${courseSlug}/leccion/${Math.max(0, inProgressIndex)}`;

  return (
    <div className="min-w-[220px] rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--color-ink-soft)]">Progreso del curso</span>
        <span className="text-xl font-bold text-[var(--color-primary)]">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        href={href}
      >
        Continuar Módulo {Math.max(1, inProgressIndex + 1)}
      </Link>
    </div>
  );
}

function ModuleCard({
  module,
  moduleIndex,
  status,
  moduleResources,
  courseSlug,
  defaultOpen,
}: {
  module: CourseModuleProgressState;
  moduleIndex: number;
  status: ModuleStatus;
  moduleResources: CampusResourceItem[];
  courseSlug: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const lessonCount = moduleResources.length || 1;
  const lessonLabel = lessonCount === 1 ? "1 lección" : `${lessonCount} lecciones`;

  const continueHref = `/mis-cursos/${courseSlug}/leccion/${moduleIndex}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition",
        status === "in-progress"
          ? "border-[var(--color-success)] bg-white shadow-[var(--shadow-xs)]"
          : status === "completed"
            ? "border-[var(--color-border)] bg-white"
            : "border-[var(--color-border)] bg-[var(--color-bg-subtle)]",
      )}
    >
      {/* Module header — always clickable */}
      <button
        className="flex w-full items-center gap-4 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {/* Status icon */}
        {status === "completed" && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]">
            <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
        )}
        {status === "in-progress" && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-success)] bg-[var(--color-success-soft)]">
            <PlayCircle className="h-5 w-5 text-[var(--color-success)]" />
          </span>
        )}
        {status === "upcoming" && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-white text-xs font-bold text-[var(--color-ink-muted)]">
            {moduleIndex + 1}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              status === "upcoming" ? "text-[var(--color-ink-soft)]" : "text-[var(--color-primary)]",
            )}
          >
            Módulo {moduleIndex + 1}: {module.title}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              status === "in-progress"
                ? "font-medium text-[var(--color-success)]"
                : "text-[var(--color-ink-muted)]",
            )}
          >
            {status === "completed" && `${lessonLabel} · ${module.estimatedTime}`}
            {status === "in-progress" && `En curso · ${module.estimatedTime}`}
            {status === "upcoming" && `${lessonLabel} · ${module.estimatedTime}`}
          </p>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--color-ink-muted)] transition-transform",
            open && "-rotate-180",
          )}
        />
      </button>

      {/* Lesson items — always accessible */}
      {open && (
        <div className="divide-y divide-[var(--color-border-subtle)] border-t border-[var(--color-border-subtle)] px-4">
          {moduleResources.length > 0 ? (
            moduleResources.map((resource, rIdx) => {
              const LessonIcon = getLessonIcon(resource);
              const isCurrent = status === "in-progress" && rIdx === 0;
              const isLessonCompleted = status === "completed";

              // Exercises → submission form; external links → external URL;
              // everything else (PDF, video, file material) → lesson player
              const itemHref = resource.isExercise
                ? resource.href
                : resource.isExternal
                  ? resource.href
                  : continueHref;
              const typeLabel = resource.isExercise
                ? "Tarea"
                : resource.mimeType === "application/pdf"
                  ? "PDF"
                  : resource.mimeType?.startsWith("video/") || resource.linkUrl
                    ? "Video"
                    : "Material";

              return (
                <div
                  className={cn(
                    "flex items-center gap-3 py-3",
                    isCurrent && "rounded-lg bg-[var(--color-success-soft)]/50",
                  )}
                  key={resource.id}
                >
                  {isLessonCompleted ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                  ) : (
                    <LessonIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isCurrent ? "text-[var(--color-success)]" : "text-[var(--color-ink-muted)]",
                      )}
                    />
                  )}

                  {/* Title — always a link if href exists */}
                  {itemHref ? (
                    <Link
                      className={cn(
                        "flex-1 text-sm leading-snug transition hover:text-[var(--color-primary)]",
                        isCurrent
                          ? "font-semibold text-[var(--color-success)]"
                          : isLessonCompleted
                            ? "text-[var(--color-ink-soft)]"
                            : "text-[var(--color-ink-soft)]",
                      )}
                      href={itemHref}
                      rel={resource.isExternal ? "noopener noreferrer" : undefined}
                      target={resource.isExternal ? "_blank" : undefined}
                    >
                      {resource.title}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "flex-1 text-sm leading-snug",
                        isCurrent
                          ? "font-semibold text-[var(--color-success)]"
                          : "text-[var(--color-ink-soft)]",
                      )}
                    >
                      {resource.title}
                    </span>
                  )}

                  {isCurrent ? (
                    <Link
                      className="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                      href={continueHref}
                    >
                      Continuar
                    </Link>
                  ) : (
                    <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
                      {typeLabel}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            // Fallback when no DB resources — derive from module data
            <>
              <div className="flex items-center gap-3 py-3">
                {status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                ) : (
                  <PlayCircle
                    className={cn(
                      "h-4 w-4 shrink-0",
                      status === "in-progress"
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-ink-muted)]",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm",
                    status === "in-progress"
                      ? "font-semibold text-[var(--color-success)]"
                      : "text-[var(--color-ink-soft)]",
                  )}
                >
                  {module.title}
                </span>
                {status === "in-progress" ? (
                  <Link
                    className="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                    href={continueHref}
                  >
                    Continuar
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
                    {module.estimatedTime}
                  </span>
                )}
              </div>
              {module.resourcesSummary && (
                <div className="flex items-center gap-3 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
                  <span className="flex-1 text-sm text-[var(--color-ink-soft)]">
                    {module.resourcesSummary}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">PDF</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── right sidebar cards ──────────────────────────────────────────────────────

function InstructorCard({ course }: { course: CatalogCourse }) {
  const teacher = course.teachers[0];
  if (!teacher) return null;

  const initials = teacher.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("");

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
        Instructora del Curso
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),rgba(217,232,251,0.92))] text-base font-bold text-[var(--color-primary)]">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-primary)]">{teacher.name}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{teacher.role}</p>
        </div>
      </div>
      {teacher.bio && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">{teacher.bio}</p>
      )}
    </div>
  );
}


function DatesCard({ course }: { course: CatalogCourse }) {
  const edition = course.activeEdition;
  if (!edition) return null;

  const dates: { date: Date; label: string; sublabel: string }[] = [];
  if (edition.startsAt)
    dates.push({
      date: edition.startsAt,
      label: "Inicio de edición",
      sublabel: edition.label,
    });
  if (edition.endsAt)
    dates.push({
      date: edition.endsAt,
      label: "Cierre de Evaluaciones",
      sublabel: "Fecha límite para entrega final",
    });

  if (dates.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
        Fechas Importantes
      </p>
      <div className="mt-3 space-y-3">
        {dates.map(({ date, label, sublabel }) => {
          const { month, day } = formatMonthDay(date);
          return (
            <div className="flex items-start gap-3" key={label}>
              <div className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-[var(--color-border)] py-1 text-center">
                <span className="text-[0.55rem] font-bold uppercase text-[var(--color-primary)]">
                  {month}
                </span>
                <span className="text-base font-bold leading-none text-[var(--color-primary)]">{day}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-primary)]">{label}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">{sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── main component ───────────────────────────────────────────────────────────

export type CourseWorkspacePageProps = {
  course: CatalogCourse;
  progress: CourseProgressDetails;
  resources: CampusResourceItem[];
};

export function CourseWorkspacePage({
  course,
  progress,
  resources,
}: CourseWorkspacePageProps) {
  const modules = progress.modules;
  const inProgressIndex = Math.max(
    0,
    modules.findIndex((m) => !m.isCompleted),
  );

  return (
    <div className="p-5 lg:p-7">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_268px] xl:items-start">
        {/* ── Left column ─────────────────────────────── */}
        <div className="space-y-5">
          {/* Hero card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success-soft)] bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                    En curso
                  </span>
                  {course.activeEdition?.label && (
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {course.activeEdition.label}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-[1.7rem] font-bold leading-tight tracking-tight text-[var(--color-primary)] lg:text-[2rem]">
                  {course.title}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {course.shortDescription}
                </p>
              </div>

              <div className="w-full sm:w-auto">
                <ProgressCard
                  courseSlug={course.slug}
                  inProgressIndex={inProgressIndex}
                  inProgressTitle={
                    modules[inProgressIndex]?.title ?? course.title
                  }
                  progress={progress}
                />
              </div>
            </div>
          </div>

          {/* About this course */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 lg:p-7">
            <h2 className="text-lg font-bold text-[var(--color-primary)]">
              Acerca de este curso
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <p>{course.description}</p>
            </div>

            {course.outcomes.length > 0 && (
              <>
                <div className="my-5 border-t border-[var(--color-border-subtle)]" />
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                  Lo que aprenderás
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {course.outcomes.map((outcome) => (
                    <div className="flex items-start gap-2.5" key={outcome}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                      <span className="text-sm text-[var(--color-primary)]">{outcome}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Course content */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-[var(--color-primary)]">
              Contenido del Curso
            </h2>
            <div className="space-y-3">
              {modules.map((module, index) => {
                const status = getModuleStatus(modules, index);
                const moduleResources = resources.filter(
                  (r) => r.moduleId === module.id && r.isPublished,
                );

                return (
                  <ModuleCard
                    courseSlug={course.slug}
                    defaultOpen={status === "in-progress"}
                    key={module.id}
                    module={module}
                    moduleIndex={index}
                    moduleResources={moduleResources}
                    status={status}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right sidebar ────────────────────────────── */}
        <div className="space-y-4 xl:sticky xl:top-5">
          <InstructorCard course={course} />
          <DatesCard course={course} />
        </div>
      </div>
    </div>
  );
}
