"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/session";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Edit2,
  Eye,
  ExternalLink,
  FileText,
  GripVertical,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Settings,
  Tag,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  addCourseModuleAction,
  addCourseResourceAction,
  deleteCourseModuleAction,
  deleteCourseResourceAction,
  moveModuleAction,
  updateCourseCategoryAction,
  updateCourseModuleAction,
  updateCourseStatusAction,
} from "@/actions/course-builder";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuilderResource = {
  id: string;
  title: string;
  type: "MATERIAL" | "EXERCISE";
  source: "FILE" | "LINK";
  mimeType: string | null;
  linkUrl?: string | null;
  estimatedTime?: string | null;
};

export type BuilderModule = {
  id: string;
  title: string;
  position: number;
  resources: BuilderResource[];
};

export type BuilderCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "ACTIVE" | "INACTIVE";
  accentFrom: string;
  accentTo: string;
  modules: BuilderModule[];
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResourceIcon(resource: BuilderResource) {
  if (resource.type === "EXERCISE") return { Icon: FileText, bg: "bg-[var(--color-primary-soft)]", text: "text-[var(--color-primary)]" };
  if (resource.mimeType?.startsWith("video/")) return { Icon: Video, bg: "bg-[var(--color-primary-soft)]", text: "text-[var(--color-primary)]" };
  if (resource.mimeType === "application/pdf") return { Icon: FileText, bg: "bg-[var(--color-success-soft)]", text: "text-[var(--color-success)]" };
  return { Icon: FileText, bg: "bg-[rgba(22,60,88,0.08)]", text: "text-[var(--color-ink-soft)]" };
}

