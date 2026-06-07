"use client";

import { useActionState, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  File,
  FileText,
  Link2,
  Loader2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { addCourseResourceAction, type AddResourceResult } from "@/actions/course-builder";
import { cn } from "@/lib/utils";

type Props = {
  courseId: string;
  courseSlug: string;
  moduleId: string | null;
  moduleTitle: string | null;
  backHref: string;
  redirectTo: string;
};

type ResourceType = "MATERIAL" | "EXERCISE";
type SourceType = "FILE" | "LINK";

const INITIAL_STATE: AddResourceResult = {};

export function NuevoRecursoForm({
  courseId,
  moduleId,
  moduleTitle,
  backHref,
  redirectTo,
}: Props) {
  const [publishState, publishAction, publishPending] = useActionState(
    addCourseResourceAction,
    INITIAL_STATE,
  );
  const [draftState, draftAction, draftPending] = useActionState(
    addCourseResourceAction,
    INITIAL_STATE,
  );

  const pending = publishPending || draftPending;
  const state = publishState.error ? publishState : draftState;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("MATERIAL");
  const [sourceType, setSourceType] = useState<SourceType>("FILE");
  const [linkUrl, setLinkUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    setSourceType("FILE");
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function getFileIcon(file: File | null) {
    if (!file) return <Upload className="h-8 w-8 text-[var(--color-muted)]" />;
    if (file.type.startsWith("video/")) return <Video className="h-8 w-8 text-[var(--color-primary)]" />;
    if (file.type === "application/pdf") return <FileText className="h-8 w-8 text-[var(--color-danger)]" />;
    return <File className="h-8 w-8 text-[var(--color-ink-muted)]" />;
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const previewTitle = title || "Título del recurso...";
  const previewCategory = resourceType === "EXERCISE" ? "Tarea" : "Material";

  const uploadZone = (
    <div
      className={cn(
        "flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition cursor-pointer",
        dragOver ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#9ca3af]",
        selectedFile && "border-[var(--color-success)] bg-[var(--color-success-soft)]",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      {selectedFile ? (
        <div className="text-center">
          {getFileIcon(selectedFile)}
          <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">{selectedFile.name}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{formatBytes(selectedFile.size)}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              if (draftFileInputRef.current) draftFileInputRef.current.value = "";
            }}
            className="mt-3 text-xs text-[var(--color-danger)] hover:underline"
          >
            Quitar archivo
          </button>
        </div>
      ) : (
        <div className="text-center px-6">
          <div className="flex justify-center gap-3 mb-4 text-[var(--color-muted)]">
            <FileText className="h-8 w-8" />
            <Video className="h-8 w-8" />
            <File className="h-8 w-8" />
            <Link2 className="h-8 w-8" />
          </div>
          <p className="text-[0.95rem] font-semibold text-[var(--color-ink-soft)]">Arrastra tu archivo aquí</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            PDF, MP4, DOCX o inserta un enlace externo.{" "}
            <span className="font-medium">(Máx. 50MB)</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] shadow-sm transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            Explorar archivos
          </button>
        </div>
      )}
    </div>
  );

  const isSubmitDisabled = pending || (sourceType === "FILE" && !selectedFile);

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Page header */}
      <div className="border-b border-[var(--color-border)] bg-white px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[1.25rem] font-bold text-[var(--color-ink)]">Añadir Recurso</h1>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {moduleTitle
                ? `Módulo: ${moduleTitle}`
                : "Sube material educativo o inserta un enlace externo."}
            </p>
          </div>
          <Link
            href={backHref}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink-muted)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1100px] px-4 py-8 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {/* ── Left column ── */}
          <div className="space-y-5">
            {/* Upload area */}
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-6 py-4">
                {/* Source toggle */}
                <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setSourceType("FILE")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                      sourceType === "FILE"
                        ? "bg-white text-[var(--color-ink)] shadow-sm"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("LINK")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                      sourceType === "LINK"
                        ? "bg-white text-[var(--color-ink)] shadow-sm"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
                    )}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Enlace externo
                  </button>
                </div>
              </div>

              <div className="p-6">
                {sourceType === "FILE" ? (
                  uploadZone
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-ink-soft)]">
                      URL del recurso *
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o cualquier enlace"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />
                    <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                      YouTube, Vimeo, o cualquier URL válida.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del Recurso */}
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-6 py-4">
                <h2 className="text-[0.95rem] font-semibold text-[var(--color-ink)]">
                  Detalles del Recurso
                </h2>
              </div>
              <div className="space-y-5 p-6">
                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
                    Título del recurso <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Guía de anticipación visual para rutinas"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
                    Descripción breve
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el propósito y uso recomendado de este material..."
                    className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--color-ink-soft)]">
                    Tipo de Recurso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          value: "MATERIAL",
                          label: "Material de aprendizaje",
                          desc: "PDF, vídeo, documento de apoyo.",
                        },
                        {
                          value: "EXERCISE",
                          label: "Tarea evaluable",
                          desc: "Requiere entrega del alumno.",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setResourceType(opt.value)}
                        className={cn(
                          "rounded-lg border-2 p-3.5 text-left transition",
                          resourceType === opt.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                            : "border-[var(--color-border)] bg-white hover:border-[#9ca3af]",
                        )}
                      >
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            resourceType === opt.value ? "text-[var(--color-primary)]" : "text-[var(--color-ink-soft)]",
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {state.error && (
              <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {state.error}
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5 lg:sticky lg:top-6">
            {/* Visibilidad — displayed only, actual value comes from form hidden fields */}
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  <h2 className="text-[0.9rem] font-semibold text-[var(--color-ink)]">Visibilidad</h2>
                </div>
              </div>
              <div className="space-y-2 p-4">
                {(
                  [
                    {
                      value: "published",
                      label: "Publicado",
                      desc: "Visible para los alumnos matriculados.",
                    },
                    {
                      value: "draft",
                      label: "Borrador",
                      desc: "Solo visible para ti como docente.",
                    },
                  ] as const
                ).map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "w-full rounded-lg border-2 p-3.5 text-left transition",
                      opt.value === "published"
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-white",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-3.5 w-3.5 rounded-full border-2",
                          opt.value === "published"
                            ? "border-white bg-white"
                            : "border-[#9ca3af] bg-transparent",
                        )}
                      />
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          opt.value === "published" ? "text-white" : "text-[var(--color-ink-soft)]",
                        )}
                      >
                        {opt.label}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "ml-5 mt-0.5 text-xs",
                        opt.value === "published" ? "text-white/75" : "text-[var(--color-ink-muted)]",
                      )}
                    >
                      {opt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vista Previa */}
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-5 py-4">
                <h2 className="text-[0.9rem] font-semibold text-[var(--color-ink)]">Vista Previa</h2>
              </div>
              <div className="p-4">
                <div className="flex h-28 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                  {selectedFile ? (
                    <div className="text-center">
                      {getFileIcon(selectedFile)}
                      <p className="mt-1.5 text-[0.7rem] text-[var(--color-ink-muted)] font-medium">
                        {selectedFile.name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-border)]">
                        <File className="h-5 w-5 text-[var(--color-muted)]" />
                      </div>
                      <p className="mt-2 text-[0.7rem] text-[var(--color-muted)] px-4">
                        La vista previa se generará al subir un archivo válido.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{previewTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--color-ink-muted)]">
                      {previewCategory}
                    </span>
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--color-ink-muted)]">
                      Publicado
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons — two separate forms to guarantee isPublished value */}
            <form action={publishAction}>
              <input type="hidden" name="courseId" value={courseId} />
              {moduleId && <input type="hidden" name="moduleId" value={moduleId} />}
              <input type="hidden" name="type" value={resourceType} />
              <input type="hidden" name="source" value={sourceType} />
              <input type="hidden" name="isPublished" value="true" />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="description" value={description} />
              {sourceType === "LINK" && <input type="hidden" name="linkUrl" value={linkUrl} />}
              {/* File input for publish */}
              <input
                ref={fileInputRef}
                id={fileInputId}
                name="file"
                type="file"
                className="hidden"
                accept=".pdf,.mp4,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--color-primary-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Publicar Recurso
              </button>
            </form>

            <form action={draftAction}>
              <input type="hidden" name="courseId" value={courseId} />
              {moduleId && <input type="hidden" name="moduleId" value={moduleId} />}
              <input type="hidden" name="type" value={resourceType} />
              <input type="hidden" name="source" value={sourceType} />
              <input type="hidden" name="isPublished" value="false" />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="description" value={description} />
              {sourceType === "LINK" && <input type="hidden" name="linkUrl" value={linkUrl} />}
              {/* File input for draft */}
              <input
                ref={draftFileInputRef}
                name="file"
                type="file"
                className="hidden"
                accept=".pdf,.mp4,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <button
                type="submit"
                disabled={pending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink-soft)] shadow-sm transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50"
              >
                {draftPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar como Borrador
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
