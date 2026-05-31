"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Italic,
  Link2,
  List,
  LoaderCircle,
  Maximize2,
  MessageSquare,
  Minus,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  User,
  XCircle,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { reviewSubmissionAction, type ReviewSubmissionState } from "@/actions/submission-review";
import type { SubmissionForReview } from "@/lib/submission-review";

// ─── helpers ─────────────────────────────────────────────────────────────────

type ReviewIntent = "REVIEWED" | "CHANGES_REQUESTED";

const INITIAL_STATE: ReviewSubmissionState = {};

function getStatusMeta(status: SubmissionForReview["status"]) {
  if (status === "REVIEWED")
    return { label: "Aprobada", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (status === "CHANGES_REQUESTED")
    return { label: "Cambios solicitados", color: "text-blue-700 bg-blue-50 border-blue-200" };
  return { label: "Pendiente de Revisión", color: "text-amber-700 bg-amber-50 border-amber-200" };
}

function buildInlineUrl(submissionId: string) {
  return `/api/course-resource-submissions/${submissionId}?inline=1`;
}

function buildDownloadUrl(submissionId: string) {
  return `/api/course-resource-submissions/${submissionId}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PdfToolbar({
  submissionId,
  attachmentLabel,
}: {
  submissionId: string;
  attachmentLabel: string | null;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-border)] bg-[#f8f8f8] px-3 py-2">
      <button
        className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
        type="button"
        title="Documento"
      >
        <FileText className="h-3.5 w-3.5" />
      </button>
      <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />
      <button
        className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
        type="button"
        title="Reducir zoom"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="px-2 text-xs font-medium text-[var(--color-ink)]">100%</span>
      <button
        className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
        type="button"
        title="Aumentar zoom"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />
      <button
        className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
        type="button"
        title="Página anterior"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="px-1 text-xs text-[var(--color-muted)]">Pág 1</span>
      <button
        className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
        type="button"
        title="Página siguiente"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <div className="ml-auto flex items-center gap-1">
        <a
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
          download={attachmentLabel ?? "entrega"}
          href={buildDownloadUrl(submissionId)}
          title="Descargar"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
        <a
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
          href={buildInlineUrl(submissionId)}
          target="_blank"
          rel="noreferrer"
          title="Abrir en nueva pestaña"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

type ContextualNote = {
  id: string;
  text: string;
  createdAt: Date;
};

function CommentsSection({
  submission,
  reviewerName,
}: {
  submission: SubmissionForReview;
  reviewerName: string;
}) {
  const [notes, setNotes] = useState<ContextualNote[]>([]);
  const [draft, setDraft] = useState("");

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    setNotes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, createdAt: new Date() },
    ]);
    setDraft("");
  };

  return (
    <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3.5">
        <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" />
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Notas y Comentarios Contextuales
        </h2>
      </div>

      <div className="divide-y divide-[var(--color-border)] px-5">
        {/* Submission body (student's own note) */}
        {submission.body && (
          <div className="flex gap-3 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {submission.studentInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {submission.studentName}
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  {formatDateTime(submission.submittedAt)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {submission.body}
              </p>
            </div>
          </div>
        )}

        {/* Teacher contextual notes */}
        {notes.map((note, idx) => (
          <div className="flex gap-3 py-4" key={note.id}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
              {reviewerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--color-ink)]">Tú</span>
                <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
                  Nota #{idx + 1}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {note.text}
              </p>
            </div>
          </div>
        ))}

        {/* Add note input */}
        <div className="flex items-center gap-3 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted)]">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <input
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Añadir un comentario o nota contextual..."
            type="text"
            value={draft}
          />
          {draft.trim() && (
            <button
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white transition hover:opacity-90"
              onClick={addNote}
              type="button"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GradingPanel({
  submission,
  reviewerName,
}: {
  submission: SubmissionForReview;
  reviewerName: string;
}) {
  const [state, formAction, pending] = useActionState(
    reviewSubmissionAction,
    INITIAL_STATE,
  );
  const [scoreValue, setScoreValue] = useState(
    typeof submission.score === "number" ? String(submission.score) : "",
  );
  const [feedbackValue, setFeedbackValue] = useState(submission.feedback ?? "");
  const [pendingIntent, setPendingIntent] = useState<ReviewIntent | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (state.success) {
      setToast({ kind: "success", msg: state.success });
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
    if (state.error) {
      setToast({ kind: "error", msg: state.error });
      setPendingIntent(null);
    }
  }, [state]);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-sm font-bold text-[var(--color-ink)]">Evaluación Final</h3>
      </div>

      <form action={formAction} className="p-5 space-y-4">
        <input name="submissionId" type="hidden" value={submission.id} />
        <input name="courseSlug" type="hidden" value={submission.courseSlug} />

        {/* Score input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink)] mb-2">
            Calificación (0-100)
          </label>
          <div className="flex items-center gap-2">
            <input
              className="w-28 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              max="100"
              min="0"
              name="score"
              onChange={(e) => setScoreValue(e.target.value)}
              placeholder="Ej: 85"
              step="1"
              type="number"
              value={scoreValue}
            />
            <span className="text-sm text-[var(--color-muted)]">/ 100 pts</span>
          </div>

          {/* Quick score presets */}
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              onClick={() => setScoreValue("90")}
              type="button"
            >
              Excelente (+90)
            </button>
            <button
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              onClick={() => setScoreValue("70")}
              type="button"
            >
              Aprobado (+70)
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--color-ink)]">
              Feedback General
            </label>
            {/* Minimal rich text toolbar (visual only) */}
            <div className="flex items-center gap-0.5">
              {[Bold, Italic, List, Paperclip].map((Icon, i) => (
                <button
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                  key={i}
                  type="button"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            name="feedback"
            onChange={(e) => setFeedbackValue(e.target.value)}
            placeholder="Escribe tus comentarios generales sobre el proyecto aquí..."
            required
            rows={5}
            value={feedbackValue}
          />
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
              toast.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.msg}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            disabled={pending}
            name="status"
            onClick={() => setPendingIntent("REVIEWED")}
            type="submit"
            value="REVIEWED"
          >
            {pending && pendingIntent === "REVIEWED" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {pending && pendingIntent === "REVIEWED" ? "Guardando..." : "Aprobar Entrega"}
          </button>

          <div className="flex gap-2">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-60"
              disabled={pending}
              name="status"
              onClick={() => setPendingIntent("CHANGES_REQUESTED")}
              type="submit"
              value="CHANGES_REQUESTED"
            >
              {pending && pendingIntent === "CHANGES_REQUESTED" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {pending && pendingIntent === "CHANGES_REQUESTED"
                ? "Enviando..."
                : "Solicitar Cambios"}
            </button>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              title="Archivar"
              type="button"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export type SubmissionReviewPageProps = {
  submission: SubmissionForReview;
  reviewerName: string;
};

export function SubmissionReviewPage({
  submission,
  reviewerName,
}: SubmissionReviewPageProps) {
  const statusMeta = getStatusMeta(submission.status);
  const hasPdf =
    submission.mimeType === "application/pdf" ||
    submission.attachmentLabel?.toLowerCase().endsWith(".pdf");
  const inlineUrl = buildInlineUrl(submission.id);
  const downloadUrl = buildDownloadUrl(submission.id);

  return (
    <div className="px-5 py-5 lg:px-8 lg:py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        <Link
          className="transition hover:text-[var(--color-ink)]"
          href="/mis-cursos"
        >
          Cursos
        </Link>
        <span>/</span>
        <Link
          className="transition hover:text-[var(--color-ink)]"
          href={`/mis-cursos/${submission.courseSlug}/seguimiento`}
        >
          {submission.courseTitle}
        </Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Revisión de Entrega</span>
      </nav>

      {/* Title row */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
          href={`/mis-cursos/${submission.courseSlug}/seguimiento`}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold text-[var(--color-ink)] lg:text-2xl">
          {submission.resourceTitle}
        </h1>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            statusMeta.color,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusMeta.label}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start">
        {/* ── Left: document + comments ─────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Document viewer */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <PdfToolbar
              attachmentLabel={submission.attachmentLabel}
              submissionId={submission.id}
            />

            {/* Content area */}
            {hasPdf ? (
              <iframe
                className="h-[600px] w-full bg-[#f0f0f0]"
                src={inlineUrl}
                title={submission.resourceTitle}
              />
            ) : submission.linkUrl ? (
              <div className="flex items-center justify-center bg-[#f7f9fb] p-12">
                <a
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                  href={submission.linkUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir enlace de la entrega
                </a>
              </div>
            ) : submission.attachmentLabel ? (
              <div className="flex items-center justify-center bg-[#f7f9fb] p-12">
                <a
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                  download={submission.attachmentLabel}
                  href={downloadUrl}
                >
                  <Download className="h-4 w-4" />
                  Descargar {submission.attachmentLabel}
                </a>
              </div>
            ) : submission.body ? (
              <div className="p-6 text-sm leading-relaxed text-[var(--color-ink)]">
                {submission.body}
              </div>
            ) : (
              <div className="flex items-center justify-center p-12 text-sm text-[var(--color-muted)]">
                No hay adjunto para esta entrega.
              </div>
            )}
          </div>

          {/* Contextual comments */}
          <CommentsSection
            reviewerName={reviewerName}
            submission={submission}
          />
        </div>

        {/* ── Right: student card + grading ─────────────── */}
        <div className="w-full shrink-0 space-y-4 xl:w-72 2xl:w-80">
          {/* Student card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                {submission.studentInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-ink)]">
                  {submission.studentName}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {submission.studentEmail}
                </p>
                <button className="mt-1 text-xs font-medium text-[var(--color-primary)] transition hover:underline">
                  Ver perfil completo
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-muted)]">Entregado</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatDateTime(submission.submittedAt)}
                </span>
              </div>
              {submission.reviewedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Revisado</span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    {formatDateTime(submission.reviewedAt)}
                  </span>
                </div>
              )}
              {typeof submission.score === "number" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Calificación</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {submission.score} / 100
                  </span>
                </div>
              )}
              {submission.passingScore !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Puntaje mínimo</span>
                  <span className="text-[var(--color-ink)]">
                    {submission.passingScore} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Grading panel */}
          <GradingPanel reviewerName={reviewerName} submission={submission} />
        </div>
      </div>
    </div>
  );
}
