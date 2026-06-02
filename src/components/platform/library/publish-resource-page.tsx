"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Film,
  Globe,
  GraduationCap,
  Link2,
  Loader2,
  Presentation,
  Upload,
  Users,
  X,
} from "lucide-react";
import type {
  LibraryResourceCategory,
  LibraryVisibility,
} from "@prisma/client";
import {
  publishResourceAction,
  type PublishResourceActionState,
} from "@/actions/library";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CLIENT_SIZE = 50 * 1024 * 1024; // 50 MB

const ACCEPTED_MIME = [
  "application/pdf",
  "video/mp4",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
] as const;

const ACCEPTED_EXTENSIONS = ".pdf,.mp4,.doc,.docx,.ppt,.pptx";

const CATEGORY_OPTIONS: Array<{ value: LibraryResourceCategory; label: string }> = [
  { value: "GUIDE", label: "Guías" },
  { value: "TEMPLATE", label: "Plantillas" },
  { value: "WEBINAR", label: "Webinars" },
  { value: "CASE_STUDY", label: "Casos prácticos" },
  { value: "MATERIAL", label: "Materiales educativos" },
  { value: "FAMILY_RESOURCE", label: "Recursos para familias" },
  { value: "PROFESSIONAL_RESOURCE", label: "Recursos profesionales" },
  { value: "OTHER", label: "Otros" },
];

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "Todos los usuarios" },
  { value: "STUDENTS", label: "Alumnos" },
  { value: "FAMILIES", label: "Familias y cuidadores" },
  { value: "PROFESSIONALS", label: "Profesionales / Docentes" },
];

