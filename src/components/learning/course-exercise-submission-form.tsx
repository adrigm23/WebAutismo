"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FileX,
  Globe,
  Link2,
  MessageSquare,
  Paperclip,
  Upload,
} from "lucide-react";
import {
  submitCourseResourceSubmissionAction,
  type CourseSubmissionFormState,
} from "@/actions/course-resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CampusResourceItem,
  CampusResourceSubmissionItem,
} from "@/lib/course-resources";
import { cn, formatDateTime } from "@/lib/utils";

const initialState: CourseSubmissionFormState = {};
const LOCAL_DRAFT_KEY_PREFIX = "course-submission-draft";

type SupportMaterial = Pick<
  CampusResourceItem,
  "accessLabel" | "createdAt" | "href" | "id" | "isExternal" | "mimeType" | "resourceTypeLabel" | "title"
>;

type CourseExerciseSubmissionFormProps = {
  courseSlug: string;
  existingSubmission: CampusResourceSubmissionItem | null;
  dueAt?: Date | string | null;
  isSubmissionClosed?: boolean;
  resourceDescription: string;
  resourceId: string;
  resourceTitle: string;
  supportMaterials: SupportMaterial[];
  // New optional props
  courseName?: string;
  moduleTitle?: string;
  completionRate?: number;
  completedModulesCount?: number;
  totalModulesCount?: number;
};

type ParsedTaskCopy = {
  introParagraphs: string[];
  instructionItems: string[];
  closingParagraphs: string[];
};

type StoredSubmissionDraft = {
  linkUrl?: string;
  savedAt?: string;
};

function getDraftStorageKey(courseSlug: string, resourceId: string) {
  return `${LOCAL_DRAFT_KEY_PREFIX}:${courseSlug}:${resourceId}`;
}

function readStoredDraft(courseSlug: string, resourceId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storedDraft = window.localStorage.getItem(
    getDraftStorageKey(courseSlug, resourceId),
  );

  if (!storedDraft) {
    return null;
  }

  try {
    return JSON.parse(storedDraft) as StoredSubmissionDraft;
  } catch {
    window.localStorage.removeItem(getDraftStorageKey(courseSlug, resourceId));
    return null;
  }
}

function getSupportMaterialMeta(resource: SupportMaterial) {
  const parts = [] as string[];

  if (resource.isExternal) {
    parts.push("Recurso externo");
  } else if (resource.mimeType?.includes("pdf")) {
    parts.push("PDF");
  } else if (
    resource.mimeType?.includes("sheet") ||
    resource.mimeType?.includes("excel") ||
    resource.mimeType?.includes("csv")
  ) {
    parts.push("Hoja de calculo");
  } else {
    parts.push(resource.resourceTypeLabel);
  }

  if (resource.createdAt) {
    parts.push(formatDateTime(resource.createdAt));
  } else if (!resource.isExternal) {
    parts.push(resource.accessLabel);
  }

  return parts.join(" • ");
}

function SupportMaterialIcon(input: { resource: SupportMaterial }) {
  if (input.resource.isExternal) {
    return <Globe className="h-4 w-4" />;
  }

  if (
    input.resource.mimeType?.includes("sheet") ||
    input.resource.mimeType?.includes("excel") ||
    input.resource.mimeType?.includes("csv")
  ) {
    return <FileSpreadsheet className="h-4 w-4" />;
  }

  return <FileText className="h-4 w-4" />;
}

function parseTaskCopy(description: string): ParsedTaskCopy {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      introParagraphs: [],
      instructionItems: [],
      closingParagraphs: [],
    };
  }

  const bulletIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (/^([•*-]|\d+[.)])\s+/.test(line)) {
      indexes.push(index);
    }

    return indexes;
  }, []);

  if (!bulletIndexes.length) {
    return {
      introParagraphs: lines,
      instructionItems: [],
      closingParagraphs: [],
    };
  }

  const firstBulletIndex = bulletIndexes[0] ?? 0;
  const lastBulletIndex = bulletIndexes[bulletIndexes.length - 1] ?? firstBulletIndex;

  return {
    introParagraphs: lines.slice(0, firstBulletIndex),
    instructionItems: lines
      .slice(firstBulletIndex, lastBulletIndex + 1)
      .map((line) => line.replace(/^([•*-]|\d+[.)])\s+/, "")),
    closingParagraphs: lines.slice(lastBulletIndex + 1),
  };
}

function getSubmissionStatus(existingSubmission: CampusResourceSubmissionItem | null) {
  if (!existingSubmission) return { label: "Pendiente", color: "orange" as const };
  if (existingSubmission.status === "SUBMITTED") return { label: "En revisión", color: "blue" as const };
  if (existingSubmission.status === "REVIEWED") return { label: "Revisada", color: "green" as const };
  if (existingSubmission.status === "CHANGES_REQUESTED") return { label: "Cambios solicitados", color: "red" as const };
  return { label: "Pendiente", color: "orange" as const };
}

