"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  MessageSquare,
  Minus,
  Paperclip,
  Plus,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import {
  reviewSubmissionAction,
  saveReviewDraftAction,
  type ReviewSubmissionState,
} from "@/actions/submission-review";
import type { SubmissionForReview, RubricCriterionWithScore } from "@/lib/submission-review";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ReviewIntent = "REVIEWED" | "CHANGES_REQUESTED";

const INITIAL_STATE: ReviewSubmissionState = {};

function getStatusMeta(status: SubmissionForReview["status"]) {
  if (status === "REVIEWED")
    return { label: "Corregida", color: "text-[var(--color-success)] bg-[var(--color-success-soft)] border-[var(--color-success)]" };
  if (status === "CHANGES_REQUESTED")
    return { label: "Cambios solicitados", color: "text-[var(--color-primary)] bg-[var(--color-primary-soft)] border-[var(--color-primary)]" };
  return { label: "Pendiente de Corrección", color: "text-[var(--color-warning)] bg-[var(--color-warning-soft)] border-[var(--color-warning)]" };
}

function buildInlineUrl(id: string) {
  return `/api/course-resource-submissions/${id}?inline=1`;
}
function buildDownloadUrl(id: string) {
  return `/api/course-resource-submissions/${id}`;
}

function formatBytes(n: number | null): string | null {
  if (!n) return null;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Document Viewer ──────────────────────────────────────────────────────────

function DocumentViewer({ submission }: { submission: SubmissionForReview }) {
  const [zoom, setZoom] = useState(100);
  const inlineUrl = buildInlineUrl(submission.id);
  const downloadUrl = buildDownloadUrl(submission.id);
  const isPdf =
    submission.mimeType === "application/pdf" ||
    submission.attachmentLabel?.toLowerCase().endsWith(".pdf");

  function zoomIn() { setZoom((z) => Math.min(z + 25, 200)); }
  function zoomOut() { setZoom((z) => Math.max(z - 25, 50)); }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2">
        <div className="flex items-center gap-1 text-[#6b7280]">
          <FileText className="h-3.5 w-3.5 text-red-500" />
          <span className="max-w-[140px] truncate text-[0.65rem] font-medium text-[#374151]">
            {submission.attachmentLabel ?? "Entrega"}
          </span>
        </div>

        <div className="mx-2 h-4 w-px bg-[#e5e7eb]" />

        {/* Zoom controls */}
        <button
          type="button"
          onClick={zoomOut}
          title="Reducir zoom"
          className="flex h-7 w-7 items-center justify-center rounded text-[#9ba3af] hover:bg-white hover:text-[#374151]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-xs font-medium text-[#374151]">{zoom}%</span>
        <button
          type="button"
          onClick={zoomIn}
          title="Aumentar zoom"
          className="flex h-7 w-7 items-center justify-center rounded text-[#9ba3af] hover:bg-white hover:text-[#374151]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1">
          <a
            href={downloadUrl}
            download={submission.attachmentLabel ?? "entrega"}
            title="Descargar"
            className="flex h-7 w-7 items-center justify-center rounded text-[#9ba3af] hover:bg-white hover:text-[#374151]"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
          {isPdf && (
            <a
              href={inlineUrl}
              target="_blank"
              rel="noreferrer"
              title="Abrir en nueva pestaña"
              className="flex h-7 w-7 items-center justify-center rounded text-[#9ba3af] hover:bg-white hover:text-[#374151]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      {isPdf ? (
        <div className="overflow-auto bg-[#f0f0f0]" style={{ height: 580 }}>
          <iframe
            src={inlineUrl}
            title={submission.resourceTitle}
            className="h-full w-full border-0"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: `${10000 / zoom}%`, height: `${10000 / zoom}%` }}
          />
        </div>
      ) : submission.linkUrl ? (
        <div className="flex items-center justify-center bg-[#f7f9fb] p-16">
          <a
            href={submission.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[#163c58] px-5 py-3 text-sm font-semibold text-[#163c58] transition hover:bg-[#163c58] hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir enlace de la entrega
          </a>
        </div>
      ) : submission.attachmentLabel ? (
        <div className="flex flex-col items-center justify-center gap-4 bg-[#f7f9fb] p-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f0fe]">
            <FileText className="h-7 w-7 text-[#163c58]" />
          </div>
          <p className="text-sm text-[#6b7280]">{submission.attachmentLabel}</p>
          {submission.sizeInBytes && (
            <p className="text-xs text-[#9ba3af]">{formatBytes(submission.sizeInBytes)}</p>
          )}
          <a
            href={downloadUrl}
            download={submission.attachmentLabel}
            className="flex items-center gap-2 rounded-xl bg-[#163c58] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f73]"
          >
            <Download className="h-4 w-4" />
            Descargar archivo
          </a>
        </div>
      ) : submission.body ? (
        <div className="p-6 text-sm leading-relaxed text-[#374151]">
          {submission.body}
        </div>
      ) : (
        <div className="flex items-center justify-center p-16 text-sm text-[#9ba3af]">
          No hay adjunto en esta entrega.
        </div>
      )}
    </div>
  );
}

