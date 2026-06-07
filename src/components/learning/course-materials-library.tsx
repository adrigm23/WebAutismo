"use client";

import { useState, useDeferredValue } from "react";
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Film,
  Image,
  Link2,
  Presentation,
  Search,
  BookOpen,
} from "lucide-react";
import type { CatalogCourse } from "@/lib/course-catalog";
import type { CampusResourceItem } from "@/lib/course-resources";
import { cn } from "@/lib/utils";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getMaterialIcon(resource: CampusResourceItem) {
  if (resource.isExternal) return Link2;
  const mime = resource.mimeType ?? "";
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("image/")) return Image;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv"))
    return FileSpreadsheet;
  if (mime.includes("presentation") || mime.includes("powerpoint"))
    return Presentation;
  return FileText;
}

function getMaterialTypeLabel(resource: CampusResourceItem) {
  if (resource.isExternal) return "Enlace";
  const mime = resource.mimeType ?? "";
  if (mime.startsWith("video/")) return "Vídeo";
  if (mime.startsWith("image/")) return "Imagen";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv"))
    return "Hoja de cálculo";
  if (mime.includes("presentation") || mime.includes("powerpoint"))
    return "Presentación";
  return "Documento";
}

const TYPE_COLORS: Record<string, string> = {
  Vídeo: "bg-purple-50 text-purple-700 border-purple-200",
  PDF: "bg-red-50 text-red-700 border-red-200",
  "Hoja de cálculo": "bg-green-50 text-green-700 border-green-200",
  Presentación: "bg-orange-50 text-orange-700 border-orange-200",
  Imagen: "bg-blue-50 text-blue-700 border-blue-200",
  Enlace: "bg-[var(--color-brand-soft)] text-[var(--color-primary)] border-[rgba(22,60,88,0.15)]",
  Documento: "bg-[rgba(22,60,88,0.05)] text-[var(--color-ink-soft)] border-[rgba(22,60,88,0.12)]",
};

// ─── MaterialCard ─────────────────────────────────────────────────────────────

function MaterialCard({ resource }: { resource: CampusResourceItem }) {
  const Icon = getMaterialIcon(resource);
  const typeLabel = getMaterialTypeLabel(resource);
  const typeColor = TYPE_COLORS[typeLabel] ?? TYPE_COLORS["Documento"];

  function handleOpen() {
    if (!resource.href) return;
    window.open(resource.href, resource.isExternal ? "_blank" : "_self", resource.isExternal ? "noopener,noreferrer" : undefined);
  }

  return (
    <div className="group flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[rgba(22,60,88,0.09)] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:border-[rgba(22,60,88,0.18)] hover:shadow-[var(--shadow-medium)]">
      {/* Icon + type badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] text-[var(--color-primary)]">
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold", typeColor)}>
          {typeLabel}
        </span>
      </div>

      {/* Title + description */}
      <div className="flex-1 space-y-1.5">
        <p className="font-semibold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">
          {resource.title}
        </p>
        {resource.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {resource.description}
          </p>
        ) : null}
      </div>

      {/* Action button */}
      {resource.href ? (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[rgba(22,60,88,0.12)] bg-[var(--color-bg-subtle)] py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:bg-white hover:text-[var(--color-primary)]"
          onClick={handleOpen}
          type="button"
        >
          {resource.isExternal ? (
            <>
              <ExternalLink className="h-4 w-4" />
              Abrir enlace
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Descargar
            </>
          )}
        </button>
      ) : (
        <div className="flex w-full items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[rgba(22,60,88,0.12)] py-2.5 text-sm text-[var(--color-muted)]">
          No disponible
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type CourseMaterialsLibraryProps = {
  course: CatalogCourse;
  resources: CampusResourceItem[];
};

export function CourseMaterialsLibrary({ course, resources }: CourseMaterialsLibraryProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  // Only content materials — no exercises
  const materials = resources.filter((r) => !r.isExercise && r.isPublished);

  // Apply search filter
  const filtered = deferredSearch
    ? materials.filter(
        (r) =>
          r.title.toLowerCase().includes(deferredSearch) ||
          r.description?.toLowerCase().includes(deferredSearch) ||
          r.moduleTitle?.toLowerCase().includes(deferredSearch),
      )
    : materials;

  // Group by module (preserve course module order)
  const moduleOrder = course.modules.map((m) => m.id);

  const groups: Array<{ key: string; title: string; items: CampusResourceItem[] }> = [];

  // Grouped by module
  for (const moduleId of moduleOrder) {
    const module = course.modules.find((m) => m.id === moduleId);
    if (!module) continue;
    const items = filtered.filter((r) => r.moduleId === moduleId);
    if (!items.length) continue;
    const moduleIndex = course.modules.findIndex((m) => m.id === moduleId);
    groups.push({
      key: moduleId,
      title: `Módulo ${moduleIndex + 1} — ${module.title}`,
      items,
    });
  }

  // Ungrouped (no module assigned)
  const ungrouped = filtered.filter((r) => !r.moduleId);
  if (ungrouped.length) {
    groups.push({ key: "general", title: "Recursos generales", items: ungrouped });
  }

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)] sm:text-3xl">
            Materiales del curso
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            Documentos, vídeos y recursos de contenido — {materials.length} {materials.length === 1 ? "material" : "materiales"} disponibles
          </p>
        </div>

        {/* Search */}
        {materials.length > 3 ? (
          <label className="relative flex min-h-11 w-full items-center sm:max-w-xs">
            <Search className="absolute left-3.5 h-4 w-4 text-[var(--color-muted)]" />
            <input
              className="h-11 w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar materiales…"
              type="search"
              value={search}
            />
          </label>
        ) : null}
      </div>

      {/* Content */}
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[rgba(22,60,88,0.16)] bg-white px-6 py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[var(--radius-xl)] bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
            <BookOpen className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
            Sin materiales publicados
          </p>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
            Cuando el docente publique materiales del curso, aparecerán aquí organizados por módulo.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[rgba(22,60,88,0.16)] bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-[var(--color-ink)]">Sin resultados</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            No hay materiales que coincidan con "{search}".
          </p>
          <button
            className="mt-4 text-sm font-semibold text-[var(--color-primary)] hover:underline"
            onClick={() => setSearch("")}
            type="button"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {group.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((resource) => (
                  <MaterialCard key={resource.id} resource={resource} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
