"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowUpRight,
  Calendar,
  CircleAlert,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Globe,
  Link2,
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
const ALLOWED_FORMATS_LABEL =
  "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, WEBP, CSV o TXT hasta 10 MB";

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

function formatTaskPointsLabel() {
  return "Evaluable";
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
        className="border border-[#0f0f0f] bg-[#0f0f0f] px-5 text-white shadow-none hover:bg-[#1a1a1a] hover:shadow-none"
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
}: CourseExerciseSubmissionFormProps) {
  const storedDraft = readStoredDraft(courseSlug, resourceId);
  const [state, formAction] = useActionState(
    submitCourseResourceSubmissionAction,
    initialState,
  );
  const [linkValue, setLinkValue] = useState(
    existingSubmission?.linkUrl ?? storedDraft?.linkUrl ?? "",
  );
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
    <main
      className="mx-auto max-w-[1160px] scroll-mt-28 px-4 pb-12 pt-6 sm:px-6 xl:px-8"
      id={`resource-${resourceId}`}
    >
      {/* 2-col grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">

        {/* ── LEFT: task details + materials ── */}
        <div className="space-y-8">
          {/* Title + metadata + description */}
          <section className="space-y-5">
            <h1 className="font-premium max-w-[20ch] text-[clamp(2.2rem,5vw,3.2rem)] font-semibold leading-[1.0] tracking-[-0.065em] text-balance text-[var(--color-ink)]">
              {resourceTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
              {dueAt ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Vencimiento: {formatDateTime(dueAt)}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(22,60,88,0.22)] px-3 py-0.5 text-[0.78rem] font-semibold text-[var(--color-primary)]">
                <FileCheck2 className="h-3.5 w-3.5" />
                {formatTaskPointsLabel()}
              </span>
            </div>

            {(taskCopy.introParagraphs.length || resourceDescription) ? (
              <div className="max-w-[44rem] space-y-4 text-[1.05rem] leading-[1.78] text-[var(--color-ink-soft)]">
                {taskCopy.introParagraphs.length
                  ? taskCopy.introParagraphs.map((p, i) => <p key={`intro-${i}`}>{p}</p>)
                  : <p>{resourceDescription}</p>}
                {taskCopy.instructionItems.length ? (
                  <ul className="space-y-3 pl-5 text-[var(--color-ink-soft)]">
                    {taskCopy.instructionItems.map((item, i) => (
                      <li className="pl-1 marker:text-[rgba(34,34,33,0.28)]" key={`instruction-${i}`}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {taskCopy.closingParagraphs.map((p, i) => <p key={`closing-${i}`}>{p}</p>)}
              </div>
            ) : null}
          </section>

          {/* Materials */}
          {supportMaterials.length ? (
            <section className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 border-b border-[rgba(22,60,88,0.07)] px-6 py-4">
                <Paperclip className="h-4 w-4 text-[var(--color-muted)]" />
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Materiales de apoyo
                </span>
              </div>
              <div className="divide-y divide-[rgba(22,60,88,0.06)]">
                {supportMaterials.map((resource) => (
                  <a
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[rgba(248,246,241,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset"
                    href={resource.href ?? "#"}
                    key={resource.id}
                    rel={resource.isExternal ? "noreferrer" : undefined}
                    target={resource.isExternal ? "_blank" : undefined}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.8)] text-[var(--color-ink-soft)]">
                      <SupportMaterialIcon resource={resource} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.98rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                        {resource.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {getSupportMaterialMeta(resource)}
                      </p>
                    </div>
                    {resource.isExternal ? (
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 shrink-0 rotate-90 text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* ── RIGHT: sticky submission card ── */}
        <div className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-2xl border border-[rgba(22,60,88,0.09)] bg-white shadow-[var(--shadow-medium)]">
            {/* Card header */}
            <div className="border-b border-[rgba(22,60,88,0.07)] px-6 py-5">
              <h2 className="text-[1.25rem] font-bold tracking-[-0.03em] text-[var(--color-ink)]">
                Tu entrega
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Sube tu documento final o comparte un enlace alternativo.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              {/* Existing submission banner */}
              {existingSubmission ? (
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
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-[rgba(22,60,88,0.1)] bg-[rgba(223,234,243,0.5)] px-4 py-3 text-sm text-[var(--color-primary)]">
                  <CircleAlert className="h-4 w-4 shrink-0" />
                  Aún no has entregado esta tarea.
                </div>
              )}

              {/* Closed banner */}
              {isSubmissionClosed ? (
                <div className="rounded-xl border border-[rgba(159,69,46,0.16)] bg-[rgba(252,238,233,0.78)] px-4 py-3 text-sm text-[var(--color-danger)]">
                  El plazo de entrega ya ha finalizado.
                </div>
              ) : null}

              {/* Form */}
              <form action={formAction} className="space-y-4">
                <input name="courseSlug" type="hidden" value={courseSlug} />
                <input name="resourceId" type="hidden" value={resourceId} />
                <input name="body" type="hidden" value={existingSubmission?.body ?? ""} />

                {/* File input */}
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
                    {selectedFileName ?? (existingAttachmentLabel ? `Actual: ${existingAttachmentLabel}` : "Arrastra tu archivo aquí")}
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

                {/* Action buttons */}
                <SubmissionActionRow disabled={isSubmissionClosed} onSaveDraft={handleDraftSave} />
              </form>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