function SubmissionActionRow(input: {
  disabled: boolean;
  onSaveDraft: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button
        className="border-none bg-transparent px-0 text-[var(--color-ink-soft)] shadow-none hover:bg-transparent hover:text-[var(--color-ink)]"
        disabled={pending || input.disabled}
        onClick={input.onSaveDraft}
        type="button"
        variant="neutral"
      >
        Guardar borrador local
      </Button>
      <Button
        aria-busy={pending}
        className="border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 text-white shadow-none hover:bg-[var(--color-primary-strong)] hover:shadow-none"
        disabled={pending || input.disabled}
        type="submit"
        variant="neutral"
      >
        {pending ? "Entregando..." : "Entregar tarea"}
        <ArrowUpRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CourseExerciseSubmissionForm({
  courseSlug,
  existingSubmission,
  dueAt,
  isSubmissionClosed = false,
  resourceDescription,
  resourceId,
  resourceTitle,
  supportMaterials,
  courseName,
  moduleTitle,
  completionRate,
  completedModulesCount,
  totalModulesCount,
}: CourseExerciseSubmissionFormProps) {
  const storedDraft = readStoredDraft(courseSlug, resourceId);
  const [state, formAction] = useActionState(
    submitCourseResourceSubmissionAction,
    initialState,
  );
  const [linkValue, setLinkValue] = useState(
    existingSubmission?.linkUrl ?? storedDraft?.linkUrl ?? "",
  );
  const [bodyText, setBodyText] = useState(existingSubmission?.body ?? "");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(
    !existingSubmission?.linkUrl && storedDraft?.linkUrl
      ? storedDraft.savedAt
        ? `Borrador local restaurado. Ultima actualizacion: ${formatDateTime(storedDraft.savedAt)}.`
        : "Borrador local restaurado."
      : null,
  );
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taskCopy = parseTaskCopy(resourceDescription);
  const existingAttachmentLabel = existingSubmission?.attachmentLabel ?? null;
  const submissionStatus = getSubmissionStatus(existingSubmission);

  useEffect(() => {
    if (!state.success || typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(getDraftStorageKey(courseSlug, resourceId));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [courseSlug, resourceId, state.success]);

  function handleDraftSave() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getDraftStorageKey(courseSlug, resourceId),
      JSON.stringify({
        linkUrl: linkValue.trim(),
        savedAt: new Date().toISOString(),
      }),
    );

    setDraftNotice(
      selectedFileName
        ? "Borrador local guardado. Si adjuntas un archivo, tendras que volver a seleccionarlo al entregar."
        : "Borrador local guardado en este dispositivo.",
    );
  }

  function handleFileSelection(fileList: FileList | null) {
    const nextFile = fileList?.[0];
    setSelectedFileName(nextFile?.name ?? null);
  }

  return (
    <main className="scroll-mt-28 px-4 pb-12 pt-6 sm:px-6 xl:px-8" id={`resource-${resourceId}`}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Breadcrumb — simplificado en móvil para no ocupar espacio */}
          <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <Link href="/mis-cursos" className="shrink-0 hover:text-[var(--color-primary)] hover:underline">
              Mis cursos
            </Link>
            {courseName ? (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                {/* Nombre del curso truncado — en móvil solo muestra puntos suspensivos */}
                <span className="hidden max-w-[12rem] truncate sm:inline">{courseName}</span>
                <span className="sm:hidden">…</span>
              </>
            ) : null}
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="shrink-0">Actividad</span>
          </nav>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)] bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
              <FileCheck2 className="h-3.5 w-3.5" />
              Evaluable
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                submissionStatus.color === "orange" && "border border-orange-200 bg-orange-50 text-orange-700",
                submissionStatus.color === "blue" && "border border-blue-200 bg-blue-50 text-blue-700",
                submissionStatus.color === "green" && "border border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
                submissionStatus.color === "red" && "border border-red-200 bg-red-50 text-red-700",
              )}
            >
              {submissionStatus.label}
            </span>
            {dueAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(22,60,88,0.12)] bg-[rgba(22,60,88,0.06)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">
                <Calendar className="h-3.5 w-3.5" />
                Vence {formatDateTime(dueAt)}
              </span>
            ) : null}
          </div>

          {/* Title + subtitle */}
          <div>
            <h1 className="mt-3 text-[2.4rem] font-bold leading-tight tracking-[-0.04em] text-[#111c2c]">
              {resourceTitle}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Actividad evaluable{moduleTitle ? ` · ${moduleTitle}` : ""}
            </p>
          </div>

          {/* Instructions card */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white shadow-sm">
            {/* Card header */}
            <div className="flex items-center gap-2 border-b border-[rgba(22,60,88,0.08)] px-6 py-4">
              <FileText className="h-4 w-4 text-[var(--color-muted)]" />
              <span className="font-bold text-[var(--color-ink)]">Instrucciones</span>
            </div>

            <div className="space-y-6 px-6 py-5">
              {/* Description text */}
              {(taskCopy.introParagraphs.length || resourceDescription) ? (
                <div className="space-y-3 text-[1.05rem] leading-[1.78] text-[var(--color-ink-soft)]">
                  {taskCopy.introParagraphs.length
                    ? taskCopy.introParagraphs.map((p, i) => <p key={`intro-${i}`}>{p}</p>)
                    : <p>{resourceDescription}</p>}
                  {taskCopy.closingParagraphs.map((p, i) => <p key={`closing-${i}`}>{p}</p>)}
                </div>
              ) : null}

              {/* Learning objectives */}
              {taskCopy.instructionItems.length ? (
                <div className="space-y-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Objetivos de Aprendizaje
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {taskCopy.instructionItems.map((item, i) => (
                      <div
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-success-soft)] px-3 py-2.5 text-sm text-[var(--color-success)]"
                        key={`objective-${i}`}
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Support materials — PDFs, enlaces y archivos adjuntos del enunciado */}
              {supportMaterials.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Material del enunciado
                  </p>
                  <div className="space-y-2">
                    {supportMaterials.map((material) => (
                      <a
                        className="flex items-center gap-3 rounded-xl border border-[rgba(22,60,88,0.1)] bg-[var(--color-bg-subtle)] px-4 py-3 transition hover:border-[var(--color-primary)] hover:bg-white"
                        href={material.href ?? "#"}
                        key={material.id}
                        rel="noopener noreferrer"
                        target={material.isExternal ? "_blank" : "_self"}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-primary)]">
                          <SupportMaterialIcon resource={material} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                            {material.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {getSupportMaterialMeta(material)}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

            </div>
          </div>

          {/* Submission form */}
          <div className="space-y-4">
            {/* File input (hidden) */}
            <input
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.csv,.txt"
              className="sr-only"
              disabled={isSubmissionClosed}
              id={inputId}
              name="file"
              onChange={(event) => handleFileSelection(event.target.files)}
              ref={fileInputRef}
              type="file"
            />

            <form action={formAction} className="space-y-4">
              <input name="courseSlug" type="hidden" value={courseSlug} />
              <input name="resourceId" type="hidden" value={resourceId} />

              {/* Text response */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--color-ink-soft)]">
                  Respuesta escrita <span className="font-normal text-[var(--color-muted)]">(opcional)</span>
                </label>
                <textarea
                  className="w-full resize-y rounded-xl border border-[rgba(22,60,88,0.12)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmissionClosed}
                  name="body"
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  rows={4}
                  value={bodyText}
                />
              </div>

              {/* Dropzone */}
              <button
                className={cn(
                  "group flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                  isSubmissionClosed
                    ? "cursor-not-allowed border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.5)] text-[var(--color-muted)]"
                    : isDragging
                      ? "border-[var(--color-primary)] bg-[rgba(223,234,243,0.25)]"
                      : "border-[rgba(22,60,88,0.14)] bg-[rgba(248,246,241,0.5)] hover:border-[rgba(22,60,88,0.26)] hover:bg-[rgba(248,246,241,0.8)]",
                )}
                disabled={isSubmissionClosed}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => { if (!isSubmissionClosed) { e.preventDefault(); setIsDragging(true); } }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false); }}
                onDragOver={(e) => { if (!isSubmissionClosed) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragging(true); } }}
                onDrop={(e) => {
                  if (isSubmissionClosed) return;
                  e.preventDefault(); setIsDragging(false);
                  if (fileInputRef.current) { fileInputRef.current.files = e.dataTransfer.files; handleFileSelection(e.dataTransfer.files); }
                }}
                type="button"
              >
                <Upload className="h-7 w-7 text-[var(--color-muted)]" />
                <p className="mt-3 text-[0.92rem] font-semibold text-[var(--color-ink)]">
                  {selectedFileName ?? (existingAttachmentLabel ? `Actual: ${existingAttachmentLabel}` : "Arrastra o haz clic")}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  PDF, DOCX, imágenes — máx. 10 MB
                </p>
                {!selectedFileName && !existingAttachmentLabel ? (
                  <span className="mt-3 rounded-lg border border-[rgba(22,60,88,0.18)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition group-hover:border-[rgba(22,60,88,0.34)]">
                    Explorar archivos
                  </span>
                ) : null}
              </button>

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[rgba(22,60,88,0.08)]" />
                <span className="text-xs text-[var(--color-muted)]">o</span>
                <div className="h-px flex-1 bg-[rgba(22,60,88,0.08)]" />
              </div>

              {/* Link input */}
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <Input
                  className="h-11 rounded-xl border-[rgba(22,60,88,0.12)] bg-white pl-10 text-sm shadow-none"
                  disabled={isSubmissionClosed}
                  id={`${inputId}-link`}
                  name="linkUrl"
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder="https://enlace-alternativo..."
                  type="url"
                  value={linkValue}
                />
              </div>

              {/* Feedback banners */}
              {(state.error || state.success || draftNotice) ? (
                <div className="space-y-2">
                  {state.error ? (
                    <p className="rounded-lg border border-[rgba(159,69,46,0.18)] bg-[rgba(252,238,233,0.82)] px-3 py-2.5 text-xs text-[var(--color-danger)]">{state.error}</p>
                  ) : null}
                  {state.success ? (
                    <p className="rounded-lg border border-[rgba(23,98,79,0.16)] bg-[rgba(228,241,235,0.82)] px-3 py-2.5 text-xs text-[var(--color-success)]">{state.success}</p>
                  ) : null}
                  {draftNotice ? (
                    <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                      <CircleAlert className="h-3.5 w-3.5" />{draftNotice}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Action row */}
              <SubmissionActionRow disabled={isSubmissionClosed} onSaveDraft={handleDraftSave} />
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN - sticky info panel */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* Status card */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white shadow-sm">
            {/* Status header */}
            {!existingSubmission ? (
              <div className="rounded-t-2xl bg-[var(--color-danger-soft)] px-5 py-5 text-center">
                <FileX className="mx-auto h-10 w-10 text-[#e5533d]" />
                <p className="mt-3 font-bold text-[#111c2c]">Pendiente de entrega</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Asegúrate de enviar tu trabajo antes de la fecha límite.</p>
              </div>
            ) : existingSubmission.status === "SUBMITTED" ? (
              <div className="rounded-t-2xl bg-[#f0f6ff] px-5 py-5 text-center">
                <FileCheck2 className="mx-auto h-10 w-10 text-blue-500" />
                <p className="mt-3 font-bold text-[#111c2c]">En revisión</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Tu entrega está siendo revisada por el docente.</p>
              </div>
            ) : (
              <div className="rounded-t-2xl bg-[#f0fdf4] px-5 py-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-3 font-bold text-[#111c2c]">Revisada</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Tu actividad ya tiene una revisión registrada.</p>
              </div>
            )}

            {/* Existing submission feedback */}
            {existingSubmission ? (
              <div className="px-4 pb-2 pt-3">
                <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-[rgba(251,248,244,0.92)] px-4 py-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  <p>
                    Última entrega:{" "}
                    <strong className="font-medium text-[var(--color-ink)]">
                      {formatDateTime(existingSubmission.submittedAt)}
                    </strong>
                    {" · "}
                    <strong className="font-medium text-[var(--color-ink)]">
                      {existingSubmission.statusLabel}
                    </strong>
                  </p>
                  {existingSubmission.feedback ? (
                    <p className="mt-1.5 text-[var(--color-ink)]">{existingSubmission.feedback}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Due date section */}
            {dueAt ? (
              <div className="mx-4 mb-4 mt-3 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-center text-white">
                <p className="text-[0.65rem] uppercase tracking-widest opacity-70">Fecha Límite</p>
                <p className="mt-1 font-semibold">{formatDateTime(dueAt)}</p>
              </div>
            ) : null}

            {/* Closed banner */}
            {isSubmissionClosed ? (
              <div className="mx-4 mb-4 rounded-xl border border-[rgba(159,69,46,0.16)] bg-[rgba(252,238,233,0.78)] px-4 py-3 text-sm text-[var(--color-danger)]">
                El plazo de entrega ya ha finalizado.
              </div>
            ) : null}
          </div>

          {/* Progress card (conditional) */}
          {completionRate !== undefined && completionRate !== null ? (
            <div className="rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white p-5 shadow-sm">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Progreso del Curso
              </p>
              <p className="mt-2 text-[2rem] font-bold leading-none text-[var(--color-success)]">
                {Math.round(completionRate)}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(22,60,88,0.07)]">
                <div
                  className="h-2 rounded-full bg-[var(--color-success)] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                />
              </div>
              {completedModulesCount !== undefined && totalModulesCount !== undefined ? (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Módulo {completedModulesCount} de {totalModulesCount}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Quick actions card */}
          <div className="rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white p-4 shadow-sm">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Acciones Rápidas
            </p>
            <div className="space-y-1">
              <a
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-primary)]"
                href="/mensajes"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                Contactar Tutor
              </a>
              <a
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[rgba(22,60,88,0.04)] hover:text-[var(--color-primary)]"
                href={`/mis-cursos/${courseSlug}/leccion/0`}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                Volver al contenido
              </a>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
