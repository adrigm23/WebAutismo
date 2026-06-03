"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlayCircle,
  FileText,
  Download,
  MessageSquare,
  StickyNote,
  BookOpen,
  FileImage,
  File,
  PanelRightOpen,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CourseProgressDetails, CourseModuleProgressState } from "@/lib/course-progress";
import type { CampusResourceItem } from "@/lib/course-resources";
import { CourseProgressToggleForm } from "@/components/learning/course-progress-toggle-form";
import { LessonOutline } from "./lesson-outline";

type ActiveTab = "recursos" | "notas" | "comentarios";

export type LessonPlayerProps = {
  course: CatalogCourse;
  moduleIndex: number;
  progress: CourseProgressDetails;
  resources: CampusResourceItem[];
  viewerName: string;
  roleLabel: string;
};

// ─── helpers ────────────────────────────────────────────────────────────────

type ContentEmbed =
  | { kind: "embed"; src: string }
  | { kind: "video"; src: string }
  | { kind: "pdf"; src: string }
  | { kind: "image"; src: string };

function getContentEmbed(resource: CampusResourceItem): ContentEmbed | null {
  if (resource.linkUrl) {
    try {
      const url = new URL(resource.linkUrl);
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.replace(/\//g, "");
        if (id) return { kind: "embed", src: `https://www.youtube.com/embed/${id}` };
      }
      if (url.hostname.includes("youtube.com")) {
        const id = url.searchParams.get("v");
        if (id) return { kind: "embed", src: `https://www.youtube.com/embed/${id}` };
      }
      if (url.hostname.includes("vimeo.com")) {
        const match = url.pathname.match(/\/(\d+)/);
        if (match?.[1])
          return { kind: "embed", src: `https://player.vimeo.com/video/${match[1]}` };
      }
    } catch {
      // ignore malformed URLs
    }
  }

  if (resource.source === "FILE" && resource.href && resource.mimeType) {
    if (resource.mimeType.startsWith("video/")) {
      return { kind: "video", src: resource.href };
    }
    const inline = `${resource.href}${resource.href.includes("?") ? "&" : "?"}inline=1`;
    if (resource.mimeType === "application/pdf") {
      return { kind: "pdf", src: inline };
    }
    if (resource.mimeType.startsWith("image/")) {
      return { kind: "image", src: inline };
    }
  }

  return null;
}

function getPrimaryResource(
  module: CourseModuleProgressState,
  resources: CampusResourceItem[],
): CampusResourceItem | null {
  const moduleResources = resources.filter(
    (r) => r.moduleId === module.id && r.isPublished && !r.isExercise,
  );

  const videoFirst = moduleResources.find((r) => {
    if (r.source === "FILE" && r.mimeType?.startsWith("video/")) return true;
    if (
      r.linkUrl &&
      (r.linkUrl.includes("youtube.com") ||
        r.linkUrl.includes("youtu.be") ||
        r.linkUrl.includes("vimeo.com"))
    )
      return true;
    return false;
  });

  return videoFirst ?? moduleResources[0] ?? null;
}

function getDownloadableFiles(
  module: CourseModuleProgressState,
  resources: CampusResourceItem[],
  primaryId: string | null,
): CampusResourceItem[] {
  return resources.filter(
    (r) =>
      r.moduleId === module.id &&
      r.isPublished &&
      r.source === "FILE" &&
      r.id !== primaryId,
  );
}

function getFileTypeLabel(mimeType: string | null): string {
  if (!mimeType) return "Archivo";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOCX";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLSX";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPTX";
  if (mimeType.startsWith("image/")) return "Imagen";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  return "Archivo";
}

function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith("image/")) return <FileImage className="h-5 w-5" />;
  if (mimeType?.startsWith("video/")) return <PlayCircle className="h-5 w-5" />;
  if (mimeType === "application/pdf") return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function getLessonTypeLabel(resource: CampusResourceItem | null): string {
  if (!resource) return "Módulo";
  if (resource.mimeType?.startsWith("video/")) return "Video";
  if (
    resource.linkUrl &&
    (resource.linkUrl.includes("youtube") || resource.linkUrl.includes("vimeo"))
  )
    return "Video";
  if (resource.mimeType === "application/pdf") return "PDF";
  return resource.resourceTypeLabel ?? "Material";
}