// ─── Student Info Card ────────────────────────────────────────────────────────

function StudentCard({ submission }: { submission: SubmissionForReview }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#163c58] text-sm font-bold text-white">
        {submission.studentInitials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--color-primary)]">{submission.studentName}</p>
        <p className="truncate text-xs text-[#9ba3af]">{submission.studentEmail}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[0.6rem] text-[#9ba3af]">Entregado</p>
        <p className="text-xs font-medium text-[#374151]">{formatDateTime(submission.submittedAt)}</p>
      </div>
    </div>
  );
}

// ─── Rubric Panel ─────────────────────────────────────────────────────────────

type CriterionScore = { criterionId: string; points: number; comment: string };

function RubricPanel({
  criteria,
  onChange,
}: {
  criteria: RubricCriterionWithScore[];
  onChange: (scores: CriterionScore[]) => void;
}) {
  const [scores, setScores] = useState<CriterionScore[]>(
    criteria.map((c) => ({
      criterionId: c.id,
      points: c.scoredPoints ?? 0,
      comment: c.scoreComment ?? "",
    }))
  );

  const totalEarned = scores.reduce((sum, s) => sum + s.points, 0);
  const totalMax = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

  function setPoints(criterionId: string, points: number) {
    const next = scores.map((s) => (s.criterionId === criterionId ? { ...s, points } : s));
    setScores(next);
    onChange(next);
  }

  if (criteria.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#163c58]" />
          <h3 className="text-sm font-bold text-[var(--color-primary)]">Rúbrica de Evaluación</h3>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-[var(--color-primary)]">{totalEarned}</span>
          <span className="text-sm text-[#9ba3af]">/{totalMax}</span>
        </div>
      </div>

      {/* Criteria */}
      <div className="divide-y divide-[#f3f4f6] px-5 py-2">
        {criteria.map((criterion) => {
          const score = scores.find((s) => s.criterionId === criterion.id);
          const current = score?.points ?? 0;
          const pct = criterion.maxPoints > 0 ? (current / criterion.maxPoints) * 100 : 0;

          return (
            <div key={criterion.id} className="py-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{criterion.title}</p>
                  {criterion.description && (
                    <p className="mt-0.5 text-xs text-[#9ba3af] leading-snug">{criterion.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={criterion.maxPoints}
                    step={0.5}
                    value={current}
                    onChange={(e) => {
                      const v = Math.min(criterion.maxPoints, Math.max(0, Number(e.target.value)));
                      setPoints(criterion.id, v);
                    }}
                    className="w-14 rounded-lg border border-[#d0d5dd] px-2 py-1 text-right text-sm font-bold text-[var(--color-primary)] outline-none focus:border-[#163c58] focus:ring-2 focus:ring-[#163c58]/10"
                  />
                  <span className="text-xs text-[#9ba3af]">/{criterion.maxPoints}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    pct >= 80 ? "bg-[var(--color-success)]" : pct >= 50 ? "bg-[var(--color-primary)]" : "bg-[var(--color-warning)]"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grading + Feedback Form ──────────────────────────────────────────────────

function GradingForm({
  submission,
  rubricScores,
  hasRubric,
}: {
  submission: SubmissionForReview;
  rubricScores: CriterionScore[];
  hasRubric: boolean;
}) {
  const [publishState, publishAction, publishPending] = useActionState(reviewSubmissionAction, INITIAL_STATE);
  const [draftState, draftAction, draftPending] = useActionState(saveReviewDraftAction, INITIAL_STATE);

  const rubricTotal = useMemo(
    () => rubricScores.reduce((s, r) => s + r.points, 0),
    [rubricScores]
  );
  const rubricMax = submission.rubricCriteria.reduce((s, c) => s + c.maxPoints, 0);

  const [manualScore, setManualScore] = useState(
    typeof submission.score === "number" ? String(submission.score) : ""
  );
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [pendingIntent, setPendingIntent] = useState<ReviewIntent | null>(null);

  const rubricScoresJson = JSON.stringify(rubricScores);

  // Derive toast directly from action states — no useEffect setState cascade
  const toast = useMemo<{ kind: "success" | "error"; msg: string } | null>(() => {
    const s = publishState.success ?? draftState.success;
    const e = publishState.error ?? draftState.error;
    if (s) return { kind: "success", msg: s };
    if (e) return { kind: "error", msg: e };
    return null;
  }, [publishState, draftState]);


  return (
    <div className="space-y-3">
      {/* ── Feedback ─────────────── */}
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white">
        <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-5 py-3.5">
          <MessageSquare className="h-4 w-4 text-[#163c58]" />
          <h3 className="text-sm font-bold text-[var(--color-primary)]">Feedback General</h3>
        </div>

        <div className="p-4">
          {/* Non-rubric score input */}
          {!hasRubric && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Calificación (0–10{submission.passingScore ? `, mínimo ${submission.passingScore}` : ""})
              </label>
              <div className="flex items-center gap-2">
                <input
                  name="scoreDisplay"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={manualScore}
                  onChange={(e) => setManualScore(e.target.value)}
                  placeholder="Ej: 8.5"
                  className="w-24 rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm font-bold text-[var(--color-primary)] outline-none focus:border-[#163c58] focus:ring-2 focus:ring-[#163c58]/10"
                />
                <span className="text-sm text-[#9ba3af]">/ 10 pts</span>
              </div>
            </div>
          )}

          {/* Rubric total summary */}
          {hasRubric && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-[#f8fafc] px-3 py-2">
              <span className="text-xs text-[#6b7280]">Total calculado</span>
              <span className="font-bold text-[#163c58]">
                {rubricTotal} / {rubricMax} pts
              </span>
            </div>
          )}

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={6}
            placeholder="Escribe tus comentarios generales aquí..."
            className="w-full resize-none rounded-xl border border-[#d0d5dd] px-4 py-3 text-sm leading-relaxed text-[#374151] placeholder:text-[#9ba3af] outline-none focus:border-[#163c58] focus:ring-2 focus:ring-[#163c58]/10"
          />

          {/* Toolbar row */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button type="button" title="Adjuntar" className="flex h-7 w-7 items-center justify-center rounded text-[#9ba3af] hover:bg-[#f3f4f6] hover:text-[#374151]">
                <Paperclip className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Draft save */}
            <form action={draftAction}>
              <input type="hidden" name="submissionId" value={submission.id} />
              <input type="hidden" name="courseSlug" value={submission.courseSlug} />
              <input type="hidden" name="score" value={hasRubric ? String(rubricTotal) : manualScore} />
              <input type="hidden" name="feedback" value={feedback} />
              <input type="hidden" name="rubricScores" value={rubricScoresJson} />
              <button
                type="submit"
                disabled={draftPending}
                className="flex items-center gap-1.5 rounded-lg border border-[#d0d5dd] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-60"
              >
                {draftPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Guardar borrador
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
          toast.kind === "success"
            ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
            : "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        )}>
          {toast.kind === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Publish actions ───────── */}
      <form action={publishAction} className="space-y-2">
        <input type="hidden" name="submissionId" value={submission.id} />
        <input type="hidden" name="courseSlug" value={submission.courseSlug} />
        <input type="hidden" name="score" value={hasRubric ? String(rubricTotal) : manualScore} />
        <input type="hidden" name="feedback" value={feedback} />
        <input type="hidden" name="rubricScores" value={rubricScoresJson} />

        <button
          type="submit"
          name="status"
          value="REVIEWED"
          disabled={publishPending}
          onClick={() => setPendingIntent("REVIEWED")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#163c58] py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f73] disabled:opacity-60"
        >
          {publishPending && pendingIntent === "REVIEWED"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Upload className="h-4 w-4" />}
          {publishPending && pendingIntent === "REVIEWED" ? "Publicando..." : "Publicar Nota"}
        </button>

        <button
          type="submit"
          name="status"
          value="CHANGES_REQUESTED"
          disabled={publishPending}
          onClick={() => setPendingIntent("CHANGES_REQUESTED")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
        >
          {publishPending && pendingIntent === "CHANGES_REQUESTED"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <RotateCcw className="h-4 w-4" />}
          Solicitar Cambios
        </button>
      </form>
    </div>
  );
}

// ─── Mobile Tabs ──────────────────────────────────────────────────────────────

type Tab = "entrega" | "rubrica" | "feedback";

function MobileTabs({ active, onChange, hasRubric }: { active: Tab; onChange: (t: Tab) => void; hasRubric: boolean }) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-white lg:hidden">
      {(["entrega", hasRubric ? "rubrica" : null, "feedback"] as (Tab | null)[])
        .filter(Boolean)
        .map((tab) => (
          <button
            key={tab!}
            type="button"
            onClick={() => onChange(tab!)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium capitalize transition",
              active === tab!
                ? "bg-[#163c58] text-white"
                : "text-[#6b7280] hover:bg-[#f3f4f6]"
            )}
          >
            {tab === "entrega" ? "Entrega" : tab === "rubrica" ? "Rúbrica" : "Feedback"}
          </button>
        ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export type SubmissionReviewPageProps = {
  submission: SubmissionForReview;
  reviewerName: string;
};

export function SubmissionReviewPage({ submission }: SubmissionReviewPageProps) {
  const statusMeta = getStatusMeta(submission.status);
  const hasRubric = submission.rubricCriteria.length > 0;

  const [rubricScores, setRubricScores] = useState<CriterionScore[]>(
    submission.rubricCriteria.map((c) => ({
      criterionId: c.id,
      points: c.scoredPoints ?? 0,
      comment: c.scoreComment ?? "",
    }))
  );
  const [activeTab, setActiveTab] = useState<Tab>("entrega");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#9ba3af]">
          <Link href="/mis-cursos" className="transition hover:text-[#374151]">Mis Cursos</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/mis-cursos/${submission.courseSlug}/seguimiento`} className="transition hover:text-[#374151]">
            {submission.courseTitle}
          </Link>
          {submission.moduleTitle && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#374151]">{submission.moduleTitle}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[var(--color-primary)]">{submission.resourceTitle}</span>
        </nav>

        {/* ── Title row ── */}
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <Link
            href={`/mis-cursos/${submission.courseSlug}/seguimiento`}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9ba3af] transition hover:bg-white hover:text-[#374151]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-primary)] sm:text-2xl">
              {submission.resourceTitle}
            </h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">
              {submission.moduleTitle ? `Entrega de ${submission.moduleTitle}` : "Entrega de ejercicio"}
              {" · Alumno: "}
              <span className="font-semibold text-[#374151]">{submission.studentName}</span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              statusMeta.color
            )}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* ── Student card (mobile) ── */}
        <div className="mb-3 lg:hidden">
          <StudentCard submission={submission} />
        </div>

        {/* ── Mobile tabs ── */}
        <div className="mb-3 lg:hidden">
          <MobileTabs active={activeTab} onChange={setActiveTab} hasRubric={hasRubric} />
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

          {/* ── Left: document viewer ── */}
          <div className={cn("min-w-0 flex-1", activeTab !== "entrega" && "hidden lg:block")}>
            <DocumentViewer submission={submission} />
          </div>

          {/* ── Right: grading panel ── */}
          <div className="w-full shrink-0 space-y-4 lg:w-[340px] xl:w-[380px]">

            {/* Student card (desktop) */}
            <div className="hidden lg:block">
              <StudentCard submission={submission} />
            </div>

            {/* Rubric */}
            {hasRubric && (
              <div className={cn(activeTab !== "rubrica" && "hidden lg:block")}>
                <RubricPanel
                  criteria={submission.rubricCriteria}
                  onChange={setRubricScores}
                />
              </div>
            )}

            {/* Feedback + actions */}
            <div className={cn(activeTab !== "feedback" && !hasRubric ? (activeTab === "entrega" ? "hidden lg:block" : "block") : activeTab === "feedback" ? "block" : "hidden lg:block")}>
              <GradingForm
                submission={submission}
                rubricScores={rubricScores}
                hasRubric={hasRubric}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
