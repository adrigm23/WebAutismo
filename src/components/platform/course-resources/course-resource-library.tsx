"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Info,
  Link2,
  Play,
  Plus,
  Video,
} from "lucide-react";
import type { CourseRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";

// ─── types ───────────────────────────────────────────────────────────────────

type Filter = "all" | "pdf" | "video" | "template";

type ResourceKind = "pdf" | "video" | "template" | "external" | "exercise" | "info" | "other";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getResourceKind(r: CampusResourceItem): ResourceKind {
  if (r.resourceType === "INFO") return "info";
  if (r.isExternal) return "external";
  if (r.isExercise) return "exercise";
  const m = r.mimeType ?? "";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("video/")) return "video";
  if (
    m.includes("word") ||
    m.includes("presentation") ||
    m.includes("spreadsheet") ||
    m.includes("officedocument") ||
    m.includes("opendocument")
  )
    return "template";
  return "other";
}

function matchesFilter(r: CampusResourceItem, filter: Filter): boolean {
  if (!r.isManaged) return false;
  if (filter === "all") return true;
  const kind = getResourceKind(r);
  if (filter === "pdf") return kind === "pdf";
  if (filter === "video") return kind === "video";
  if (filter === "template") return kind === "template" || kind === "other" || kind === "exercise";
  return true;
}