// ─── sub-components ─────────────────────────────────────────────────────────

function PdfViewerCard({
  resource,
}: {
  resource: CampusResourceItem;
}) {
  const inlineSrc = resource.href
    ? `${resource.href}${resource.href.includes("?") ? "&" : "?"}inline=1`
    : null;

  if (!inlineSrc) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-[#e74c3c]" />
          <span className="truncate text-[0.73rem] font-medium text-[#374151]">
            {resource.title}
          </span>
        </div>
        {resource.href && (
          <a
            className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#9ca3af] transition hover:bg-[#e5e7eb] hover:text-[#374151]"
            download
            href={resource.href}
            title="Descargar"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {/* PDF iframe — tall */}
      <div className="bg-[#f0f2f5]" style={{ height: "68vh", minHeight: "520px" }}>
        <iframe
          className="h-full w-full"
          src={inlineSrc}
          title={resource.title}
        />
      </div>
    </div>
  );
}

function VideoArea({ resource }: { resource: CampusResourceItem | null }) {
  const embed = resource ? getContentEmbed(resource) : null;

  if (!embed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-[#0f1420]">
        <div className="text-center">
          <PlayCircle className="mx-auto h-14 w-14 text-white/20" />
          <p className="mt-3 text-sm text-white/30">
            {resource
              ? "Vista previa no disponible para este formato"
              : "No hay video disponible para este módulo"}
          </p>
        </div>
      </div>
    );
  }

  if (embed.kind === "embed") {
    return (
      <div className="aspect-video w-full bg-[#0f1420]">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
          src={embed.src}
          title={resource?.title ?? "Lección"}
        />
      </div>
    );
  }

  if (embed.kind === "video") {
    return (
      <div className="aspect-video w-full bg-[#0f1420]">
        <video
          className="h-full w-full"
          controls
          preload="metadata"
          src={embed.src}
        />
      </div>
    );
  }

  if (embed.kind === "pdf") {
    return (
      <div className="aspect-video w-full bg-[#f7f9fb]">
        <iframe
          className="h-full w-full"
          src={embed.src}
          title={resource?.title ?? "Documento"}
        />
      </div>
    );
  }

  if (embed.kind === "image") {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-[#0f1420]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={resource?.title ?? "Imagen"}
          className="h-full w-full object-contain"
          src={embed.src}
        />
      </div>
    );
  }

  return null;
}

function ResourcesTab({
  downloadableFiles,
  courseSlug,
  module,
}: {
  downloadableFiles: CampusResourceItem[];
  courseSlug: string;
  module: CourseModuleProgressState;
}) {
  if (downloadableFiles.length === 0) {
    return (
      <div className="py-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-[var(--color-muted)]/40" />
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          No hay archivos descargables para este módulo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-[var(--color-ink)]">
        Archivos descargables
      </p>
      <div className="space-y-3">
        {downloadableFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3.5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)]">
              <FileTypeIcon mimeType={file.mimeType} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {file.title}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {getFileTypeLabel(file.mimeType)}
              </p>
            </div>
            {file.href && (
              <a
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                download
                href={file.href}
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab({
  storageKey,
}: {
  storageKey: string;
}) {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setNotes(saved);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(storageKey, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      // ignore
    }
  }, [storageKey, notes]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted)]">
        Tus notas se guardan localmente en este dispositivo.
      </p>
      <textarea
        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Escribe tus notas sobre esta lección..."
        rows={8}
        value={notes}
      />
      <button
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
          saved
            ? "bg-emerald-500 text-white"
            : "bg-[var(--color-primary)] text-white hover:opacity-90",
        )}
        onClick={handleSave}
        type="button"
      >
        {saved ? (
          <>
            <CheckCheck className="h-4 w-4" /> Guardado
          </>
        ) : (
          "Guardar notas"
        )}
      </button>
    </div>
  );
}

