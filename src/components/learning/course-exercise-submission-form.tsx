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
  Plus,
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
      className="mx-auto max-w-[58rem] scroll-mt-28 px-1 pb-8 sm:px-2 lg:pb-12"
      id={`resource-${resourceId}`}
    >
      <div className="space-y-12 sm:space-y-14">
        <section className="space-y-5">
          <h1 className="font-premium max-w-[14ch] text-[clamp(2.75rem,6vw,4rem)] leading-[0.98] font-semibold tracking-[-0.065em] text-[var(--color-ink)] text-balance">
            {resourceTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.98rem] text-[var(--color-ink-soft)]">
            {dueAt ? (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vencimiento: {formatDateTime(dueAt)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <FileCheck2 className="h-4 w-4" />
              {formatTaskPointsLabel()}
            </span>
          </div>

          <div className="max-w-[42rem] space-y-4 text-[1.08rem] leading-[1.75] text-[var(--color-ink-soft)]">
            {taskCopy.introParagraphs.length
              ? taskCopy.introParagraphs.map((paragraph, index) => (
                  <p key={`intro-${index}`}>{paragraph}</p>
                ))
              : resourceDescription ? <p>{resourceDescription}</p> : null}

            {taskCopy.instructionItems.length ? (
              <ul className="space-y-3.5 pl-5 text-[var(--color-ink-soft)]">
                {taskCopy.instructionItems.map((item, index) => (
                  <li
                    className="pl-1 marker:text-[rgba(34,34,33,0.28)]"
                    key={`instruction-${index}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}

            {taskCopy.closingParagraphs.map((paragraph, index) => (
              <p key={`closing-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>

        {supportMaterials.length ? (
          <section className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-[rgba(255,255,255,0.68)] p-5 sm:p-7">
            <div className="flex items-center gap-2 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]">
              <Paperclip className="h-4 w-4" />
              Materiales de apoyo
            </div>

            <div className="mt-5 divide-y divide-[rgba(22,60,88,0.07)]">
              {supportMaterials.map((resource) => (
                <a
                  className="group flex items-center gap-4 px-1 py-4 transition-colors duration-[var(--motion-duration-base)] hover:bg-[rgba(248,246,241,0.58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(255,253,250,0.96)]"
                  href={resource.href ?? "#"}
                  key={resource.id}
                  rel={resource.isExternal ? "noreferrer" : undefined}
                  target={resource.isExternal ? "_blank" : undefined}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[rgba(22,60,88,0.08)] bg-white text-[var(--color-ink)]">
                    <SupportMaterialIcon resource={resource} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1.04rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {getSupportMaterialMeta(resource)}
                    </p>
                  </div>

                  {resource.isExternal ? (
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-[var(--motion-duration-base)] group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
                  ) : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-premium text-[1.95rem] leading-[1.05] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
              Tu entrega
            </h2>
            <p className="max-w-[38rem] text-[1rem] leading-7 text-[var(--color-ink-soft)]">
              Sube tu documento final en formato compatible o comparte un enlace alternativo.
            </p>
          </div>

          {existingSubmission ? (
            <div className="rounded-xl border border-[rgba(22,60,88,0.08)] bg-[rgba(251,248,244,0.92)] px-5 py-4 text-sm leading-7 text-[var(--color-ink-soft)]">
              <p>
                Ultima entrega registrada:{" "}
                <strong className="font-medium text-[var(--color-ink)]">
                  {formatDateTime(existingSubmission.submittedAt)}
                </strong>
                {" • "}
                <strong className="font-medium text-[var(--color-ink)]">
                  {existingSubmission.statusLabel}
                </strong>
              </p>
              {existingSubmission.feedback ? (
                <p className="mt-1.5 text-[var(--color-ink)]">
                  {existingSubmission.feedback}
                </p>
              ) : null}
            </div>
          ) : null}

          {isSubmissionClosed ? (
            <div className="rounded-xl border border-[rgba(159,69,46,0.16)] bg-[rgba(252,238,233,0.78)] px-5 py-4 text-sm leading-7 text-[var(--color-danger)]">
              El plazo de entrega ya ha finalizado. Si necesitas una nueva ventana, el equipo docente debe reabrir la tarea.
            </div>
          ) : null}

          <form action={formAction} className="space-y-8">
            <input name="courseSlug" type="hidden" value={courseSlug} />
            <input name="resourceId" type="hidden" value={resourceId} />
            <input name="body" type="hidden" value={existingSubmission?.body ?? ""} />

            <section className="space-y-4">
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

              <button
                className={cn(
                  "group flex min-h-[15rem] w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors duration-[var(--motion-duration-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                  isSubmissionClosed
                    ? "cursor-not-allowed border-[rgba(22,60,88,0.08)] bg-[rgba(248,246,241,0.52)] text-[var(--color-muted)]"
                    : isDragging
                      ? "border-[rgba(22,60,88,0.26)] bg-[rgba(251,248,244,0.94)]"
                      : "border-[rgba(22,60,88,0.12)] bg-[rgba(255,255,255,0.34)] hover:bg-[rgba(251,248,244,0.74)]",
                )}
                disabled={isSubmissionClosed}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(event) => {
                  if (isSubmissionClosed) {
                    return;
                  }

                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsDragging(false);
                  }
                }}
                onDragOver={(event) => {
                  if (isSubmissionClosed) {
                    return;
                  }

                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setIsDragging(true);
                }}
                onDrop={(event) => {
                  if (isSubmissionClosed) {
                    return;
                  }

                  event.preventDefault();
                  setIsDragging(false);

                  if (!fileInputRef.current) {
                    return;
                  }

                  fileInputRef.current.files = event.dataTransfer.files;
                  handleFileSelection(event.dataTransfer.files);
                }}
                type="button"
              >
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[rgba(241,238,248,0.92)] text-[var(--color-ink-soft)] transition-transform duration-[var(--motion-duration-base)] group-hover:scale-[1.02]">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[1.08rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                  Haz clic para buscar o arrastra y suelta un archivo
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {ALLOWED_FORMATS_LABEL}
                </p>
                {selectedFileName ? (
                  <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
                    Archivo seleccionado: {selectedFileName}
                  </p>
                ) : existingAttachmentLabel ? (
                  <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
                    Archivo actual: {existingAttachmentLabel}
                  </p>
                ) : null}
              </button>
            </section>

            <section className="space-y-3">
              <label
                className="inline-flex items-center gap-2 text-[1rem] font-medium tracking-[-0.02em] text-[var(--color-ink)]"
                htmlFor={`${inputId}-link`}
              >
                <Link2 className="h-4 w-4 text-[var(--color-ink-soft)]" />
                Enlace alternativo (opcional)
              </label>
              <Input
                className="h-[3.5rem] rounded-xl border-[rgba(22,60,88,0.12)] bg-white/88 px-5 text-[1rem] shadow-none"
                controlSize="lg"
                disabled={isSubmissionClosed}
                id={`${inputId}-link`}
                name="linkUrl"
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="Ej. enlace a Google Docs o Figma"
                type="url"
                value={linkValue}
              />
            </section>

            {(state.error || state.success || draftNotice) ? (
              <div className="space-y-3">
                {state.error ? (
                  <p className="rounded-xl border border-[rgba(159,69,46,0.18)] bg-[rgba(252,238,233,0.82)] px-4 py-3 text-sm text-[var(--color-danger)]">
                    {state.error}
                  </p>
                ) : null}

                {state.success ? (
                  <p className="rounded-xl border border-[rgba(23,98,79,0.16)] bg-[rgba(228,241,235,0.82)] px-4 py-3 text-sm text-[var(--color-success)]">
                    {state.success}
                  </p>
                ) : null}

                {draftNotice ? (
                  <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <CircleAlert className="h-4 w-4" />
                    {draftNotice}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="border-t border-[rgba(22,60,88,0.08)] pt-6">
              <SubmissionActionRow
                disabled={isSubmissionClosed}
                onSaveDraft={handleDraftSave}
              />
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