const VISIBILITY_OPTIONS: Array<{
  value: LibraryVisibility;
  label: string;
  desc: string;
  Icon: React.ElementType;
}> = [
  {
    value: "PUBLIC",
    label: "Público",
    desc: "Visible para todos los usuarios de la plataforma.",
    Icon: Globe,
  },
  {
    value: "ENROLLED_STUDENTS",
    label: "Solo Alumnos y Familias",
    desc: "Restringido a perfiles de pacientes.",
    Icon: Users,
  },
  {
    value: "TEACHERS_ONLY",
    label: "Solo Profesionales",
    desc: "Material exclusivo para docentes y equipo clínico.",
    Icon: GraduationCap,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileConfig(mimeType: string) {
  if (mimeType === "application/pdf")
    return { Icon: FileText, color: "text-red-500", bg: "bg-red-50", label: "PDF" };
  if (mimeType.startsWith("video/"))
    return { Icon: Film, color: "text-emerald-600", bg: "bg-emerald-50", label: "MP4" };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return { Icon: Presentation, color: "text-amber-600", bg: "bg-amber-50", label: "PPTX" };
  if (mimeType.includes("word") || mimeType.includes("document"))
    return { Icon: FileText, color: "text-sky-600", bg: "bg-sky-50", label: "DOCX" };
  return { Icon: Upload, color: "text-gray-500", bg: "bg-gray-50", label: "FILE" };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type PublishResourcePageCourse = { id: string; title: string };

type Props = {
  backHref: string;
  courses: PublishResourcePageCourse[];
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  kind,
  msg,
  onDismiss,
}: {
  kind: "success" | "error";
  msg: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl",
        kind === "success"
          ? "bg-[var(--color-success,#17624f)] text-white"
          : "bg-[var(--color-danger,#9f452e)] text-white",
      )}
    >
      {kind === "success" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      ) : (
        <X className="h-5 w-5 shrink-0" />
      )}
      <span className="text-sm font-medium">{msg}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

function FileDropzone({
  file,
  onFile,
  onClear,
  fileError,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  fileError: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  if (file) {
    const { Icon, bg, color, label } = getFileConfig(file.type);
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
            bg,
          )}
        >
          <Icon className={cn("h-7 w-7", color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
            {file.name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            {label} · {formatBytes(file.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          title="Quitar archivo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition",
          dragging
            ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
            : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface)]",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {/* File type icons */}
        <div className="flex items-center gap-3">
          {[
            { Icon: FileText, color: "text-red-400", label: "PDF" },
            { Icon: Film, color: "text-emerald-500", label: "MP4" },
            { Icon: FileText, color: "text-sky-500", label: "DOCX" },
            { Icon: Presentation, color: "text-amber-500", label: "PPTX" },
            { Icon: Link2, color: "text-purple-500", label: "URL" },
          ].map(({ Icon, color, label }) => (
            <div
              key={label}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white shadow-sm"
            >
              <Icon className={cn("h-5 w-5", color)} />
            </div>
          ))}
        </div>

        <div>
          <p className="text-base font-semibold text-[var(--color-ink)]">
            Arrastra tu archivo aquí
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            PDF, MP4, DOCX o PPTX · Máx. 50 MB
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Explorar archivos
        </button>
      </div>

      {fileError && (
        <p className="mt-2 text-sm text-[var(--color-danger,#9f452e)]">
          {fileError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        name="file"
        className="sr-only"
        accept={ACCEPTED_EXTENSIONS}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

// ─── Preview Card ─────────────────────────────────────────────────────────────

function PreviewCard({
  mode,
  file,
  externalUrl,
  title,
  category,
  audience,
}: {
  mode: "file" | "link";
  file: File | null;
  externalUrl: string;
  title: string;
  category: string;
  audience: string;
}) {
  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "Categoría";
  const audienceLabel =
    AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label ?? "Audiencia";

  if (!file && mode === "file") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[var(--color-ink-soft)] shadow-sm">
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-xs text-[var(--color-ink-soft)]">
          La vista previa se generará al subir un archivo válido.
        </p>
      </div>
    );
  }

  if (mode === "link") {
    let hostname = "";
    try {
      hostname = externalUrl ? new URL(externalUrl).hostname : "";
    } catch {
      hostname = externalUrl;
    }

    return (
      <div className="rounded-xl bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
            <Globe className="h-5 w-5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
              {title || "Título del recurso..."}
            </p>
            <p className="truncate text-xs text-[var(--color-ink-soft)]">
              {hostname || "enlace externo"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.65rem] font-medium text-[var(--color-ink-soft)] shadow-sm">
            {categoryLabel}
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.65rem] font-medium text-[var(--color-ink-soft)] shadow-sm">
            {audienceLabel}
          </span>
        </div>
      </div>
    );
  }

  // File preview
  const { Icon, bg, color, label } = getFileConfig(file!.type);
  return (
    <div className="rounded-xl bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            bg,
          )}
        >
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
            {title || file!.name}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {label} · {formatBytes(file!.size)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.65rem] font-medium text-[var(--color-ink-soft)] shadow-sm">
          {categoryLabel}
        </span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.65rem] font-medium text-[var(--color-ink-soft)] shadow-sm">
          {audienceLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublishResourcePage({ backHref, courses }: Props) {
  const router = useRouter();
  const [state, formAction, pending] =
    useActionState<PublishResourceActionState, FormData>(
      publishResourceAction,
      {},
    );

  // Form state
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [visibility, setVisibility] = useState<LibraryVisibility>("PUBLIC");
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  // Track dirty state
  useEffect(() => {
    if (file || externalUrl || title || description || category || audience) {
      setIsDirty(true);
    }
  }, [file, externalUrl, title, description, category, audience]);

  // Handle server response
  useEffect(() => {
    if (state.success) {
      setToast({ kind: "success", msg: "Recurso guardado correctamente." });
      const timer = setTimeout(() => router.push(backHref), 1200);
      return () => clearTimeout(timer);
    }
    if (state.error) {
      setToast({ kind: "error", msg: state.error });
    }
  }, [state, router, backHref]);

  const handleFileSelect = useCallback((f: File) => {
    if (!ACCEPTED_MIME.includes(f.type as (typeof ACCEPTED_MIME)[number])) {
      setFileError("Tipo de archivo no permitido. Usa PDF, MP4, DOCX o PPTX.");
      return;
    }
    if (f.size > MAX_CLIENT_SIZE) {
      setFileError(`El archivo supera el tamaño máximo de 50 MB.`);
      return;
    }
    setFileError(null);
    setFile(f);
  }, []);

  const handleCancel = useCallback(() => {
    if (
      isDirty &&
      !window.confirm(
        "¿Descartar los cambios? Los datos introducidos se perderán.",
      )
    )
      return;
    router.push(backHref);
  }, [isDirty, router, backHref]);

  // Publish button enabled check
  const hasContent =
    mode === "file" ? file !== null : externalUrl.trim().length > 0;
  const canPublish = hasContent && title.trim().length >= 2 && !!category && !!visibility;
  const canDraft = title.trim().length >= 2 || hasContent;

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas,#f4f5f7)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
              Publicar Nuevo Recurso
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
              Sube material educativo, plantillas clínicas o enlaces de interés.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </div>

      {/* Body */}
      <form
        action={formAction}
        className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8"
      >
        {/* Hidden fields */}
        <input type="hidden" name="uploadMode" value={mode} />
        <input type="hidden" name="visibility" value={visibility} />

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {/* Mode tabs */}
            <div className="flex gap-2 rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
                  mode === "file"
                    ? "bg-[var(--color-primary)] text-white shadow"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
                )}
              >
                <Upload className="h-4 w-4" />
                Subir archivo
              </button>
              <button
                type="button"
                onClick={() => setMode("link")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
                  mode === "link"
                    ? "bg-[var(--color-primary)] text-white shadow"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
                )}
              >
                <Link2 className="h-4 w-4" />
                Enlace externo
              </button>
            </div>

            {/* Upload area */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              {mode === "file" ? (
                <FileDropzone
                  file={file}
                  onFile={handleFileSelect}
                  onClear={() => setFile(null)}
                  fileError={fileError}
                />
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                    URL del recurso externo
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                    <Globe className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" />
                    <input
                      type="url"
                      name="externalUrl"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://ejemplo.com/recurso"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]/60"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-ink-soft)]">
                    Introduce un enlace externo válido (http o https).
                  </p>
                  {/* Hidden file input to satisfy form shape when not in file mode */}
                  <input type="file" name="file" className="sr-only" tabIndex={-1} />
                </div>
              )}
            </div>

            {/* Details form */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-[var(--color-ink)]">
                Detalles del Recurso
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="pub-title"
                    className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
                  >
                    Título del recurso{" "}
                    <span className="text-[var(--color-danger,#9f452e)]">*</span>
                  </label>
                  <input
                    id="pub-title"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Guía de anticipación visual para rutinas"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-soft)]/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="pub-desc"
                    className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
                  >
                    Descripción breve
                  </label>
                  <textarea
                    id="pub-desc"
                    name="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el propósito y uso recomendado de este material..."
                    className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-soft)]/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  />
                </div>

                {/* Category + Audience */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pub-category"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
                    >
                      Categoría Temática
                    </label>
                    <select
                      id="pub-category"
                      name="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pub-audience"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
                    >
                      Público Objetivo
                    </label>
                    <select
                      id="pub-audience"
                      name="audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                    >
                      <option value="">Seleccionar audiencia...</option>
                      {AUDIENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course (optional) */}
                {courses.length > 0 && (
                  <div>
                    <label
                      htmlFor="pub-course"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
                    >
                      Curso asociado{" "}
                      <span className="text-[var(--color-ink-soft)] font-normal">
                        (opcional)
                      </span>
                    </label>
                    <select
                      id="pub-course"
                      name="courseId"
                      className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                    >
                      <option value="">Sin curso específico</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────────── */}
          <div className="flex w-full flex-col gap-6 lg:w-[300px] lg:shrink-0">
            {/* Visibility card */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--color-ink)]">
                <span className="text-lg">👁</span> Visibilidad
              </h2>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const isSelected = visibility === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                            : "border-[var(--color-border)]",
                        )}
                      >
                        {isSelected && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isSelected
                              ? "text-[var(--color-primary)]"
                              : "text-[var(--color-ink)]",
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview card */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-[var(--color-ink)]">
                Vista Previa
              </h2>
              <PreviewCard
                mode={mode}
                file={file}
                externalUrl={externalUrl}
                title={title}
                category={category}
                audience={audience}
              />
              {(title || file) && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {title || "Título del recurso..."}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {category && (
                      <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[0.65rem] text-[var(--color-ink-soft)]">
                        {CATEGORY_OPTIONS.find((c) => c.value === category)
                          ?.label ?? category}
                      </span>
                    )}
                    {audience && (
                      <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[0.65rem] text-[var(--color-ink-soft)]">
                        {AUDIENCE_OPTIONS.find((a) => a.value === audience)
                          ?.label ?? audience}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {state.error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                name="action"
                value="publish"
                disabled={pending || !canPublish}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition",
                  canPublish && !pending
                    ? "bg-[var(--color-primary)] hover:-translate-y-px hover:shadow-lg"
                    : "cursor-not-allowed bg-[var(--color-primary)]/40",
                )}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Publicar Recurso
              </button>

              <button
                type="submit"
                name="action"
                value="draft"
                disabled={pending || !canDraft}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition",
                  canDraft && !pending
                    ? "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
                    : "cursor-not-allowed border-[var(--color-border)] bg-white text-[var(--color-ink-soft)]/50",
                )}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-base leading-none">💾</span>
                )}
                Guardar como Borrador
              </button>
            </div>
          </div>
        </div>
      </form>

      {toast && (
        <Toast
          kind={toast.kind}
          msg={toast.msg}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