function CommentsTab({ courseSlug }: { courseSlug: string }) {
  return (
    <div className="py-8 text-center">
      <MessageSquare className="mx-auto h-8 w-8 text-[var(--color-muted)]/40" />
      <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
        Foro de la comunidad
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Participa en el foro del curso para hacer preguntas y discutir con otros alumnos.
      </p>
      <Link
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
        href={`/mis-cursos/${courseSlug}/foro`}
      >
        <MessageSquare className="h-4 w-4" />
        Ir al foro
      </Link>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function LessonPlayer({
  course,
  moduleIndex,
  progress,
  resources,
  viewerName,
  roleLabel,
}: LessonPlayerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("recursos");

  const modules = progress.modules;
  const currentModule = modules[moduleIndex];
  const prevIndex = moduleIndex > 0 ? moduleIndex - 1 : null;
  const nextIndex = moduleIndex < modules.length - 1 ? moduleIndex + 1 : null;

  const primaryResource = currentModule ? getPrimaryResource(currentModule, resources) : null;
  const isPdfLesson =
    primaryResource?.source === "FILE" &&
    primaryResource?.mimeType === "application/pdf";
  const downloadableFiles = currentModule
    ? getDownloadableFiles(currentModule, resources, primaryResource?.id ?? null)
    : [];

  const lessonType = getLessonTypeLabel(primaryResource);
  const notesKey = `cam_notes_${course.slug}_${moduleIndex}`;

  const prevHref = prevIndex !== null ? `/mis-cursos/${course.slug}/leccion/${prevIndex}` : null;
  const nextHref = nextIndex !== null ? `/mis-cursos/${course.slug}/leccion/${nextIndex}` : null;

  if (!currentModule) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--color-muted)]">Módulo no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      {/* ── Top header bar ─────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-4 lg:px-6">
        {/* Left: back + breadcrumb */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Volver al campus"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            href={`/mis-cursos/${course.slug}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <span className="truncate text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {course.title}
            </span>
            <span className="text-[var(--color-border)]">·</span>
            <span className="truncate text-sm font-medium text-[var(--color-ink)]">
              Módulo {moduleIndex + 1}: {currentModule.title}
            </span>
          </div>
          <span className="truncate text-sm font-semibold text-[var(--color-ink)] lg:hidden">
            {currentModule.title}
          </span>
        </div>

        {/* Right: progress + sidebar toggle */}
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-xs text-[var(--color-muted)]">Progreso del curso</span>
            <span className="text-xs font-bold text-emerald-600">
              {Math.round(progress.completionRate)}% Completado
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progress.completionRate}%` }}
              />
            </div>
          </div>

          {!sidebarOpen && (
            <button
              className="flex h-8 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Temario</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left: scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          {/* PDF lesson — title ABOVE viewer (Stitch design) */}
          {isPdfLesson ? (
            <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 lg:px-8">
              {/* Time badge */}
              <div className="mb-3 flex items-center gap-1.5 text-sm text-[#6b7280]">
                <Clock className="h-3.5 w-3.5" />
                <span>Tiempo estimado: {currentModule.estimatedTime} de lectura</span>
              </div>

              {/* Title */}
              <h1 className="mb-4 text-[1.75rem] font-bold leading-tight text-[#111c2c]">
                {currentModule.title}
              </h1>

              {/* Description — highlighted like Stitch */}
              {currentModule.description && (
                <p className="mb-6 rounded-lg border-l-4 border-[#3b82f6] bg-[#eff6ff] px-4 py-3 text-[1rem] leading-relaxed text-[#374151]">
                  {currentModule.description}
                </p>
              )}

              {/* PDF viewer */}
              <PdfViewerCard resource={primaryResource} />

              {/* Recursos descargables inline */}
              {downloadableFiles.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-widest text-[#9ca3af]">
                    <FileText className="h-3.5 w-3.5" />
                    Recursos Descargables
                  </p>
                  <div className="space-y-2">
                    {downloadableFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fef2f2] text-[#e74c3c]">
                          <FileTypeIcon mimeType={file.mimeType} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#111c2c]">
                            {file.title}
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            {getFileTypeLabel(file.mimeType)}
                            {file.sizeInBytes
                              ? ` · ${file.sizeInBytes < 1024 * 1024
                                  ? `${(file.sizeInBytes / 1024).toFixed(1)} KB`
                                  : `${(file.sizeInBytes / (1024 * 1024)).toFixed(1)} MB`}`
                              : ""}
                          </p>
                        </div>
                        {file.href && (
                          <a
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition hover:border-[#3b82f6] hover:text-[#3b82f6]"
                            download
                            href={file.href}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom navigation — Anterior | Marcar como completado | Siguiente */}
              <div className="mt-8 flex items-center justify-between border-t border-[#e5e7eb] pt-5">
                {prevHref ? (
                  <Link
                    className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] shadow-sm transition hover:border-[#3b82f6] hover:text-[#3b82f6]"
                    href={prevHref}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Link>
                ) : (
                  <div />
                )}

                <CourseProgressToggleForm
                  courseSlug={course.slug}
                  isCompleted={currentModule.isCompleted}
                  moduleId={currentModule.id}
                  nextPath={nextHref ?? `/mis-cursos/${course.slug}/leccion/${moduleIndex}`}
                />

                {nextHref ? (
                  <Link
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    href={nextHref}
                  >
                    Siguiente Lección
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    href={`/mis-cursos/${course.slug}`}
                  >
                    Finalizar curso
                    <CheckCheck className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* Tabs — Notas y Comentarios still available for PDFs */}
              <div className="mt-8">
                <div className="flex gap-6 border-b border-[var(--color-border)]">
                  {(
                    [
                      { id: "notas", label: "Notas Personales", icon: StickyNote },
                      { id: "comentarios", label: "Comentarios", icon: MessageSquare },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      className={cn(
                        "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition",
                        activeTab === id
                          ? "border-[var(--color-primary)] text-[var(--color-ink)]"
                          : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]",
                      )}
                      key={id}
                      onClick={() => setActiveTab(id as ActiveTab)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="pt-6">
                  {activeTab === "notas" && <NotesTab storageKey={notesKey} />}
                  {activeTab === "comentarios" && <CommentsTab courseSlug={course.slug} />}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Non-PDF: original layout — VideoArea top + title below */}
              <VideoArea resource={primaryResource} />
              <div className="mx-auto max-w-3xl px-5 pb-16 pt-6 lg:px-8">
                {/* Lesson title + meta */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold leading-snug text-[var(--color-ink)]">
                      {currentModule.title}
                    </h1>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[var(--color-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {currentModule.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <PlayCircle className="h-3.5 w-3.5" />
                        {lessonType}
                      </span>
                    </div>
                  </div>

                  {/* Mark-as-complete form */}
                  <div className="shrink-0">
                    <CourseProgressToggleForm
                      courseSlug={course.slug}
                      isCompleted={currentModule.isCompleted}
                      moduleId={currentModule.id}
                      nextPath={
                        nextHref ??
                        `/mis-cursos/${course.slug}/leccion/${moduleIndex}`
                      }
                    />
                  </div>
                </div>

                {/* Module description */}
                {currentModule.description && (
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {currentModule.description}
                  </p>
                )}

                {/* Anterior / Siguiente navigation */}
                <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-5">
                  {prevHref ? (
                    <Link
                      className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      href={prevHref}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextHref ? (
                    <Link
                      className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                      href={nextHref}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                      href={`/mis-cursos/${course.slug}`}
                    >
                      Finalizar curso
                      <CheckCheck className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                {/* Tabs */}
                <div className="mt-8">
                  <div className="flex gap-6 border-b border-[var(--color-border)]">
                    {(
                      [
                        { id: "recursos", label: "Recursos", icon: BookOpen },
                        { id: "notas", label: "Notas Personales", icon: StickyNote },
                        {
                          id: "comentarios",
                          label: "Comentarios",
                          icon: MessageSquare,
                        },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        className={cn(
                          "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition",
                          activeTab === id
                            ? "border-[var(--color-primary)] text-[var(--color-ink)]"
                            : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]",
                        )}
                        key={id}
                        onClick={() => setActiveTab(id)}
                        type="button"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-6">
                    {activeTab === "recursos" && (
                      <ResourcesTab
                        courseSlug={course.slug}
                        downloadableFiles={downloadableFiles}
                        module={currentModule}
                      />
                    )}
                    {activeTab === "notas" && <NotesTab storageKey={notesKey} />}
                    {activeTab === "comentarios" && (
                      <CommentsTab courseSlug={course.slug} />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Right: course outline sidebar */}
        {sidebarOpen && (
          <LessonOutline
            course={course}
            currentModuleIndex={moduleIndex}
            onClose={() => setSidebarOpen(false)}
            progress={progress}
          />
        )}
      </div>
    </div>
  );
}
