"use client";

import { useActionState, useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { LibraryResourceCategory, LibraryResourceType, LibraryVisibility } from "@prisma/client";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  File,
  FileText,
  Film,
  FolderOpen,
  Globe,
  Image,
  Loader2,
  MoreHorizontal,
  Plus,
  Presentation,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { LibraryResourceItem } from "@/lib/library";
import type { LibraryCourse } from "./library-page";
import {
  deleteLibraryResourceAction,
  updateLibraryResourceAction,
} from "@/actions/library";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeacherLibraryPageProps = {
  resources: LibraryResourceItem[];
  courses: LibraryCourse[];
  userId: string;
  newResourceHref: string;
};

type Tab = "mis-recursos" | "por-curso";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<LibraryResourceType, string> = {
  PDF: "PDF",
  VIDEO: "Vídeo",
  PRESENTATION: "Presentación",
  DOCUMENT: "Documento",
  IMAGE: "Imagen",
  LINK: "Enlace",
  OTHER: "Otro",
};

const CATEGORY_LABELS: Record<LibraryResourceCategory, string> = {
  GUIDE: "Guías",
  TEMPLATE: "Plantillas",
  WEBINAR: "Webinars",
  CASE_STUDY: "Casos prácticos",
  MATERIAL: "Materiales",
  FAMILY_RESOURCE: "Recursos para familias",
  PROFESSIONAL_RESOURCE: "Recursos profesionales",
  OTHER: "Otros",
};

const VISIBILITY_CONFIG: Record<LibraryVisibility, { bg: string; text: string; label: string }> = {
  PUBLIC: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Público" },
  ENROLLED_STUDENTS: { bg: "bg-sky-50", text: "text-sky-700", label: "Solo Alumnos" },
  COURSE_ONLY: { bg: "bg-amber-50", text: "text-amber-700", label: "Solo el curso" },
  TEACHERS_ONLY: { bg: "bg-violet-50", text: "text-violet-700", label: "Solo docentes" },
  PRIVATE: { bg: "bg-gray-100", text: "text-gray-600", label: "Privado" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Type icon ────────────────────────────────────────────────────────────────

const TYPE_ICON_CONFIG: Record<
  LibraryResourceType,
  { Icon: React.ElementType; bg: string; color: string }
> = {
  PDF: { Icon: FileText, bg: "bg-red-50", color: "text-red-500" },
  VIDEO: { Icon: Film, bg: "bg-emerald-50", color: "text-emerald-500" },
  PRESENTATION: { Icon: Presentation, bg: "bg-amber-50", color: "text-amber-500" },
  DOCUMENT: { Icon: FileText, bg: "bg-sky-50", color: "text-sky-500" },
  IMAGE: { Icon: Image, bg: "bg-purple-50", color: "text-purple-500" },
  LINK: { Icon: Globe, bg: "bg-violet-50", color: "text-violet-500" },
  OTHER: { Icon: File, bg: "bg-gray-50", color: "text-gray-500" },
};

function ResourceTypeIcon({
  type,
  size = "md",
}: {
  type: LibraryResourceType;
  size?: "sm" | "md";
}) {
  const { Icon, bg, color } = TYPE_ICON_CONFIG[type];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        bg,
        size === "sm" ? "h-8 w-8" : "h-11 w-11"
      )}
    >
      <Icon className={cn(color, size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
    </div>
  );
}

// ─── Visibility badge ─────────────────────────────────────────────────────────

function VisibilityBadge({ visibility }: { visibility: LibraryVisibility }) {
  const { bg, text, label } = VISIBILITY_CONFIG[visibility];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", bg, text)}>
      {label}
    </span>
  );
}

// ─── Resource card (grid) ─────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onEdit,
  onDelete,
}: {
  resource: LibraryResourceItem;
  onEdit: (r: LibraryResourceItem) => void;
  onDelete: (r: LibraryResourceItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isVideo = resource.type === "VIDEO";
  const isLink = resource.type === "LINK" && resource.externalUrl;
  const viewHref = isLink
    ? resource.externalUrl!
    : `${resource.downloadHref}?inline=1`;

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-[#eaecf0] bg-white p-4 transition hover:shadow-sm">
      {/* Top row: icon + menu */}
      <div className="flex items-start justify-between">
        <ResourceTypeIcon type={resource.type} />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-50 min-w-[150px] overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-lg">
              <a
                href={viewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="h-3.5 w-3.5" /> Ver
              </a>
              {!isLink && (
                <a
                  href={resource.downloadHref}
                  download
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
                  onClick={() => setMenuOpen(false)}
                >
                  <Download className="h-3.5 w-3.5" /> Descargar
                </a>
              )}
              <button
                type="button"
                onClick={() => { onEdit(resource); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
              >
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                type="button"
                onClick={() => { onDelete(resource); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-primary)]">
        {resource.title}
      </h3>

      {/* Visibility */}
      <VisibilityBadge visibility={resource.visibility} />

      {/* Meta */}
      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-[#9ba3af]">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{resource.courseTitle ?? "Sin curso asociado"}</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-[#9ba3af]">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          Subido: {formatShortDate(resource.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Course accordion row ─────────────────────────────────────────────────────

function CourseAccordionRow({
  resource,
  onEdit,
  onDelete,
}: {
  resource: LibraryResourceItem;
  onEdit: (r: LibraryResourceItem) => void;
  onDelete: (r: LibraryResourceItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex items-center gap-3 border-t border-[#f3f4f6] px-4 py-3 hover:bg-[#fafafa]">
      <ResourceTypeIcon type={resource.type} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-primary)]">{resource.title}</p>
        <p className="mt-0.5 text-xs text-[#9ba3af]">
          {TYPE_LABELS[resource.type]} · {formatBytes(resource.fileSize)}
        </p>
      </div>

      <VisibilityBadge visibility={resource.visibility} />

      <span className="hidden shrink-0 text-xs text-[#9ba3af] sm:block">
        {formatShortDate(resource.createdAt)}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={resource.downloadHref}
          download
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
          title="Descargar"
        >
          <Download className="h-4 w-4" />
        </a>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] hover:bg-[#f3f4f6] hover:text-[var(--color-primary)]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-50 min-w-[140px] overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-lg">
              <button
                type="button"
                onClick={() => { onEdit(resource); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
              >
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                type="button"
                onClick={() => { onDelete(resource); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Course accordion section ─────────────────────────────────────────────────

function CourseAccordion({
  courseId,
  courseTitle,
  courseSlug,
  resources,
  onEdit,
  onDelete,
}: {
  courseId: string | null;
  courseTitle: string;
  courseSlug: string | null;
  resources: LibraryResourceItem[];
  onEdit: (r: LibraryResourceItem) => void;
  onDelete: (r: LibraryResourceItem) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-[#eaecf0] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#fafafa]"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#9ba3af]" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#9ba3af]" />
        )}
        <span className="flex-1 text-sm font-semibold text-[var(--color-primary)]">
          {courseTitle}
        </span>
        <span className="shrink-0 rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
          {resources.length} recurso{resources.length !== 1 ? "s" : ""}
        </span>
        {courseSlug && (
          <Link
            href={`/docente/cursos/${courseSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-xs text-[#9ba3af] hover:text-[var(--color-primary)]"
          >
            Ver curso →
          </Link>
        )}
      </button>

      {open && (
        <div>
          {resources.map((r) => (
            <CourseAccordionRow key={r.id} resource={r} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────

function EditDialog({
  resource,
  courses,
  onClose,
}: {
  resource: LibraryResourceItem | null;
  courses: LibraryCourse[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateLibraryResourceAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eaecf0] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-primary)]">Editar recurso</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9ba3af] hover:text-[var(--color-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-4 p-6">
          <input type="hidden" name="id" value={resource.id} />

          {state.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Título *</label>
            <input
              name="title"
              required
              defaultValue={resource.title}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[#1a1f2e]/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Descripción</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={resource.description ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[#1a1f2e]/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Reemplazar archivo (opcional)</label>
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.ogg"
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm text-[#374151]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Categoría</label>
              <select
                name="category"
                defaultValue={resource.category ?? ""}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Sin categoría</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Visibilidad *</label>
              <select
                name="visibility"
                required
                defaultValue={resource.visibility}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                {Object.entries(VISIBILITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {courses.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Curso asociado</label>
              <select
                name="courseId"
                defaultValue={resource.courseId ?? ""}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Sin curso específico</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  resource,
  onClose,
}: {
  resource: LibraryResourceItem | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteLibraryResourceAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <h2 className="text-base font-semibold text-[var(--color-primary)]">Eliminar recurso</h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            ¿Eliminar &ldquo;{resource.title}&rdquo;? Esta acción no se puede deshacer.
          </p>

          {state.error && (
            <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <form action={formAction}>
            <input type="hidden" name="id" value={resource.id} />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeacherLibraryPage({
  resources,
  courses,
  userId,
  newResourceHref,
}: TeacherLibraryPageProps) {
  const [tab, setTab] = useState<Tab>("mis-recursos");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<LibraryResourceType | "">("");
  const [visibilityFilter, setVisibilityFilter] = useState<LibraryVisibility | "">("");
  const [editResource, setEditResource] = useState<LibraryResourceItem | null>(null);
  const [deleteResource, setDeleteResource] = useState<LibraryResourceItem | null>(null);

  // "Mis recursos" — only uploaded by this teacher
  const myResources = useMemo(
    () => resources.filter((r) => r.uploadedById === userId),
    [resources, userId]
  );

  // Apply filters to "Mis recursos"
  const filteredMy = useMemo(() => {
    return myResources.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (visibilityFilter && r.visibility !== visibilityFilter) return false;
      if (q.trim()) {
        const term = q.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term) ||
          r.courseTitle?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [myResources, typeFilter, visibilityFilter, q]);

  // "Por curso" — group all resources by courseId
  const courseGroups = useMemo(() => {
    const byId = new Map<string | null, LibraryResourceItem[]>();
    for (const r of resources) {
      const key = r.courseId ?? null;
      if (!byId.has(key)) byId.set(key, []);
      byId.get(key)!.push(r);
    }

    const result: {
      courseId: string | null;
      courseTitle: string;
      courseSlug: string | null;
      resources: LibraryResourceItem[];
    }[] = [];

    // Courses this teacher teaches, in order
    for (const c of courses) {
      const rs = byId.get(c.id) ?? [];
      if (rs.length > 0) {
        result.push({ courseId: c.id, courseTitle: c.title, courseSlug: c.slug, resources: rs });
      }
      byId.delete(c.id);
    }

    // General resources (no course)
    const general = byId.get(null) ?? [];
    if (general.length > 0) {
      result.push({ courseId: null, courseTitle: "Sin curso asociado", courseSlug: null, resources: general });
    }

    return result;
  }, [resources, courses]);

  return (
    <div className="min-h-screen">
      <div className="px-5 py-8 sm:px-8 xl:px-10">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)] sm:text-[1.75rem]">
              Mi Biblioteca
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              Gestiona y organiza tus materiales educativos.
            </p>
          </div>
          <Link
            href={newResourceHref}
            className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]"
          >
            <Plus className="h-4 w-4" />
            Publicar recurso
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[#eaecf0]">
          <div className="flex gap-6">
            {(["mis-recursos", "por-curso"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "pb-3 text-sm font-medium transition",
                  tab === t
                    ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "text-[#6b7280] hover:text-[var(--color-primary)]"
                )}
              >
                {t === "mis-recursos" ? "Mis recursos" : "Por curso"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Mis recursos ── */}
        {tab === "mis-recursos" && (
          <>
            {/* Filters */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba3af]" />
                <input
                  type="text"
                  placeholder="Buscar por título, palabra clave o formato..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-lg border border-[#d0d5dd] bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[#1a1f2e]/10"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as LibraryResourceType | "")}
                className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#374151] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Tipo de archivo</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as LibraryVisibility | "")}
                className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#374151] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Visibilidad</option>
                {Object.entries(VISIBILITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Grid */}
            {filteredMy.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-[#d1d5db]" />
                <p className="text-sm font-medium text-[#6b7280]">
                  {q || typeFilter || visibilityFilter
                    ? "No se encontraron recursos con estos filtros."
                    : "Aún no has publicado ningún recurso."}
                </p>
                {!q && !typeFilter && !visibilityFilter && (
                  <Link
                    href={newResourceHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-strong)]"
                  >
                    <Plus className="h-4 w-4" /> Publicar primer recurso
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMy.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onEdit={setEditResource}
                    onDelete={setDeleteResource}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Por curso ── */}
        {tab === "por-curso" && (
          <div className="space-y-3">
            {courseGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-[#d1d5db]" />
                <p className="text-sm font-medium text-[#6b7280]">
                  No hay recursos asociados a tus cursos.
                </p>
              </div>
            ) : (
              courseGroups.map((g) => (
                <CourseAccordion
                  key={g.courseId ?? "general"}
                  courseId={g.courseId}
                  courseTitle={g.courseTitle}
                  courseSlug={g.courseSlug}
                  resources={g.resources}
                  onEdit={setEditResource}
                  onDelete={setDeleteResource}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EditDialog
        resource={editResource}
        courses={courses}
        onClose={() => setEditResource(null)}
      />
      <DeleteDialog
        resource={deleteResource}
        onClose={() => setDeleteResource(null)}
      />
    </div>
  );
}
