"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Brain,
  ChevronDown,
  Eye,
  FileText,
  Film,
  FolderOpen,
  GraduationCap,
  Home,
  ImageIcon,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Save,
  Send,
  Settings,
  Upload,
  Users2,
  X,
} from "lucide-react";
import type { LibraryResourceCategory, LibraryVisibility } from "@prisma/client";
import {
  publishResourceAction,
  type PublishResourceActionState,
} from "@/actions/library";
import { logoutAction } from "@/actions/session";
import { cn } from "@/lib/utils";

// ─── Design tokens (Serene Institutional Excellence) ─────────────────────────
// primary:                 #022448
// secondary-container:     #adf0df  (active nav bg)
// on-secondary-container:  #2c6f62  (active nav text)
// surface:                 #f9f9ff  (page bg)
// surface-container-low:   #f0f3ff  (sidebar bg)
// surface-container:       #e7eeff  (preview inner)
// surface-container-high:  #dee8ff  (icon bg, button bg)
// surface-container-highest:#d8e3fa
// surface-container-lowest:#ffffff  (cards)
// primary-fixed:           #d5e3ff  (active radio bg)
// on-surface:              #111c2c
// on-surface-variant:      #43474e
// outline-variant:         #c4c6cf

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CLIENT_SIZE = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ".pdf,.mp4,.doc,.docx,.ppt,.pptx";
const ACCEPTED_MIME = [
  "application/pdf",
  "video/mp4",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
] as const;

const CATEGORY_OPTIONS: Array<{ value: LibraryResourceCategory; label: string }> = [
  { value: "GUIDE", label: "Comunicación Aumentativa" },
  { value: "TEMPLATE", label: "Estructuración de Rutinas" },
  { value: "MATERIAL", label: "Integración Sensorial" },
  { value: "CASE_STUDY", label: "Habilidades Sociales" },
  { value: "WEBINAR", label: "Webinars y Formación" },
  { value: "FAMILY_RESOURCE", label: "Recursos para Familias" },
  { value: "PROFESSIONAL_RESOURCE", label: "Recursos Profesionales" },
  { value: "OTHER", label: "Otros" },
];

const AUDIENCE_OPTIONS = [
  { value: "FAMILIES", label: "Familias y Cuidadores" },
  { value: "PROFESSIONALS", label: "Docentes y Educadores" },
  { value: "STUDENTS", label: "Alumnos" },
  { value: "ALL", label: "Público General" },
];

const VISIBILITY_OPTIONS: Array<{
  value: LibraryVisibility;
  label: string;
  desc: string;
}> = [
  { value: "PUBLIC", label: "Público", desc: "Visible para todos los usuarios de la plataforma." },
  { value: "ENROLLED_STUDENTS", label: "Solo Alumnos y Familias", desc: "Restringido a perfiles de pacientes." },
  { value: "TEACHERS_ONLY", label: "Solo Profesionales", desc: "Material exclusivo para docentes y equipo clínico." },
];