function formatBytes(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDueDate(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatRelativeTime(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Hace menos de 1 hora";
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? "día" : "días"}`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// ─── resource card icon ───────────────────────────────────────────────────────

function ResourceKindIcon({ kind, className }: { kind: ResourceKind; className?: string }) {
  const configs: Record<ResourceKind, { icon: React.ElementType; bg: string; color: string }> = {
    pdf: { icon: FileText, bg: "bg-blue-50", color: "text-blue-600" },
    video: { icon: Video, bg: "bg-emerald-50", color: "text-emerald-600" },
    template: { icon: FileText, bg: "bg-sky-50", color: "text-sky-600" },
    external: { icon: Link2, bg: "bg-orange-50", color: "text-orange-500" },
    exercise: { icon: ClipboardList, bg: "bg-purple-50", color: "text-purple-600" },
    info: { icon: Info, bg: "bg-gray-50", color: "text-gray-500" },
    other: { icon: BookOpen, bg: "bg-gray-50", color: "text-gray-500" },
  };

  const { icon: Icon, bg, color } = configs[kind];

  return (
    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", bg, className)}>
      <Icon className={cn("h-6 w-6", color)} />
    </div>
  );
}

function getTypeLabel(kind: ResourceKind, mimeType: string | null): string {
  if (kind === "pdf") return "PDF Document";
  if (kind === "video") return "Video Tutorial";
  if (kind === "external") return "Recurso Externo";
  if (kind === "exercise") return "Ejercicio";
  if (kind === "info") return "Información";
  if (mimeType?.includes("word") || mimeType?.includes("docx")) return "Plantilla DOCX";
  if (mimeType?.includes("presentation") || mimeType?.includes("pptx")) return "Presentación";
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("xlsx")) return "Hoja de Cálculo";
  return "Material";
}

// ─── resource card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  canModerate,
}: {
  resource: CampusResourceItem;
  canModerate: boolean;
}) {
  const kind = getResourceKind(resource);
  const sizeLabel = formatBytes(resource.sizeInBytes);
  const dueLabel = formatDueDate(resource.dueAt);

  const ActionIcon = resource.isExternal ? ArrowUpRight : kind === "video" ? Play : Download;
  const isUnpublished = !resource.isPublished;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-white p-5 transition hover:shadow-md",
        isUnpublished
          ? "border-dashed border-[#e2e8f0] opacity-60"
          : "border-[#eaecf0] hover:border-[#d0d5dd]",
      )}
    >
      {/* Unpublished badge */}
      {isUnpublished && canModerate && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700">
          Oculto
        </span>
      )}

      {/* Action icon — top right */}
      {!isUnpublished && resource.href && (
        <a
          aria-label="Abrir recurso"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] opacity-0 transition hover:bg-[#f3f4f6] hover:text-[#1a1f2e] group-hover:opacity-100"
          href={resource.href}
          rel={resource.isExternal ? "noopener noreferrer" : undefined}
          target={resource.isExternal ? "_blank" : undefined}
        >
          <ActionIcon className="h-4 w-4" />
        </a>
      )}

      {/* Icon */}
      <ResourceKindIcon kind={kind} />

      {/* Type label */}
      <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-widest text-[#9ba3af]">
        {getTypeLabel(kind, resource.mimeType)}
      </p>

      {/* Title */}
      <h3 className="mt-1 text-sm font-semibold leading-snug text-[#1a1f2e] line-clamp-2">
        {resource.href ? (
          <a
            className="transition hover:text-[var(--color-primary)]"
            href={resource.href}
            rel={resource.isExternal ? "noopener noreferrer" : undefined}
            target={resource.isExternal ? "_blank" : undefined}
          >
            {resource.title}
          </a>
        ) : (
          resource.title
        )}
      </h3>

      {/* Metadata row */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9ba3af]">
        {sizeLabel && (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {sizeLabel}
          </span>
        )}
        {kind === "external" && (
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Sitio Web
          </span>
        )}
        {kind === "video" && (
          <span className="flex items-center gap-1">
            <Video className="h-3 w-3" />
            Vídeo
          </span>
        )}
        {resource.isExercise && dueLabel && (
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              resource.isSubmissionClosed ? "text-red-400" : "text-amber-500",
            )}
          >
            Límite: {dueLabel}
          </span>
        )}
        {resource.isExercise && resource.viewerSubmission && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">
            {resource.viewerSubmission.statusLabel}
          </span>
        )}
        {resource.moduleTitle && (
          <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[0.65rem] text-[#6b7280]">
            {resource.moduleTitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── tasks sidebar card ───────────────────────────────────────────────────────

function TasksCard({ resources, courseSlug }: { resources: CampusResourceItem[]; courseSlug: string }) {
  const tasks = resources.filter((r) => r.isExercise && r.isManaged);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-[#eaecf0] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1a1f2e]">Tareas y Entregas</h2>
        </div>
        <p className="mt-3 text-xs text-[#9ba3af]">No hay tareas asignadas en este momento.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#eaecf0] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1a1f2e]">Tareas y Entregas</h2>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.slice(0, 5).map((task) => {
          const dueLabel = formatDueDate(task.dueAt);
          const submission = task.viewerSubmission;

          return (
            <div key={task.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  submission
                    ? "bg-emerald-50 text-emerald-600"
                    : task.isSubmissionClosed
                      ? "bg-red-50 text-red-500"
                      : "bg-amber-50 text-amber-600",
                )}
              >
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[#1a1f2e]">{task.title}</p>
                {submission ? (
                  <p className="mt-0.5 text-[0.65rem] text-emerald-600">
                    Estado: {submission.statusLabel}
                    {submission.scoreLabel ? ` · Nota: ${submission.scoreLabel}` : ""}
                  </p>
                ) : dueLabel ? (
                  <p
                    className={cn(
                      "mt-0.5 text-[0.65rem] font-medium",
                      task.isSubmissionClosed ? "text-red-500" : "text-amber-600",
                    )}
                  >
                    Límite: {dueLabel}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length > 5 && (
        <Link
          className="mt-4 block text-center text-xs font-medium text-[var(--color-primary)] hover:underline"
          href={`/mis-cursos/${courseSlug}`}
        >
          Ver todas las tareas
        </Link>
      )}
    </div>
  );
}

// ─── activity sidebar card ────────────────────────────────────────────────────

function ActivityCard({ resources }: { resources: CampusResourceItem[] }) {
  const activityItems: Array<{ id: string; label: string; timeAgo: string | null; dotColor: string }> = [];

  // Recently added managed resources
  const recent = [...resources]
    .filter((r) => r.isManaged && r.createdAt)
    .sort((a, b) => {
      const ta = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : (a.createdAt?.getTime() ?? 0);
      const tb = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : (b.createdAt?.getTime() ?? 0);
      return tb - ta;
    })
    .slice(0, 3);

  for (const r of recent) {
    activityItems.push({
      id: `added-${r.id}`,
      label: `Se ha añadido: ${r.title}`,
      timeAgo: formatRelativeTime(r.createdAt),
      dotColor: "bg-emerald-500",
    });
  }

  // Reviewed submissions
  for (const r of resources) {
    if (r.viewerSubmission?.reviewedAt && r.viewerSubmission.scoreLabel) {
      activityItems.push({
        id: `reviewed-${r.viewerSubmission.id}`,
        label: `Tu tarea "${r.title}" ha sido calificada.`,
        timeAgo: formatRelativeTime(r.viewerSubmission.reviewedAt),
        dotColor: "bg-blue-500",
      });
    }
  }

  if (activityItems.length === 0) {
    return (
      <div className="rounded-xl border border-[#eaecf0] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#1a1f2e]">Actividad Reciente</h2>
        <p className="mt-3 text-xs text-[#9ba3af]">Sin actividad reciente.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#eaecf0] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#1a1f2e]">Actividad Reciente</h2>

      <div className="mt-4 space-y-4">
        {activityItems.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="relative mt-1 flex shrink-0 flex-col items-center">
              <div className={cn("h-2 w-2 rounded-full", item.dotColor)} />
            </div>
            <div className="min-w-0">
              {item.timeAgo && (
                <p className="text-[0.65rem] text-[#9ba3af]">{item.timeAgo}</p>
              )}
              <p className="mt-0.5 text-xs text-[#374151] leading-snug">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type CourseResourceLibraryProps = {
  course: CatalogCourse;
  resources: CampusResourceItem[];
  canModerate: boolean;
  role: CourseRole;
};

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "pdf", label: "Documentos (PDF)" },
  { id: "video", label: "Vídeos" },
  { id: "template", label: "Plantillas" },
];

export function CourseResourceLibrary({
  course,
  resources,
  canModerate,
}: CourseResourceLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const managedResources = resources.filter((r) => r.isManaged);
  const materialCount = managedResources.filter((r) => !r.isExercise).length;
  const videoCount = managedResources.filter((r) => getResourceKind(r) === "video").length;
  const exerciseCount = managedResources.filter((r) => r.isExercise).length;

  const visibleResources = managedResources.filter((r) => matchesFilter(r, activeFilter));

  return (
    <div className="min-h-full bg-[#f4f5f7]">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-[#9ba3af]">
          <Link
            className="transition hover:text-[var(--color-primary)]"
            href={`/mis-cursos/${course.slug}`}
          >
            {course.title}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#374151]">Biblioteca</span>
        </nav>

        {/* Hero card */}
        <div className="mb-6 overflow-hidden rounded-xl border border-[#eaecf0] bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Badge */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--color-brand-soft,#eef2ff)] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-primary,#4f46e5)]">
                  Curso
                </span>
                <span className="text-xs text-[#9ba3af]">{course.title}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1a1f2e] sm:text-[1.75rem]">
                Biblioteca de Recursos
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
                Materiales complementarios, guías y plantillas curadas para facilitar la
                implementación en el aula.
              </p>
            </div>

            {/* Metrics */}
            <div className="flex shrink-0 items-center divide-x divide-[#eaecf0] rounded-xl border border-[#eaecf0] bg-[#f8fafc]">
              <div className="flex flex-col items-center px-5 py-3">
                <span className="text-xl font-bold text-[#1a1f2e]">{materialCount}</span>
                <span className="mt-0.5 text-[0.65rem] font-medium text-[#9ba3af]">Materiales</span>
              </div>
              <div className="flex flex-col items-center px-5 py-3">
                <span className="text-xl font-bold text-[#1a1f2e]">{videoCount}</span>
                <span className="mt-0.5 text-[0.65rem] font-medium text-[#9ba3af]">Vídeos</span>
              </div>
              <div className="flex flex-col items-center px-5 py-3">
                <span className="text-xl font-bold text-[#1a1f2e]">{exerciseCount}</span>
                <span className="mt-0.5 text-[0.65rem] font-medium text-[#9ba3af]">Ejercicios</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + publish button */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                type="button"
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition",
                  activeFilter === f.id
                    ? "bg-[#1a1f2e] text-white"
                    : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d0d5dd] hover:text-[#1a1f2e]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Publish button — only for teachers/admins */}
          {canModerate && (
            <Link
              href={`/mis-cursos/${course.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1a1f2e] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#2d3748]"
            >
              <Plus className="h-4 w-4" />
              Publicar recurso
            </Link>
          )}
        </div>

        {/* Main layout: grid + sidebar */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

          {/* Resource grid */}
          <div className="min-w-0 flex-1">
            {visibleResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-[#d1d5db]" />
                <p className="text-sm font-medium text-[#6b7280]">
                  No hay recursos en esta categoría todavía.
                </p>
                {canModerate && (
                  <Link
                    href={`/mis-cursos/${course.slug}`}
                    className="mt-4 flex items-center gap-1.5 rounded-full bg-[#1a1f2e] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#2d3748]"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir recurso
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {visibleResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    canModerate={canModerate}
                    resource={resource}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="w-full space-y-4 lg:w-72 xl:w-80">
            <TasksCard courseSlug={course.slug} resources={resources} />
            <ActivityCard resources={resources} />
          </aside>
        </div>
      </div>
    </div>
  );
}
