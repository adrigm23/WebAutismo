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
    if (!file) return <Upload className="h-8 w-8 text-[#9ca3af]" />;
    if (file.type.startsWith("video/")) return <Video className="h-8 w-8 text-[#3b82f6]" />;
    if (file.type === "application/pdf") return <FileText className="h-8 w-8 text-[#ef4444]" />;
    return <File className="h-8 w-8 text-[#6b7280]" />;
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
        dragOver ? "border-[#3b82f6] bg-[#eff6ff]" : "border-[#d1d5db] bg-[#f9fafb] hover:border-[#9ca3af]",
        selectedFile && "border-[#22c55e] bg-[#f0fdf4]",
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
          <p className="mt-3 text-sm font-semibold text-[#111c2c]">{selectedFile.name}</p>
          <p className="mt-1 text-xs text-[#6b7280]">{formatBytes(selectedFile.size)}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              if (draftFileInputRef.current) draftFileInputRef.current.value = "";
            }}
            className="mt-3 text-xs text-[#ef4444] hover:underline"
          >
            Quitar archivo
          </button>
        </div>
      ) : (
        <div className="text-center px-6">
          <div className="flex justify-center gap-3 mb-4 text-[#9ca3af]">
            <FileText className="h-8 w-8" />
            <Video className="h-8 w-8" />
            <File className="h-8 w-8" />
            <Link2 className="h-8 w-8" />
          </div>
          <p className="text-[0.95rem] font-semibold text-[#374151]">Arrastra tu archivo aquí</p>
          <p className="mt-1 text-sm text-[#6b7280]">
            PDF, MP4, DOCX o inserta un enlace externo.{" "}
            <span className="font-medium">(Máx. 50MB)</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] shadow-sm transition hover:border-[#374151] hover:text-[#111c2c]"
          >
            Explorar archivos
          </button>
        </div>
      )}
    </div>
  );

  const isSubmitDisabled = pending || (sourceType === "FILE" && !selectedFile);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Page header */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111c2c]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[1.25rem] font-bold text-[#111c2c]">Añadir Recurso</h1>
            <p className="text-sm text-[#6b7280]">
              {moduleTitle
                ? `Módulo: ${moduleTitle}`
                : "Sube material educativo o inserta un enlace externo."}
            </p>
          </div>
          <Link
            href={backHref}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#6b7280] transition hover:border-[#374151] hover:text-[#111c2c]"
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
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-6 py-4">
                {/* Source toggle */}
                <div className="flex gap-1 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setSourceType("FILE")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                      sourceType === "FILE"
                        ? "bg-white text-[#111c2c] shadow-sm"
                        : "text-[#6b7280] hover:text-[#111c2c]",
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
                        ? "bg-white text-[#111c2c] shadow-sm"
                        : "text-[#6b7280] hover:text-[#111c2c]",
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
                    <label className="mb-2 block text-sm font-medium text-[#374151]">
                      URL del recurso *
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o cualquier enlace"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#111c2c] placeholder:text-[#9ca3af] focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    />
                    <p className="mt-1.5 text-xs text-[#9ca3af]">
                      YouTube, Vimeo, o cualquier URL válida.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del Recurso */}
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-6 py-4">
                <h2 className="text-[0.95rem] font-semibold text-[#111c2c]">
                  Detalles del Recurso
                </h2>
              </div>
              <div className="space-y-5 p-6">
                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Título del recurso <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Guía de anticipación visual para rutinas"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#111c2c] placeholder:text-[#9ca3af] focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Descripción breve
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el propósito y uso recomendado de este material..."
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#111c2c] placeholder:text-[#9ca3af] focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#374151]">
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
                            ? "border-[#022448] bg-[#f0f4f8]"
                            : "border-[#e5e7eb] bg-white hover:border-[#9ca3af]",
                        )}
                      >
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            resourceType === opt.value ? "text-[#022448]" : "text-[#374151]",
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6b7280]">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {state.error && (
              <div className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#ef4444]">
                {state.error}
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5 lg:sticky lg:top-6">
            {/* Visibilidad — displayed only, actual value comes from form hidden fields */}
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#6b7280]" />
                  <h2 className="text-[0.9rem] font-semibold text-[#111c2c]">Visibilidad</h2>
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
                        ? "border-[#022448] bg-[#022448]"
                        : "border-[#e5e7eb] bg-white",
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
                          opt.value === "published" ? "text-white" : "text-[#374151]",
                        )}
                      >
                        {opt.label}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "ml-5 mt-0.5 text-xs",
                        opt.value === "published" ? "text-white/75" : "text-[#6b7280]",
                      )}
                    >
                      {opt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vista Previa */}
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="border-b border-[#f3f4f6] px-5 py-4">
                <h2 className="text-[0.9rem] font-semibold text-[#111c2c]">Vista Previa</h2>
              </div>
              <div className="p-4">
                <div className="flex h-28 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
                  {selectedFile ? (
                    <div className="text-center">
                      {getFileIcon(selectedFile)}
                      <p className="mt-1.5 text-[0.7rem] text-[#6b7280] font-medium">
                        {selectedFile.name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#e5e7eb]">
                        <File className="h-5 w-5 text-[#9ca3af]" />
                      </div>
                      <p className="mt-2 text-[0.7rem] text-[#9ca3af] px-4">
                        La vista previa se generará al subir un archivo válido.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <p className="truncate text-sm font-semibold text-[#111c2c]">{previewTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[#e5e7eb] bg-[#f3f4f6] px-2 py-0.5 text-[0.65rem] font-medium text-[#6b7280]">
                      {previewCategory}
                    </span>
                    <span className="rounded-full border border-[#e5e7eb] bg-[#f3f4f6] px-2 py-0.5 text-[0.65rem] font-medium text-[#6b7280]">
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#022448] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0e3a6e] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-semibold text-[#374151] shadow-sm transition hover:border-[#374151] hover:text-[#111c2c] disabled:opacity-50"
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
