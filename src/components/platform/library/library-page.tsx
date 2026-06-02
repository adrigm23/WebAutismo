"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { LibraryResourceCategory, LibraryResourceType, LibraryVisibility } from "@prisma/client";
import {
  BookOpen,
  Download,
  Edit2,
  FileText,
  Film,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  Image,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Plus,
  Presentation,
  Search,
  Trash2,
  Upload,
  X,
  Eye,
} from "lucide-react";
import type { LibraryFolderItem, LibraryResourceItem } from "@/lib/library";
import {
  createLibraryFolderAction,
  deleteLibraryFolderAction,
  deleteLibraryResourceAction,
  updateLibraryResourceAction,
  uploadLibraryResourceAction,
} from "@/actions/library";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "list";

type Filters = {
  q: string;
  type: LibraryResourceType | "";
  category: LibraryResourceCategory | "";
  courseId: string;
};

export type LibraryCourse = { id: string; title: string; slug: string };

export type LibraryPageProps = {
  resources: LibraryResourceItem[];
  folders: LibraryFolderItem[];
  courses: LibraryCourse[];
  canManage: boolean;
  role: "student" | "teacher" | "admin";
  newResourceHref?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const VISIBILITY_LABELS: Record<LibraryVisibility, string> = {
  PUBLIC: "Público",
  ENROLLED_STUDENTS: "Alumnos matriculados",
  COURSE_ONLY: "Solo el curso",
  TEACHERS_ONLY: "Solo docentes",
  PRIVATE: "Privado",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  if (days < 7) return `Hace ${days} días`;
  if (days < 14) return "Hace 1 semana";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function ResourceTypeIcon({ type, className }: { type: LibraryResourceType; className?: string }) {
  const configs: Record<LibraryResourceType, { Icon: React.ElementType; bg: string; color: string; badge: string }> = {
    PDF: { Icon: FileText, bg: "bg-red-50", color: "text-red-600", badge: "PDF" },
    VIDEO: { Icon: Film, bg: "bg-emerald-50", color: "text-emerald-600", badge: "MP4" },
    PRESENTATION: { Icon: Presentation, bg: "bg-amber-50", color: "text-amber-600", badge: "PPTX" },
    DOCUMENT: { Icon: FileText, bg: "bg-sky-50", color: "text-sky-600", badge: "DOC" },
    IMAGE: { Icon: Image, bg: "bg-purple-50", color: "text-purple-600", badge: "IMG" },
    LINK: { Icon: BookOpen, bg: "bg-violet-50", color: "text-violet-600", badge: "URL" },
    OTHER: { Icon: BookOpen, bg: "bg-gray-50", color: "text-gray-500", badge: "FILE" },
  };

  const { Icon, bg, color } = configs[type];

  return (
    <div className={cn("flex items-center justify-center rounded-xl", bg, className)}>
      <Icon className={cn("h-5 w-5", color)} />
    </div>
  );
}

function ResourceTypeBadge({ type }: { type: LibraryResourceType }) {
  const configs: Record<LibraryResourceType, { bg: string; text: string; label: string }> = {
    PDF: { bg: "bg-red-50", text: "text-red-700", label: "PDF" },
    VIDEO: { bg: "bg-emerald-50", text: "text-emerald-700", label: "MP4" },
    PRESENTATION: { bg: "bg-amber-50", text: "text-amber-700", label: "PPTX" },
    DOCUMENT: { bg: "bg-sky-50", text: "text-sky-700", label: "DOC" },
    IMAGE: { bg: "bg-purple-50", text: "text-purple-700", label: "IMG" },
    LINK: { bg: "bg-violet-50", text: "text-violet-700", label: "URL" },
    OTHER: { bg: "bg-gray-50", text: "text-gray-600", label: "FILE" },
  };

  const { bg, text, label } = configs[type];

  return (
    <span className={cn("flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wide", bg, text)}>
      <span>⬛</span>
      {label}
    </span>
  );
}

// ─── Resource Card (Grid) ─────────────────────────────────────────────────────

function ResourceCardGrid({
  resource,
  canManage,
  onEdit,
  onDelete,
}: {
  resource: LibraryResourceItem;
  canManage: boolean;
  onEdit: (r: LibraryResourceItem) => void;
  onDelete: (r: LibraryResourceItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#eaecf0] bg-white transition hover:shadow-md">
      {/* Thumbnail area */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
        <ResourceTypeBadge type={resource.type} />
        <div className="absolute inset-0 flex items-center justify-center">
          <ResourceTypeIcon type={resource.type} className="h-16 w-16" />
        </div>

        {/* Three-dot menu */}
        <div ref={menuRef} className="absolute right-2 top-2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#6b7280] shadow-sm opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-[#1a1f2e]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 min-w-[140px] overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-lg">
              <a
                href={`${resource.downloadHref}?inline=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="h-3.5 w-3.5" /> Ver
              </a>
              <a
                href={resource.downloadHref}
                download
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
                onClick={() => setMenuOpen(false)}
              >
                <Download className="h-3.5 w-3.5" /> Descargar
              </a>
              {canManage && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1a1f2e]">
          {resource.title}
        </h3>

        {resource.description && (
          <p className="line-clamp-2 text-xs text-[#6b7280]">{resource.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[0.65rem] text-[#9ba3af]">{formatBytes(resource.fileSize)}</span>
          <span className="text-[0.65rem] text-[#9ba3af]">{formatDate(resource.createdAt)}</span>
        </div>

        {resource.courseTitle && (
          <span className="inline-block rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[0.6rem] text-[#6b7280]">
            {resource.courseTitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Resource Row (List) ──────────────────────────────────────────────────────

function ResourceRowList({
  resource,
  canManage,
  onEdit,
  onDelete,
}: {
  resource: LibraryResourceItem;
  canManage: boolean;
  onEdit: (r: LibraryResourceItem) => void;
  onDelete: (r: LibraryResourceItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-[#eaecf0] bg-white px-4 py-3 transition hover:shadow-sm">
      <ResourceTypeIcon type={resource.type} className="h-10 w-10 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1a1f2e]">{resource.title}</p>
        <p className="mt-0.5 text-xs text-[#9ba3af]">
          {formatBytes(resource.fileSize)} · {formatDate(resource.createdAt)}
          {resource.courseTitle && ` · ${resource.courseTitle}`}
          {resource.folderName && ` · ${resource.folderName}`}
        </p>
      </div>

      <span className="hidden shrink-0 text-[0.65rem] font-medium text-[#9ba3af] sm:block">
        {TYPE_LABELS[resource.type]}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={resource.downloadHref}
          download
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
          title="Descargar"
        >
          <Download className="h-4 w-4" />
        </a>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ba3af] hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-50 min-w-[140px] overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-lg">
              <a
                href={`${resource.downloadHref}?inline=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="h-3.5 w-3.5" /> Ver
              </a>
              {canManage && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onClose,
  courses,
  folders,
  editResource,
}: {
  open: boolean;
  onClose: () => void;
  courses: LibraryCourse[];
  folders: LibraryFolderItem[];
  editResource?: LibraryResourceItem | null;
}) {
  const isEdit = Boolean(editResource);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateLibraryResourceAction : uploadLibraryResourceAction,
    {}
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eaecf0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1a1f2e]">
            {isEdit ? "Editar recurso" : "Subir archivo"}
          </h2>
          <button type="button" onClick={onClose} className="text-[#9ba3af] hover:text-[#1a1f2e]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-4 p-6">
          {isEdit && <input type="hidden" name="id" value={editResource?.id} />}

          {state.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Título *</label>
            <input
              name="title"
              required
              defaultValue={editResource?.title ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e] focus:ring-2 focus:ring-[#1a1f2e]/10"
              placeholder="Nombre del recurso"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Descripción</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editResource?.description ?? ""}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e] focus:ring-2 focus:ring-[#1a1f2e]/10"
              placeholder="Descripción opcional"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Archivo *</label>
              <input
                type="file"
                name="file"
                required={!isEdit}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.ogg"
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm text-[#374151]"
              />
            </div>
          )}

          {isEdit && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">
                Reemplazar archivo (opcional)
              </label>
              <input
                type="file"
                name="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.ogg"
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm text-[#374151]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Categoría</label>
              <select
                name="category"
                defaultValue={editResource?.category ?? ""}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
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
                defaultValue={editResource?.visibility ?? "PRIVATE"}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
              >
                {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {courses.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Curso asociado</label>
              <select
                name="courseId"
                defaultValue={editResource?.courseId ?? ""}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
              >
                <option value="">Sin curso específico</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          {folders.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Carpeta</label>
              <select
                name="folderId"
                defaultValue={editResource?.folderId ?? ""}
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
              >
                <option value="">Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
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
              className="flex items-center gap-2 rounded-lg bg-[#1a1f2e] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d3748] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Subir archivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Folder Dialog ────────────────────────────────────────────────────────────

function FolderDialog({
  open,
  onClose,
  courses,
}: {
  open: boolean;
  onClose: () => void;
  courses: LibraryCourse[];
}) {
  const [state, formAction, pending] = useActionState(createLibraryFolderAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eaecf0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1a1f2e]">Nueva carpeta</h2>
          <button type="button" onClick={onClose} className="text-[#9ba3af] hover:text-[#1a1f2e]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-4 p-6">
          {state.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Nombre *</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
              placeholder="Nombre de la carpeta"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Descripción</label>
            <input
              name="description"
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
              placeholder="Opcional"
            />
          </div>

          {courses.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Curso</label>
              <select
                name="courseId"
                className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm outline-none focus:border-[#1a1f2e]"
              >
                <option value="">Global (sin curso)</option>
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
              className="flex items-center gap-2 rounded-lg bg-[#1a1f2e] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d3748] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear carpeta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirmDialog({
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
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <h2 className="text-base font-semibold text-[#1a1f2e]">Eliminar recurso</h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            ¿Eliminar &ldquo;{resource.title}&rdquo;? Esta acción no se puede deshacer.
          </p>

          {state.error && (
            <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
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

// ─── Folder Card ──────────────────────────────────────────────────────────────

function FolderCard({
  folder,
  canManage,
  onDeleteFolder,
  onSelectFolder,
}: {
  folder: LibraryFolderItem;
  canManage: boolean;
  onDeleteFolder: (f: LibraryFolderItem) => void;
  onSelectFolder: (id: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const folderColors = [
    "text-blue-400", "text-amber-400", "text-emerald-400", "text-purple-400",
  ];
  const colorIdx = folder.name.charCodeAt(0) % folderColors.length;

  return (
    <button
      type="button"
      onClick={() => onSelectFolder(folder.id)}
      className="group relative flex items-center gap-3 rounded-xl border border-[#eaecf0] bg-white px-4 py-3 text-left transition hover:border-[#d0d5dd] hover:shadow-sm"
    >
      <FolderOpen className={cn("h-8 w-8 shrink-0", folderColors[colorIdx])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1a1f2e]">{folder.name}</p>
        <p className="text-xs text-[#9ba3af]">{folder.resourceCount} archivos</p>
      </div>

      {canManage && (
        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ba3af] opacity-0 transition group-hover:opacity-100 hover:bg-[#f3f4f6] hover:text-[#1a1f2e]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 min-w-[130px] overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-lg">
              <button
                type="button"
                onClick={() => { onDeleteFolder(folder); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Delete Folder Confirm ─────────────────────────────────────────────────────

function DeleteFolderConfirmDialog({
  folder,
  onClose,
}: {
  folder: LibraryFolderItem | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(deleteLibraryFolderAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!folder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <h2 className="text-base font-semibold text-[#1a1f2e]">Eliminar carpeta</h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            ¿Eliminar la carpeta &ldquo;{folder.name}&rdquo;? Los archivos dentro no se eliminarán.
          </p>
          {state.error && (
            <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          )}
          <form action={formAction}>
            <input type="hidden" name="id" value={folder.id} />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm text-[#374151] hover:bg-[#f3f4f6]">
                Cancelar
              </button>
              <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Eliminar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Library Page ────────────────────────────────────────────────────────

export function LibraryPage({ resources, folders, courses, canManage, newResourceHref }: LibraryPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFolderId, setActiveFolderId] = useState<string | null | undefined>(undefined);
  const [filters, setFilters] = useState<Filters>({ q: "", type: "", category: "", courseId: "" });
  const [showUpload, setShowUpload] = useState(false);
  const [showFolder, setShowFolder] = useState(false);
  const [editResource, setEditResource] = useState<LibraryResourceItem | null>(null);
  const [deleteResource, setDeleteResource] = useState<LibraryResourceItem | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<LibraryFolderItem | null>(null);
  const [, startTransition] = useTransition();

  // Filter resources
  const filtered = resources.filter((r) => {
    if (activeFolderId !== undefined && r.folderId !== activeFolderId) return false;
    if (filters.type && r.type !== filters.type) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.courseId && r.courseId !== filters.courseId) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q) ||
        r.courseTitle?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  const featuredFolders = folders.slice(0, 6);
  const hasActiveFilters = filters.type || filters.category || filters.courseId;

  function clearFilter(key: keyof Filters) {
    setFilters((f) => ({ ...f, [key]: "" }));
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1f2e] sm:text-[1.75rem]">
              Biblioteca Central
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              Explora, filtra y descarga materiales curados para educadores, profesionales de la salud y familias.
            </p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setShowFolder(true)}
                className="flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6]"
              >
                <FolderPlus className="h-4 w-4" /> Nueva Carpeta
              </button>
              {newResourceHref ? (
                <Link
                  href={newResourceHref}
                  className="flex items-center gap-2 rounded-lg bg-[#1a1f2e] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d3748]"
                >
                  <Plus className="h-4 w-4" /> Publicar Recurso
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 rounded-lg bg-[#1a1f2e] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d3748]"
                >
                  <Upload className="h-4 w-4" /> Subir Archivo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search + Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-[340px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba3af]" />
            <input
              type="text"
              placeholder="Buscar recursos, archivos, temas..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="w-full rounded-lg border border-[#d0d5dd] bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[#1a1f2e] focus:ring-2 focus:ring-[#1a1f2e]/10"
            />
          </div>

          {/* Type filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as LibraryResourceType | "" }))}
            className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#1a1f2e]"
          >
            <option value="">Tipo de Archivo</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as LibraryResourceCategory | "" }))}
            className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#1a1f2e]"
          >
            <option value="">Categoría</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Course filter */}
          {courses.length > 0 && (
            <select
              value={filters.courseId}
              onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
              className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#1a1f2e]"
            >
              <option value="">Todos los cursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.type && (
                <span className="flex items-center gap-1 rounded-full bg-[#1a1f2e] px-3 py-1 text-xs text-white">
                  {TYPE_LABELS[filters.type as LibraryResourceType]}
                  <button type="button" onClick={() => clearFilter("type")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {filters.category && (
                <span className="flex items-center gap-1 rounded-full bg-[#1a1f2e] px-3 py-1 text-xs text-white">
                  {CATEGORY_LABELS[filters.category as LibraryResourceCategory]}
                  <button type="button" onClick={() => clearFilter("category")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {filters.courseId && (
                <span className="flex items-center gap-1 rounded-full bg-[#1a1f2e] px-3 py-1 text-xs text-white">
                  {courses.find((c) => c.id === filters.courseId)?.title ?? "Curso"}
                  <button type="button" onClick={() => clearFilter("courseId")}><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* View mode + sort — right side */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn("rounded-lg p-2 transition", viewMode === "grid" ? "bg-[#1a1f2e] text-white" : "border border-[#d0d5dd] bg-white text-[#6b7280] hover:bg-[#f3f4f6]")}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn("rounded-lg p-2 transition", viewMode === "list" ? "bg-[#1a1f2e] text-white" : "border border-[#d0d5dd] bg-white text-[#6b7280] hover:bg-[#f3f4f6]")}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Folders */}
        {featuredFolders.length > 0 && activeFolderId === undefined && !hasActiveFilters && !filters.q && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-[#1a1f2e]">Carpetas Destacadas</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  canManage={canManage}
                  onDeleteFolder={setDeleteFolder}
                  onSelectFolder={(id) => {
                    startTransition(() => setActiveFolderId(id));
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Back from folder view */}
        {activeFolderId !== undefined && (
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFolderId(undefined)}
              className="text-sm text-[#9ba3af] hover:text-[#1a1f2e]"
            >
              ← Todas las carpetas
            </button>
            {activeFolderId && (
              <>
                <span className="text-[#d0d5dd]">/</span>
                <span className="text-sm font-medium text-[#1a1f2e]">
                  {folders.find((f) => f.id === activeFolderId)?.name}
                </span>
              </>
            )}
          </div>
        )}

        {/* Resources section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1a1f2e]">
              {activeFolderId ? "Archivos en esta carpeta" : "Archivos Recientes"}
              {filtered.length > 0 && (
                <span className="ml-2 text-[#9ba3af] font-normal">({filtered.length})</span>
              )}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-[#d1d5db]" />
              <p className="text-sm font-medium text-[#6b7280]">
                {filters.q || hasActiveFilters
                  ? "No se encontraron recursos con estos filtros."
                  : "No hay recursos disponibles todavía."}
              </p>
              {canManage && !filters.q && !hasActiveFilters && (
                newResourceHref ? (
                  <Link
                    href={newResourceHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1a1f2e] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d3748]"
                  >
                    <Plus className="h-4 w-4" /> Publicar primer recurso
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUpload(true)}
                    className="mt-4 flex items-center gap-2 rounded-full bg-[#1a1f2e] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d3748]"
                  >
                    <Upload className="h-4 w-4" /> Subir primer archivo
                  </button>
                )
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((resource) => (
                <ResourceCardGrid
                  key={resource.id}
                  resource={resource}
                  canManage={canManage}
                  onEdit={setEditResource}
                  onDelete={setDeleteResource}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((resource) => (
                <ResourceRowList
                  key={resource.id}
                  resource={resource}
                  canManage={canManage}
                  onEdit={setEditResource}
                  onDelete={setDeleteResource}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Dialogs */}
      <UploadDialog
        open={showUpload || Boolean(editResource)}
        onClose={() => { setShowUpload(false); setEditResource(null); }}
        courses={courses}
        folders={folders}
        editResource={editResource}
      />
      <FolderDialog
        open={showFolder}
        onClose={() => setShowFolder(false)}
        courses={courses}
      />
      <DeleteConfirmDialog
        resource={deleteResource}
        onClose={() => setDeleteResource(null)}
      />
      <DeleteFolderConfirmDialog
        folder={deleteFolder}
        onClose={() => setDeleteFolder(null)}
      />
    </div>
  );
}
