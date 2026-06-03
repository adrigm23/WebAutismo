"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Award,
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

function formatMonthDay(date: Date): { month: string; day: string } {
  const month = date.toLocaleString("es-ES", { month: "short" }).toUpperCase();
  const day = String(date.getDate());
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
    <div className="min-w-[220px] rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#6b7280]">Progreso del curso</span>
        <span className="text-xl font-bold text-[#1a1f2e]">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#1a1f2e] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
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
        "overflow-hidden rounded-2xl border transition",
        status === "in-progress"
          ? "border-emerald-300 bg-white shadow-sm"
          : status === "completed"
            ? "border-[#e5e7eb] bg-white"
            : "border-[#e5e7eb] bg-[#f9fafb]",
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
        )}
        {status === "in-progress" && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50">
            <PlayCircle className="h-5 w-5 text-emerald-600" />
          </span>
        )}
        {status === "upcoming" && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#e5e7eb] bg-white text-xs font-bold text-[#9ba3af]">
            {moduleIndex + 1}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              status === "upcoming" ? "text-[#6b7280]" : "text-[#1a1f2e]",
            )}
          >
            Módulo {moduleIndex + 1}: {module.title}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              status === "in-progress"
                ? "font-medium text-emerald-600"
                : "text-[#9ba3af]",
            )}
          >
            {status === "completed" && `${lessonLabel} · ${module.estimatedTime}`}
            {status === "in-progress" && `En curso · ${module.estimatedTime}`}
            {status === "upcoming" && `${lessonLabel} · ${module.estimatedTime}`}
          </p>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#9ba3af] transition-transform",
            open && "-rotate-180",
          )}
        />
      </button>

      {/* Lesson items — always accessible */}
      {open && (
        <div className="divide-y divide-[#f0f0f0] border-t border-[#f0f0f0] px-4">
          {moduleResources.length > 0 ? (
            moduleResources.map((resource, rIdx) => {
              const LessonIcon = getLessonIcon(resource);
              const isCurrent = status === "in-progress" && rIdx === 0;
              const isLessonCompleted = status === "completed";

              // Determine href: exercises → submission page, others → resource href
              const itemHref = resource.href ?? (status !== "upcoming" ? continueHref : null);
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
                    isCurrent && "rounded-lg bg-emerald-50/50",
                  )}
                  key={resource.id}
                >
                  {isLessonCompleted ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <LessonIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isCurrent ? "text-emerald-600" : "text-[#9ba3af]",
                      )}
                    />
                  )}

                  {/* Title — always a link if href exists */}
                  {itemHref ? (
                    <Link
                      className={cn(
                        "flex-1 text-sm leading-snug transition hover:text-[#022448]",
                        isCurrent
                          ? "font-semibold text-emerald-700"
                          : isLessonCompleted
                            ? "text-[#6b7280]"
                            : "text-[#6b7280]",
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
                          ? "font-semibold text-emerald-700"
                          : "text-[#6b7280]",
                      )}
                    >
                      {resource.title}
                    </span>
                  )}

                  {isCurrent ? (
                    <Link
                      className="shrink-0 rounded-full bg-[#1a1f2e] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                      href={continueHref}
                    >
                      Continuar
                    </Link>
                  ) : (
                    <span className="shrink-0 text-xs text-[#9ba3af]">
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
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <PlayCircle
                    className={cn(
                      "h-4 w-4 shrink-0",
                      status === "in-progress"
                        ? "text-emerald-600"
                        : "text-[#9ba3af]",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm",
                    status === "in-progress"
                      ? "font-semibold text-emerald-700"
                      : "text-[#6b7280]",
                  )}
                >
                  {module.title}
                </span>
                {status === "in-progress" ? (
                  <Link
                    className="shrink-0 rounded-full bg-[#1a1f2e] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                    href={continueHref}
                  >
                    Continuar
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-[#9ba3af]">
                    {module.estimatedTime}
                  </span>
                )}
              </div>
              {module.resourcesSummary && (
                <div className="flex items-center gap-3 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-[#9ba3af]" />
                  <span className="flex-1 text-sm text-[#6b7280]">
                    {module.resourcesSummary}
                  </span>
                  <span className="shrink-0 text-xs text-[#9ba3af]">PDF</span>
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
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
        Instructora del Curso
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),rgba(217,232,251,0.92))] text-base font-bold text-[var(--color-primary)]">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#1a1f2e]">{teacher.name}</p>
          <p className="text-xs text-[#6b7280]">{teacher.role}</p>
        </div>
      </div>
      {teacher.bio && (
        <p className="mt-3 text-xs leading-relaxed text-[#6b7280]">{teacher.bio}</p>
      )}
    </div>
  );
}

function MaterialsCard({ resources }: { resources: CampusResourceItem[] }) {
  const materials = resources
    .filter(
      (r) =>
        r.source === "FILE" && r.isPublished && !r.isExercise && r.moduleId === null,
    )
    .slice(0, 5);

  if (materials.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
        Materiales Incluidos
      </p>
      <div className="mt-3 space-y-3">
        {materials.map((m) => {
          const Icon = getFileIcon(m.mimeType, m.resourceType as string);
          return (
            <a
              className="flex items-center gap-3 transition hover:opacity-75"
              href={m.href ?? "#"}
              key={m.id}
              rel="noreferrer"
              target="_blank"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6b7280]">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-[#1a1f2e]">{m.title}</span>
            </a>
          );
        })}
      </div>
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
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
        Fechas Importantes
      </p>
      <div className="mt-3 space-y-3">
        {dates.map(({ date, label, sublabel }) => {
          const { month, day } = formatMonthDay(date);
          return (
            <div className="flex items-start gap-3" key={label}>
              <div className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-[#e5e7eb] py-1 text-center">
                <span className="text-[0.55rem] font-bold uppercase text-[var(--color-primary)]">
                  {month}
                </span>
                <span className="text-base font-bold leading-none text-[#1a1f2e]">{day}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a1f2e]">{label}</p>
                <p className="text-xs text-[#9ba3af]">{sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CertificateCard({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <p className="text-center text-sm font-bold text-[#1a1f2e]">
        Certificado Oficial
      </p>
      <p className="mt-2 text-center text-xs leading-relaxed text-[#6b7280]">
        {isCompleted
          ? "¡Felicitaciones! Tu certificado está listo para descargar."
          : "Al completar el 100% de los módulos y aprobar la evaluación final, obtendrás un certificado avalado por Campus Autismo."}
      </p>

      {/* Certificate mockup */}
      <div className="mt-4 flex h-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#d1d5db] bg-[#f9fafb]">
        <p
          className="select-none text-[1.8rem] font-black tracking-[0.28em] text-[#d1d5db]"
          style={{ transform: "rotate(-12deg)" }}
        >
          CERT.
        </p>
      </div>

      {isCompleted && (
        <Link
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          href="/mi-cuenta"
        >
          <Award className="h-4 w-4" />
          Ver certificado
        </Link>
      )}
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
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    En curso
                  </span>
                  {course.activeEdition?.label && (
                    <span className="text-xs text-[#9ba3af]">
                      {course.activeEdition.label}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-[1.7rem] font-bold leading-tight tracking-tight text-[#1a1f2e] lg:text-[2rem]">
                  {course.title}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
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
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 lg:p-7">
            <h2 className="text-lg font-bold text-[#1a1f2e]">
              Acerca de este curso
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#6b7280]">
              <p>{course.description}</p>
            </div>

            {course.outcomes.length > 0 && (
              <>
                <div className="my-5 border-t border-[#f0f0f0]" />
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9ba3af]">
                  Lo que aprenderás
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {course.outcomes.map((outcome) => (
                    <div className="flex items-start gap-2.5" key={outcome}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm text-[#1a1f2e]">{outcome}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Course content */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#1a1f2e]">
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
          <MaterialsCard resources={resources} />
          <DatesCard course={course} />
          <CertificateCard isCompleted={progress.isCompleted} />
        </div>
      </div>
    </div>
  );
}