function getResourceSubtitle(resource: BuilderResource) {
  if (resource.type === "EXERCISE") return "Tarea · Requiere entrega";
  if (resource.source === "LINK") return "Enlace externo";
  if (resource.mimeType?.startsWith("video/")) return `Vídeo${resource.estimatedTime ? ` · ${resource.estimatedTime}` : ""}`;
  if (resource.mimeType === "application/pdf") return "Documento PDF";
  return "Material";
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, kind, onDismiss }: { msg: string; kind: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-xl",
      kind === "success" ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]",
    )}>
      {kind === "success" ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
      {msg}
      <button type="button" onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ title, desc, onConfirm, onCancel, loading }: {
  title: string; desc: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <h3 className="text-base font-bold text-[var(--color-ink)]">{title}</h3>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{desc}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={loading} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add/Edit Module dialog ────────────────────────────────────────────────────

function ModuleDialog({ courseId, editModule, onClose }: {
  courseId: string;
  editModule?: BuilderModule | null;
  onClose: (updated?: BuilderModule) => void;
}) {
  const isEdit = Boolean(editModule);
  const [addState, addAction, addPending] = useActionState(addCourseModuleAction, {});
  const [editState, editAction, editPending] = useActionState(updateCourseModuleAction, {});
  const pending = isEdit ? editPending : addPending;
  const state = isEdit ? editState : addState;

  useEffect(() => {
    if (addState.module) {
      onClose({ id: addState.module.id, title: addState.module.title, position: addState.module.position, resources: [] });
    }
  }, [addState.module, onClose]);

  useEffect(() => {
    if (editState.module) onClose({ ...editModule!, title: editState.module.title });
  }, [editState.module, editModule, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(22,60,88,0.08)] px-6 py-4">
          <h2 className="text-base font-bold text-[var(--color-ink)]">{isEdit ? "Editar módulo" : "Nuevo módulo"}</h2>
          <button type="button" onClick={() => onClose()} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"><X className="h-5 w-5" /></button>
        </div>
        <form action={isEdit ? editAction : addAction} className="space-y-4 p-6">
          {isEdit
            ? <input type="hidden" name="moduleId" value={editModule?.id} />
            : <input type="hidden" name="courseId" value={courseId} />
          }
          {state.error && <div className="rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{state.error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Título *</label>
            <input name="title" required defaultValue={editModule?.title ?? ""} placeholder="Ej. Módulo 1: Fundamentos" className="w-full rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10" />
          </div>
          {isEdit && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Tiempo estimado</label>
              <input name="estimatedTime" placeholder="Ej. 2 horas" className="w-full rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => onClose()} className="rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]">Cancelar</button>
            <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar" : "Crear módulo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Lesson dialog ────────────────────────────────────────────────────────

function AddLessonDialog({ courseId, moduleId, onClose }: {
  courseId: string; moduleId: string;
  onClose: (res?: BuilderResource) => void;
}) {
  const [state, formAction, pending] = useActionState(addCourseResourceAction, {});
  const [type, setType] = useState<"MATERIAL" | "EXERCISE">("MATERIAL");
  const [source, setSource] = useState<"FILE" | "LINK">("FILE");

  useEffect(() => {
    if (state.resource) {
      onClose({
        id: state.resource.id,
        title: state.resource.title,
        type: state.resource.type,
        source: state.resource.source,
        mimeType: state.resource.mimeType,
        linkUrl: state.resource.linkUrl,
      });
    }
  }, [state.resource, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(22,60,88,0.08)] px-6 py-4">
          <h2 className="text-base font-bold text-[var(--color-ink)]">Añadir lección</h2>
          <button type="button" onClick={() => onClose()} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"><X className="h-5 w-5" /></button>
        </div>

        <form action={formAction} className="space-y-4 p-6">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="moduleId" value={moduleId} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="source" value={source} />

          {state.error && <div className="rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{state.error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Título *</label>
            <input name="title" required placeholder="Ej. Introducción al neurodesarrollo" className="w-full rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10" />
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(["MATERIAL", "EXERCISE"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn("rounded-xl border py-2.5 text-sm font-medium transition", type === t ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-[rgba(22,60,88,0.15)] text-[var(--color-ink-soft)] hover:border-[rgba(22,60,88,0.3)]")}>
                  {t === "MATERIAL" ? "📄 Material" : "✏️ Ejercicio"}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">Origen</label>
            <div className="grid grid-cols-2 gap-2">
              {(["FILE", "LINK"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSource(s)}
                  className={cn("rounded-xl border py-2.5 text-sm font-medium transition", source === s ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-[rgba(22,60,88,0.15)] text-[var(--color-ink-soft)] hover:border-[rgba(22,60,88,0.3)]")}>
                  {s === "FILE" ? "📁 Archivo" : "🔗 Enlace"}
                </button>
              ))}
            </div>
          </div>

          {source === "LINK" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">URL *</label>
              <input name="linkUrl" type="url" required placeholder="https://..." className="w-full rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10" />
            </div>
          )}

          {source === "FILE" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">Archivo <span className="font-normal text-[var(--color-ink-soft)]">(opcional, puedes subir más tarde)</span></label>
              <input name="file" type="file" accept=".pdf,.mp4,.doc,.docx,.ppt,.pptx,.jpg,.png" className="w-full rounded-xl border border-[rgba(22,60,88,0.15)] px-3 py-2 text-sm text-[var(--color-ink-soft)]" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => onClose()} className="rounded-xl border border-[rgba(22,60,88,0.15)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]">Cancelar</button>
            <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Añadir lección
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { label: "Mis Cursos", href: "/docente/cursos" },
];

function BuilderSidebar({ onClose, onAddModule }: { onClose?: () => void; onAddModule: () => void }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[rgba(22,60,88,0.08)] px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--color-ink)]">Constructor de Cursos</p>
          {onClose && (
            <button aria-label="Cerrar menú" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)]" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {SIDEBAR_NAV.map((item) => (
          <Link
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]"
            href={item.href} key={item.label} onClick={onClose}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]" onClick={onAddModule} type="button">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Nuevo Módulo
        </button>
      </div>
      <div className="border-t border-[rgba(22,60,88,0.08)] space-y-0.5 px-3 py-3">
        <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]" href="/mi-cuenta" onClick={onClose}>
          <Settings className="h-4 w-4 shrink-0" strokeWidth={2} /> Ajustes
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.05)] hover:text-[var(--color-ink)]" type="submit">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} /> Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function BuilderTopbar({ course, status, onMobileMenuOpen, embedded }: {
  course: BuilderCourse; status: "ACTIVE" | "INACTIVE";
  onMobileMenuOpen: () => void; embedded?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[rgba(22,60,88,0.08)] bg-white px-4 shadow-sm lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {!embedded && (
          <button aria-label="Abrir menú" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)] lg:hidden" onClick={onMobileMenuOpen} type="button">
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Link
          href={`/docente/cursos/${course.slug}`}
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-primary)]"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate hidden sm:block">{course.title}</span>
          <span className="sm:hidden">Volver</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === "ACTIVE" && (
          <span className="hidden rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--color-success)] sm:inline-flex">● Publicado</span>
        )}
        <Link
          href={`/cursos/${course.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-[rgba(22,60,88,0.2)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Vista Previa</span>
        </Link>
      </div>
    </header>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

function LessonRow({ resource, onRequestDelete }: { resource: BuilderResource; onRequestDelete: (id: string) => void }) {
  const { Icon, bg, text } = getResourceIcon(resource);
  const subtitle = getResourceSubtitle(resource);
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
    <div className="group flex items-center gap-3 rounded-xl border border-[rgba(22,60,88,0.08)] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(22,60,88,0.06)]">
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", bg, text)}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{resource.title}</p>
        <p className="text-[0.72rem] text-[var(--color-muted)]">{subtitle}</p>
      </div>
      <div ref={menuRef} className="relative shrink-0">
        <button type="button" onClick={() => setMenuOpen(v => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-[rgba(22,60,88,0.06)]">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-40 min-w-[130px] overflow-hidden rounded-xl border border-[rgba(22,60,88,0.1)] bg-white shadow-lg">
            <button type="button" onClick={() => { onRequestDelete(resource.id); setMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]">
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ module: mod, courseId, isFirst, isLast, onDelete, onEdit, onMove, onResourceAdded, onResourceDeleted }: {
  module: BuilderModule; courseId: string; isFirst: boolean; isLast: boolean;
  onDelete: (id: string) => void; onEdit: (mod: BuilderModule) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onResourceAdded: (moduleId: string, res: BuilderResource) => void;
  onResourceDeleted: (moduleId: string, resourceId: string) => void;
}) {
  const [open, setOpen] = useState(mod.position === 1);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleDeleteResource(resourceId: string) {
    const fd = new FormData();
    fd.set("resourceId", resourceId);
    startTransition(async () => {
      const res = await deleteCourseResourceAction({}, fd);
      if (!res.error) onResourceDeleted(mod.id, resourceId);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[rgba(22,60,88,0.1)] bg-white shadow-[0_1px_4px_rgba(22,60,88,0.06)]">
        <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <GripVertical className="h-5 w-5 shrink-0 text-[var(--color-border)]" strokeWidth={2} />
          <button
            className="min-w-0 flex-1 truncate text-left text-[0.95rem] font-bold text-[var(--color-ink)] transition hover:text-[var(--color-primary)]"
            onClick={() => setOpen(v => !v)}
            type="button"
          >
            {mod.title}
          </button>
          <span className="shrink-0 rounded-full bg-[rgba(22,60,88,0.07)] px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--color-ink-soft)] sm:px-2.5">
            {mod.resources.length}
            <span className="hidden sm:inline"> Lecciones</span>
          </span>

          {/* Move up/down — hidden on mobile to avoid crowding */}
          <button type="button" disabled={isFirst || isPending} onClick={() => onMove(mod.id, "up")}
            className="hidden h-7 w-7 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)] disabled:opacity-30 sm:grid">
            <ChevronUp className="h-4 w-4" strokeWidth={2} />
          </button>
          <button type="button" disabled={isLast || isPending} onClick={() => onMove(mod.id, "down")}
            className="hidden h-7 w-7 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)] disabled:opacity-30 sm:grid">
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>

          {/* Menu */}
          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen(v => !v)}
              className="grid h-7 w-7 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-[rgba(22,60,88,0.06)]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-40 min-w-[140px] overflow-hidden rounded-xl border border-[rgba(22,60,88,0.1)] bg-white shadow-lg">
                <button type="button" onClick={() => { onEdit(mod); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-ink)] hover:bg-[rgba(22,60,88,0.04)]">
                  <Edit2 className="h-3.5 w-3.5" /> Editar
                </button>
                <button type="button" onClick={() => { onDelete(mod.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]">
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {open && (
          <div className="space-y-2 border-t border-[rgba(22,60,88,0.07)] px-5 pb-4 pt-3">
            {mod.resources.length > 0
              ? mod.resources.map(res => (
                <LessonRow key={res.id} resource={res} onRequestDelete={setDeleteResourceId} />
              ))
              : <p className="py-2 text-sm text-[var(--color-muted)]">Sin lecciones todavía.</p>
            }
            <button type="button" onClick={() => setShowAddLesson(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[rgba(22,60,88,0.2)] px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Añadir Lección
            </button>
          </div>
        )}
      </div>

      {showAddLesson && (
        <AddLessonDialog courseId={courseId} moduleId={mod.id}
          onClose={(res) => {
            setShowAddLesson(false);
            if (res) onResourceAdded(mod.id, res);
          }} />
      )}

      {deleteResourceId && (
        <ConfirmDialog
          title="Eliminar lección"
          desc="Se eliminará esta lección. Esta acción no se puede deshacer."
          onConfirm={() => { handleDeleteResource(deleteResourceId); setDeleteResourceId(null); }}
          onCancel={() => setDeleteResourceId(null)}
          loading={isPending}
        />
      )}
    </>
  );
}

// ─── Config panel ─────────────────────────────────────────────────────────────

const CATEGORIES = ["Intervención Clínica", "Educativo", "Herramientas", "Familia", "Terapia", "Diagnóstico", "Otro"];

function ConfigPanel({ course, status, onStatusChange, onCategoryChange, disabled }: {
  course: BuilderCourse; status: "ACTIVE" | "INACTIVE";
  onStatusChange: (s: "ACTIVE" | "INACTIVE") => void;
  onCategoryChange: (c: string) => void;
  disabled?: boolean;
}) {
  const visibilityMap = { INACTIVE: "draft", ACTIVE: "public" } as const;
  const visibility = visibilityMap[status] ?? "draft";

  const VISIBILITY_OPTIONS = [
    { id: "draft", label: "Borrador Oculto", desc: "Solo visible para creadores.", dbStatus: "INACTIVE" as const },
    { id: "public", label: "Público (Catálogo)", desc: "Visible para todos los alumnos.", dbStatus: "ACTIVE" as const },
  ];

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-l border-[rgba(22,60,88,0.1)] bg-white">
      <div className="border-b border-[rgba(22,60,88,0.08)] px-6 py-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[1rem] font-bold text-[var(--color-ink)]">Configuración del Curso</h2>
          {disabled && <span className="text-xs text-[var(--color-ink-muted)]">Guardando…</span>}
        </div>
        <p className="mt-0.5 text-[0.8rem] text-[var(--color-muted)]">Ajustes generales y metadatos.</p>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
        {/* Miniatura */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Miniatura del Curso</h3>
          </div>
          <div className="overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${course.accentFrom} 0%, ${course.accentTo} 100%)`, aspectRatio: "16/9" }} />
          <p className="mt-2 text-[0.7rem] leading-relaxed text-[var(--color-muted)]">Resolución recomendada: 1280×720px. Formatos: JPG, PNG.</p>
        </section>

        {/* Categoría */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Categoría</h3>
          </div>
          <div className={cn("relative", disabled && "opacity-50 pointer-events-none")}>
            <select className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[rgba(22,60,88,0.15)] bg-white pl-3 pr-8 text-sm font-medium text-[var(--color-ink)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none"
              value={course.category}
              onChange={(e) => onCategoryChange(e.target.value)}
              disabled={disabled}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </div>
        </section>

        {/* Visibilidad */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Estado de Visibilidad</h3>
          </div>
          <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
            {VISIBILITY_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" onClick={() => onStatusChange(opt.dbStatus)} disabled={disabled}
                className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition",
                  visibility === opt.id ? "border-[var(--color-primary)] bg-[rgba(22,60,88,0.04)]" : "border-[rgba(22,60,88,0.12)] hover:border-[rgba(22,60,88,0.25)]")}>
                <div className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border-2", visibility === opt.id ? "border-[var(--color-primary)]" : "border-[rgba(22,60,88,0.2)]")}>
                  {visibility === opt.id && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold", visibility === opt.id ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]")}>{opt.label}</p>
                  <p className="text-[0.72rem] text-[var(--color-muted)]">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CourseBuilder({ course, embedded = false }: { course: BuilderCourse; embedded?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modules, setModules] = useState<BuilderModule[]>(course.modules);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(course.status);
  const [category, setCategory] = useState(course.category);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  // Dialogs
  const [showAddModule, setShowAddModule] = useState(false);
  const [editModule, setEditModule] = useState<BuilderModule | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function showToast(msg: string, kind: "success" | "error" = "success") {
    setToast({ msg, kind });
  }

  // ── Status ───────────────────────────────────────────────────────────────

  async function handleStatusChange(newStatus: "ACTIVE" | "INACTIVE") {
    const prev = status;
    setStatus(newStatus);
    setSaving(true);
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("status", newStatus);
    const res = await updateCourseStatusAction({}, fd);
    setSaving(false);
    if (res.error) { setStatus(prev); showToast(res.error, "error"); }
    else showToast(newStatus === "ACTIVE" ? "Curso publicado." : "Guardado como borrador.");
  }

  // ── Category ─────────────────────────────────────────────────────────────

  async function handleCategoryChange(newCategory: string) {
    const prev = category;
    setCategory(newCategory);
    setSaving(true);
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("category", newCategory);
    const res = await updateCourseCategoryAction({}, fd);
    setSaving(false);
    if (res.error) { setCategory(prev); showToast(res.error, "error"); }
  }

  // ── Modules ───────────────────────────────────────────────────────────────

  function handleModuleAdded(mod: BuilderModule) {
    setModules(prev => [...prev, mod]);
    setShowAddModule(false);
    showToast("Módulo creado.");
  }

  function handleModuleEdited(updated: BuilderModule) {
    setModules(prev => prev.map(m => m.id === updated.id ? { ...m, title: updated.title } : m));
    setEditModule(null);
    showToast("Módulo actualizado.");
  }

  function handleDeleteModule(id: string) {
    setDeleteModuleId(id);
  }

  function confirmDeleteModule() {
    if (!deleteModuleId) return;
    const fd = new FormData();
    fd.set("moduleId", deleteModuleId);
    startDeleteTransition(async () => {
      const res = await deleteCourseModuleAction({}, fd);
      setDeleteModuleId(null);
      if (res.error) showToast(res.error, "error");
      else {
        setModules(prev => prev.filter(m => m.id !== deleteModuleId).map((m, i) => ({ ...m, position: i + 1 })));
        showToast("Módulo eliminado.");
      }
    });
  }

  async function handleMoveModule(moduleId: string, dir: "up" | "down") {
    const fd = new FormData();
    fd.set("moduleId", moduleId);
    fd.set("direction", dir);
    const res = await moveModuleAction({}, fd);
    if (res.error) { showToast(res.error, "error"); return; }
    setModules(prev => {
      const idx = prev.findIndex(m => m.id === moduleId);
      if (idx === -1) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((m, i) => ({ ...m, position: i + 1 }));
    });
  }

  function handleResourceAdded(moduleId: string, res: BuilderResource) {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, resources: [...m.resources, res] } : m));
    showToast("Lección añadida.");
  }

  function handleResourceDeleted(moduleId: string, resourceId: string) {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, resources: m.resources.filter(r => r.id !== resourceId) } : m));
    showToast("Lección eliminada.");
  }

  const showConfig = true;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      {/* Desktop sidebar — hidden when embedded inside TeacherShell */}
      {!embedded && (
        <aside className="hidden w-52 shrink-0 border-r border-[rgba(22,60,88,0.08)] bg-white lg:flex lg:flex-col">
          <BuilderSidebar onAddModule={() => setShowAddModule(true)} />
        </aside>
      )}

      {/* Mobile sidebar overlay — hidden when embedded */}
      {!embedded && mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button aria-label="Cerrar menú" className="absolute inset-0 bg-[rgba(15,23,32,0.45)] backdrop-blur-sm" onClick={() => setMobileOpen(false)} type="button" />
          <aside className="relative z-10 w-52 flex-col bg-white shadow-2xl">
            <BuilderSidebar onAddModule={() => { setShowAddModule(true); setMobileOpen(false); }} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Right side */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <BuilderTopbar course={course} status={status} onMobileMenuOpen={() => setMobileOpen(true)} embedded={embedded} />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto" style={{ backgroundImage: "radial-gradient(circle, rgba(22,60,88,0.08) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
            <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
              <h1 className="mb-7 text-[2rem] font-bold tracking-[-0.03em] text-[var(--color-ink)] sm:text-[2.4rem]">{course.title}</h1>
              <div className="space-y-4">
                {modules.map((mod, i) => (
                  <ModuleCard key={mod.id} module={mod} courseId={course.id}
                    isFirst={i === 0} isLast={i === modules.length - 1}
                    onDelete={handleDeleteModule} onEdit={setEditModule}
                    onMove={handleMoveModule}
                    onResourceAdded={handleResourceAdded}
                    onResourceDeleted={handleResourceDeleted} />
                ))}
                <button type="button" onClick={() => setShowAddModule(true)}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgba(22,60,88,0.15)] py-10 transition hover:border-[var(--color-primary)] hover:bg-[rgba(22,60,88,0.018)]">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-[rgba(22,60,88,0.15)] bg-white text-[var(--color-muted)]">
                    <Plus className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-muted)]">Añadir Nuevo Módulo</span>
                </button>
              </div>
            </div>
          </main>

          {showConfig && (
            <div className="hidden w-[22rem] shrink-0 xl:flex xl:flex-col">
              <ConfigPanel course={{ ...course, category }} status={status} onStatusChange={handleStatusChange} onCategoryChange={handleCategoryChange} disabled={saving} />
            </div>
          )}
        </div>

        {/* Config panel tablet */}
        {showConfig && (
          <div className="border-t border-[rgba(22,60,88,0.08)] xl:hidden">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between bg-white px-5 py-4 text-sm font-semibold text-[var(--color-ink)] select-none">
                Configuración del Curso
                <ChevronDown className="h-4 w-4 text-[var(--color-muted)] transition group-open:rotate-180" />
              </summary>
              <div className="max-h-[60vh] overflow-y-auto">
                <ConfigPanel course={{ ...course, category }} status={status} onStatusChange={handleStatusChange} onCategoryChange={handleCategoryChange} disabled={saving} />
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showAddModule && (
        <ModuleDialog courseId={course.id} onClose={(mod) => { setShowAddModule(false); if (mod) handleModuleAdded(mod); }} />
      )}
      {editModule && (
        <ModuleDialog courseId={course.id} editModule={editModule} onClose={(mod) => { if (mod) handleModuleEdited(mod); else setEditModule(null); }} />
      )}
      {deleteModuleId && (
        <ConfirmDialog
          title="Eliminar módulo"
          desc="Se eliminarán el módulo y todas sus lecciones. Esta acción no se puede deshacer."
          onConfirm={confirmDeleteModule}
          onCancel={() => setDeleteModuleId(null)}
          loading={deletePending}
        />
      )}

      {toast && <Toast msg={toast.msg} kind={toast.kind} onDismiss={() => setToast(null)} />}
    </div>
  );
}