const SIDEBAR_NAV = [
  { label: "Inicio", href: "/mis-cursos", Icon: Home },
  { label: "Cursos", href: "/mis-cursos", Icon: GraduationCap },
  { label: "Pacientes", href: "#", Icon: Users2 },
  { label: "Recursos", href: "/docente/biblioteca", Icon: FolderOpen, active: true },
  { label: "Comunidad", href: "#", Icon: MessageSquare },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileMeta(mime: string): { label: string; color: string } {
  if (mime === "application/pdf") return { label: "PDF", color: "text-red-600" };
  if (mime.startsWith("video/")) return { label: "MP4", color: "text-blue-600" };
  if (mime.includes("presentation") || mime.includes("powerpoint")) return { label: "PPTX", color: "text-orange-600" };
  if (mime.includes("word") || mime.includes("document")) return { label: "DOCX", color: "text-sky-600" };
  return { label: "FILE", color: "text-gray-500" };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type PublishResourcePageCourse = { id: string; title: string };

type Props = {
  backHref: string;
  courses: PublishResourcePageCourse[];
  preselectedCourseId?: string | null;
  /** When true renders own sidebar/shell (docente route). When false, just inner content (admin). */
  standalone?: boolean;
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[#f0f3ff]">
      {/* Brand */}
      <div className="mb-8 px-4 pt-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--color-primary)] leading-tight">Campus Autismo</p>
          <p className="text-xs text-[#43474e] mt-0.5">Panel Profesional</p>
        </div>
      </div>

      {/* Main nav */}
      <ul className="flex flex-col gap-1 px-3 flex-grow">
        {SIDEBAR_NAV.map(({ label, href, Icon, active }) => (
          <li key={label}>
            <Link
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-[#adf0df] text-[#2c6f62] font-semibold"
                  : "text-[#43474e] hover:bg-[#dee8ff]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <ul className="flex flex-col gap-1 px-3 pb-4 pt-4 border-t border-[#c4c6cf] mt-auto">
        <li>
          <Link href="/mi-cuenta" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#43474e] hover:bg-[#dee8ff] transition-all">
            <Settings className="h-5 w-5 shrink-0" strokeWidth={2} />
            Ajustes
          </Link>
        </li>
        <li>
          <form action={logoutAction}>
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#43474e] hover:bg-[#dee8ff] transition-all">
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
              Cerrar Sesión
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublishResourcePage({
  backHref,
  courses,
  preselectedCourseId,
  standalone = false,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PublishResourceActionState, FormData>(
    publishResourceAction,
    {},
  );

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [visibility, setVisibility] = useState<LibraryVisibility>("PUBLIC");
  const [isDirty, setIsDirty] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const mode: "file" | "link" = showLinkInput && externalUrl.trim() ? "link" : "file";

  useEffect(() => {
    if (file || externalUrl || title) setIsDirty(true);
  }, [file, externalUrl, title]);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => router.push(backHref), 900);
    }
  }, [state.success, router, backHref]);

  const handleFileSelect = useCallback((f: File) => {
    if (!ACCEPTED_MIME.includes(f.type as (typeof ACCEPTED_MIME)[number])) {
      setFileError("Tipo no permitido. Usa PDF, MP4, DOCX o PPTX.");
      return;
    }
    if (f.size > MAX_CLIENT_SIZE) {
      setFileError("El archivo supera el límite de 50 MB.");
      return;
    }
    setFileError(null);
    setFile(f);
    setShowLinkInput(false);
    setExternalUrl("");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("¿Descartar los cambios?")) return;
    router.push(backHref);
  }, [isDirty, router, backHref]);

  const hasContent = mode === "file" ? !!file : externalUrl.trim().length > 0;
  const canPublish = hasContent && title.trim().length >= 2 && !!visibility;
  const canDraft = title.trim().length >= 2 || hasContent;

  // ── File meta for preview ──────────────────────────────────────────────────
  const fileMeta = file ? getFileMeta(file.type) : null;

  // ── Inner form content ─────────────────────────────────────────────────────
  const formContent = (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex flex-col gap-8 pb-12 pt-4 md:pt-8">

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-[2rem] font-semibold text-[#111c2c] tracking-tight">
            Publicar Nuevo Recurso
          </h2>
          <p className="text-sm text-[#43474e] mt-1">
            Sube material educativo, plantillas clínicas o enlaces de interés.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-medium hover:bg-[#f0f3ff] transition-colors w-full md:w-auto"
        >
          <X className="h-[18px] w-[18px]" />
          Cancelar
        </button>
      </div>

      {/* 2. Bento Grid */}
      <form action={formAction}>
        {/* Hidden fields */}
        <input type="hidden" name="uploadMode" value={mode} />
        <input type="hidden" name="visibility" value={visibility} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Left column (col-span-2) ──────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Dropzone */}
            <div
              className={cn(
                "bg-white border-2 border-dashed rounded-xl p-8 md:p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                dragging
                  ? "border-[var(--color-primary)] bg-[#f0f3ff]"
                  : file
                    ? "border-[var(--color-primary)] bg-[#f0f3ff]"
                    : "border-[#c4c6cf] hover:border-[var(--color-primary)] hover:bg-[#f0f3ff]",
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current?.click()}
            >
              {file ? (
                /* File selected state */
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#dee8ff]">
                    <FileText className={cn("h-7 w-7", fileMeta?.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111c2c]">{file.name}</p>
                    <p className="text-xs text-[#43474e] mt-0.5">
                      {fileMeta?.label} · {formatBytes(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="flex items-center gap-1.5 text-xs text-[#43474e] hover:text-[var(--color-primary)] transition-colors mt-1"
                  >
                    <X className="h-3.5 w-3.5" /> Quitar archivo
                  </button>
                </div>
              ) : (
                /* Default empty state */
                <>
                  {/* File type icons row */}
                  <div className="flex gap-4 mb-6 text-[#43474e] group-hover:text-[var(--color-primary)] transition-colors">
                    {[
                      { Icon: FileText, title: "PDF" },
                      { Icon: Film, title: "MP4" },
                      { Icon: FileText, title: "DOCX" },
                      { Icon: Link2, title: "URL" },
                    ].map(({ Icon, title }) => (
                      <div
                        key={title}
                        className="p-3 bg-[#d8e3fa] rounded-lg"
                        style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
                      >
                        <Icon className="h-7 w-7" strokeWidth={1.5} />
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xl font-semibold text-[#111c2c] mb-2">
                    Arrastra tu archivo aquí
                  </h3>
                  <p className="text-sm text-[#43474e] mb-6">
                    PDF, MP4, DOCX o inserta un enlace externo. (Máx. 50MB)
                  </p>

                  {/* Explore button */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-[#dee8ff] text-[#111c2c] text-sm font-medium border border-[#c4c6cf] hover:bg-[#d5e3ff] transition-colors"
                    >
                      Explorar archivos
                    </button>
                  </div>
                </>
              )}

              {/* Hidden file input */}
              <input
                ref={inputRef}
                type="file"
                name="file"
                className="sr-only"
                accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>

            {/* File error */}
            {fileError && (
              <p className="text-sm text-red-600 -mt-2">{fileError}</p>
            )}

            {/* Link input (integrated, not tabs) */}
            {!file && (
              <div className="flex flex-col gap-2">
                {!showLinkInput ? (
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className="text-sm text-[#43474e] hover:text-[var(--color-primary)] transition-colors self-center flex items-center gap-1.5"
                  >
                    <Link2 className="h-4 w-4" />
                    O pegar un enlace externo
                  </button>
                ) : (
                  <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#111c2c] flex items-center gap-2">
                        <Link2 className="h-4 w-4" /> Enlace externo
                      </label>
                      <button type="button" onClick={() => { setShowLinkInput(false); setExternalUrl(""); }} className="text-[#43474e] hover:text-[var(--color-primary)]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="url"
                      name="externalUrl"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://ejemplo.com/recurso"
                      className="w-full bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent transition-all placeholder:text-[#43474e]/50"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Details card */}
            <div
              className="bg-white border border-[#c4c6cf] rounded-xl p-6 md:p-8"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
            >
              <h3 className="text-xl font-semibold text-[#111c2c] mb-6">
                Detalles del Recurso
              </h3>

              <div className="flex flex-col gap-6">
                {/* Título */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="pub-title" className="text-sm font-medium text-[#111c2c]">
                    Título del recurso *
                  </label>
                  <input
                    id="pub-title"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Guía de anticipación visual para rutinas"
                    className="w-full bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent transition-all placeholder:text-[#43474e]/50"
                  />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="pub-desc" className="text-sm font-medium text-[#111c2c]">
                    Descripción breve
                  </label>
                  <textarea
                    id="pub-desc"
                    name="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el propósito y uso recomendado de este material..."
                    className="w-full bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent transition-all placeholder:text-[#43474e]/50 resize-none"
                  />
                </div>

                {/* Categoría + Público */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pub-category" className="text-sm font-medium text-[#111c2c]">
                      Categoría Temática
                    </label>
                    <div className="relative">
                      <select
                        id="pub-category"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 pr-10 text-sm text-[#111c2c] appearance-none focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent cursor-pointer"
                      >
                        <option value="" disabled>Seleccionar categoría...</option>
                        {CATEGORY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#43474e]" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="pub-audience" className="text-sm font-medium text-[#111c2c]">
                      Público Objetivo
                    </label>
                    <div className="relative">
                      <select
                        id="pub-audience"
                        name="audience"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 pr-10 text-sm text-[#111c2c] appearance-none focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent cursor-pointer"
                      >
                        <option value="" disabled>Seleccionar audiencia...</option>
                        {AUDIENCE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#43474e]" />
                    </div>
                  </div>
                </div>

                {/* Course (optional) */}
                {courses.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pub-course" className="text-sm font-medium text-[#111c2c]">
                      Curso asociado{" "}
                      <span className="font-normal text-[#43474e]">(opcional)</span>
                    </label>
                    {preselectedCourseId && courses.length === 1 ? (
                      <>
                        <input type="hidden" name="courseId" value={preselectedCourseId} />
                        <p className="bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#111c2c]">
                          {courses.find((c) => c.id === preselectedCourseId)?.title ?? "Curso actual"}
                        </p>
                      </>
                    ) : (
                      <div className="relative">
                        <select
                          id="pub-course"
                          name="courseId"
                          defaultValue={preselectedCourseId ?? ""}
                          className="w-full bg-[#f9f9ff] border border-[#c4c6cf] rounded-lg p-3 pr-10 text-sm text-[#111c2c] appearance-none focus:outline-none focus:ring-2 focus:ring-[#022448] focus:border-transparent cursor-pointer"
                        >
                          <option value="">Sin curso específico</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#43474e]" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Visibilidad card */}
            <div
              className="bg-white border border-[#c4c6cf] rounded-xl p-6"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
            >
              <h3 className="text-lg font-semibold text-[#111c2c] mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2} />
                Visibilidad
              </h3>
              <div className="flex flex-col gap-3">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const isActive = visibility === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isActive
                          ? "bg-[#d5e3ff] border-[var(--color-primary)]"
                          : "border-[#c4c6cf] hover:bg-[#f0f3ff]",
                      )}
                    >
                      <input
                        type="radio"
                        name="_visibility_ui"
                        value={opt.value}
                        checked={isActive}
                        onChange={() => setVisibility(opt.value)}
                        className="sr-only"
                      />
                      {/* Custom radio */}
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isActive ? "border-[var(--color-primary)]" : "border-[#c4c6cf]",
                      )}>
                        {isActive && (
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-[var(--color-primary)]" : "text-[#111c2c]",
                        )}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-[#43474e] mt-0.5">{opt.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Vista Previa card */}
            <div
              className="bg-white border border-[#c4c6cf] rounded-xl p-6"
              style={{ boxShadow: "0px 4px 12px rgba(30,58,95,0.05)" }}
            >
              <h3 className="text-lg font-semibold text-[#111c2c] mb-4">Vista Previa</h3>

              {/* Preview area */}
              <div className="bg-[#e7eeff] border border-[#c4c6cf] rounded-lg p-4 flex flex-col items-center justify-center text-center min-h-[160px]">
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                      <FileText className={cn("h-6 w-6", fileMeta?.color)} />
                    </div>
                    <p className="text-xs font-medium text-[#111c2c] truncate max-w-[140px]">{file.name}</p>
                    <p className="text-[0.65rem] text-[#43474e]">{fileMeta?.label} · {formatBytes(file.size)}</p>
                  </div>
                ) : externalUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                      <Link2 className="h-6 w-6 text-[var(--color-primary)]" />
                    </div>
                    <p className="text-xs text-[#43474e] truncate max-w-[150px]">
                      {(() => { try { return new URL(externalUrl).hostname; } catch { return externalUrl; } })()}
                    </p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-[#43474e] mb-2 opacity-50" />
                    <p className="text-sm text-[#43474e]">La vista previa se generará al subir un archivo válido.</p>
                  </>
                )}
              </div>

              {/* Meta tags */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#111c2c] truncate">
                  {title || "Título del recurso..."}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="px-2 py-1 rounded-full bg-[#dee8ff] text-[#43474e] text-xs">
                    {category
                      ? CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "Categoría"
                      : "Categoría"}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-[#dee8ff] text-[#43474e] text-xs">
                    {audience
                      ? AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label ?? "Audiencia"
                      : "Audiencia"}
                  </span>
                </div>
              </div>
            </div>

            {/* Server error */}
            {state.error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            {/* Success */}
            {state.success && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <span>✓</span> Recurso guardado. Redirigiendo...
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="submit"
                name="action"
                value="publish"
                disabled={pending}
                className="w-full bg-[var(--color-primary)] text-white text-sm font-medium py-3 px-6 rounded-lg hover:bg-[var(--color-primary-strong)] transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
              >
                {pending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Send className="h-[18px] w-[18px]" />}
                Publicar Recurso
              </button>
              <button
                type="submit"
                name="action"
                value="draft"
                disabled={pending}
                className="w-full bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-medium py-3 px-6 rounded-lg hover:bg-[#f0f3ff] transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Save className="h-[18px] w-[18px]" />}
                Guardar como Borrador
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  // ── Standalone (docente) shell ─────────────────────────────────────────────
  if (standalone) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f9f9ff]">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-50 border-r border-[#c4c6cf]">
          <Sidebar />
        </nav>

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileNavOpen(false)}
              type="button"
            />
            <nav className="relative z-10 w-64 h-full shadow-2xl">
              <Sidebar onClose={() => setMobileNavOpen(false)} />
            </nav>
          </div>
        )}

        {/* Mobile topbar */}
        <header className="md:hidden flex justify-between items-center w-full px-4 h-16 fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#c4c6cf]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-[var(--color-primary)]">Campus Autismo</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-lg text-[var(--color-primary)] hover:bg-[#f0f3ff] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 md:ml-64 h-full overflow-y-auto bg-[#f9f9ff] pt-16 md:pt-0">
          {formContent}
        </main>
      </div>
    );
  }

  // ── Embedded (admin, inside AdminShell) ────────────────────────────────────
  return formContent;
}
