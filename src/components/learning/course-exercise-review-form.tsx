"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Clock3, Link2, LoaderCircle } from "lucide-react";
import {
  reviewCourseResourceSubmissionAction,
  type CourseSubmissionFormState
} from "@/actions/course-resources";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CampusResourceSubmissionItem } from "@/lib/course-resources";
import { cn, formatDateTime } from "@/lib/utils";

const initialState: CourseSubmissionFormState = {};

type ReviewIntent = "REVIEWED" | "CHANGES_REQUESTED";
type ReviewStatus = CampusResourceSubmissionItem["status"];

type CourseExerciseReviewFormProps = {
  courseSlug: string;
  passingScore: number | null;
  submission: CampusResourceSubmissionItem;
};

type ReviewSnapshot = {
  status: CampusResourceSubmissionItem["status"];
  statusLabel: string;
  score: number | null;
  scoreLabel: string | null;
  isPassed: boolean | null;
  passStatusLabel: string | null;
  feedback: string | null;
  reviewedAt: Date | null;
  reviewerName: string | null;
};

function getReviewStatusLabel(status: ReviewStatus) {
  if (status === "REVIEWED") {
    return "Revisada";
  }

  return status === "CHANGES_REQUESTED" ? "Cambios solicitados" : "Pendiente de revision";
}

function formatReviewScore(score: number | null) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }

  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: Number.isInteger(score) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(score);
}

function getPassStatus(input: {
  status: ReviewStatus;
  score: number | null;
  passingScore: number | null;
}) {
  if (
    input.status !== "REVIEWED" ||
    typeof input.score !== "number" ||
    Number.isNaN(input.score) ||
    typeof input.passingScore !== "number" ||
    Number.isNaN(input.passingScore)
  ) {
    return {
      isPassed: null,
      passStatusLabel: null
    };
  }

  return input.score >= input.passingScore
    ? {
        isPassed: true,
        passStatusLabel: "Aprobado"
      }
    : {
        isPassed: false,
        passStatusLabel: "No aprobado"
      };
}

function buildReviewSnapshot(input: {
  status: CampusResourceSubmissionItem["status"];
  score: number | null;
  feedback: string | null;
  reviewedAt: Date | null;
  reviewerName: string | null;
  passingScore: number | null;
}) {
  const passStatus = getPassStatus({
    status: input.status,
    score: input.score,
    passingScore: input.passingScore
  });

  return {
    status: input.status,
    statusLabel: getReviewStatusLabel(input.status),
    score: input.score,
    scoreLabel: formatReviewScore(input.score),
    isPassed: passStatus.isPassed,
    passStatusLabel: passStatus.passStatusLabel,
    feedback: input.feedback,
    reviewedAt: input.reviewedAt,
    reviewerName: input.reviewerName
  } satisfies ReviewSnapshot;
}

function ReviewActionButtons(input: {
  pendingIntent: ReviewIntent | null;
  onIntentChange: (intent: ReviewIntent) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap justify-end gap-3">
      <Button
        disabled={pending}
        name="status"
        onClick={() => input.onIntentChange("CHANGES_REQUESTED")}
        type="submit"
        value="CHANGES_REQUESTED"
        variant="ghost"
      >
        {pending && input.pendingIntent === "CHANGES_REQUESTED"
          ? "Solicitando cambios..."
          : "Solicitar cambios"}
      </Button>
      <Button
        disabled={pending}
        name="status"
        onClick={() => input.onIntentChange("REVIEWED")}
        type="submit"
        value="REVIEWED"
        variant="secondary"
      >
        {pending && input.pendingIntent === "REVIEWED"
          ? "Guardando revision..."
          : "Marcar revisada"}
      </Button>
    </div>
  );
}

export function CourseExerciseReviewForm({
  courseSlug,
  passingScore,
  submission
}: CourseExerciseReviewFormProps) {
  const [state, formAction] = useActionState(reviewCourseResourceSubmissionAction, initialState);
  const [feedbackValue, setFeedbackValue] = useState(submission.feedback ?? "");
  const [scoreValue, setScoreValue] = useState(
    typeof submission.score === "number" ? String(submission.score) : ""
  );
  const [pendingIntent, setPendingIntent] = useState<ReviewIntent | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{
    status: ReviewIntent;
    feedback: string;
    score: number | null;
  } | null>(null);
  const [reviewSnapshot, setReviewSnapshot] = useState<ReviewSnapshot>(() =>
    buildReviewSnapshot({
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      reviewedAt: submission.reviewedAt,
      reviewerName: submission.reviewerName,
      passingScore
    })
  );

  useEffect(() => {
    const successMessage = state.success;

    if (!successMessage) {
      return;
    }

    const syncReviewState = window.setTimeout(() => {
      if (pendingDraft) {
        setReviewSnapshot(
          buildReviewSnapshot({
            status: pendingDraft.status,
            score: pendingDraft.score,
            feedback: pendingDraft.feedback,
            reviewedAt: new Date(),
            reviewerName: reviewSnapshot.reviewerName,
            passingScore
          })
        );
      }

      setPendingIntent(null);
      setPendingDraft(null);
      setSuccessNotice(successMessage);
    }, 0);

    const clearSuccessNotice = window.setTimeout(() => {
      setSuccessNotice(null);
    }, 2800);

    return () => {
      window.clearTimeout(syncReviewState);
      window.clearTimeout(clearSuccessNotice);
    };
  }, [passingScore, pendingDraft, reviewSnapshot.reviewerName, state.success]);

  useEffect(() => {
    if (!state.error) {
      return;
    }

    const clearPendingState = window.setTimeout(() => {
      setPendingIntent(null);
      setPendingDraft(null);
    }, 0);

    return () => {
      window.clearTimeout(clearPendingState);
    };
  }, [state.error]);

  function handleSubmitCapture(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | HTMLInputElement
      | null;
    const nextIntent =
      submitter?.value === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "REVIEWED";
    const nextScore =
      nextIntent === "REVIEWED"
        ? Number.parseFloat(scoreValue.trim().replace(",", "."))
        : Number.NaN;

    setPendingIntent(nextIntent);
    setSuccessNotice(null);
    setPendingDraft({
      status: nextIntent,
      feedback: feedbackValue.trim(),
      score:
        nextIntent === "REVIEWED" && Number.isFinite(nextScore) ? nextScore : null
    });
  }

  const hasReviewSummary =
    Boolean(reviewSnapshot.feedback) ||
    Boolean(reviewSnapshot.scoreLabel) ||
    Boolean(reviewSnapshot.passStatusLabel) ||
    Boolean(reviewSnapshot.reviewedAt);

  return (
    <div
      className="scroll-mt-36 rounded-[1.65rem] border border-[rgba(12,113,195,0.12)] bg-white p-5 shadow-[0_18px_42px_-34px_rgba(12,113,195,0.34)]"
      id={`submission-${submission.id}`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[1.02rem] font-semibold text-[var(--color-ink)]">
                {submission.studentName}
              </p>
              <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                {submission.studentEmail}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  reviewSnapshot.status === "SUBMITTED"
                    ? "accent"
                    : reviewSnapshot.status === "REVIEWED"
                      ? "teacher"
                      : "student"
                }
              >
                {reviewSnapshot.statusLabel}
              </Badge>
              {reviewSnapshot.scoreLabel ? (
                <Badge tone="teacher">{reviewSnapshot.scoreLabel}/10</Badge>
              ) : null}
              {reviewSnapshot.passStatusLabel ? (
                <Badge
                  tone={reviewSnapshot.isPassed ? "teacher" : "accent"}
                >
                  {reviewSnapshot.passStatusLabel}
                </Badge>
              ) : null}
            </div>
          </div>

          {submission.body ? (
            <div className="rounded-[1.35rem] border border-[rgba(12,113,195,0.08)] bg-[var(--color-surface)] px-4 py-4 text-sm leading-7 text-[var(--color-ink)]">
              {submission.body}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-sm">
            {submission.linkUrl ? (
              <a
                className="inline-flex items-center gap-2 font-semibold text-[var(--color-primary)]"
                href={submission.linkUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Link2 className="h-4 w-4" />
                Abrir enlace de entrega
              </a>
            ) : null}
            {submission.attachmentHref && submission.attachmentLabel ? (
              <a
                className="inline-flex items-center gap-2 font-semibold text-[var(--color-primary)]"
                href={submission.attachmentHref}
              >
                <Link2 className="h-4 w-4" />
                Descargar {submission.attachmentLabel}
              </a>
            ) : null}
          </div>

          {hasReviewSummary ? (
            <div className="rounded-[1.35rem] border border-[rgba(12,113,195,0.08)] bg-[linear-gradient(135deg,rgba(241,245,248,0.96),rgba(255,255,255,0.98))] px-4 py-4 text-sm leading-7 text-[var(--color-muted)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="muted">Revision actual</Badge>
                {reviewSnapshot.reviewedAt ? (
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {formatDateTime(reviewSnapshot.reviewedAt)}
                  </span>
                ) : null}
              </div>
              {reviewSnapshot.feedback ? (
                <p className="mt-3 text-[var(--color-ink)]">{reviewSnapshot.feedback}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {reviewSnapshot.scoreLabel ? (
                  <span>
                    Nota <strong className="text-[var(--color-ink)]">{reviewSnapshot.scoreLabel}/10</strong>
                  </span>
                ) : null}
                {reviewSnapshot.passStatusLabel ? (
                  <span>
                    Resultado{" "}
                    <strong className="text-[var(--color-ink)]">
                      {reviewSnapshot.passStatusLabel}
                    </strong>
                  </span>
                ) : null}
                {reviewSnapshot.reviewerName ? (
                  <span>
                    Docente{" "}
                    <strong className="text-[var(--color-ink)]">
                      {reviewSnapshot.reviewerName}
                    </strong>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[1.35rem] border border-[rgba(12,113,195,0.08)] bg-white px-4 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Entregada
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
              {formatDateTime(submission.submittedAt)}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-[rgba(12,113,195,0.08)] bg-white px-4 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Estado
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
              {reviewSnapshot.statusLabel}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-[rgba(12,113,195,0.08)] bg-white px-4 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Nota final
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
              {reviewSnapshot.scoreLabel ? `${reviewSnapshot.scoreLabel}/10` : "Sin nota"}
            </p>
            {typeof passingScore === "number" ? (
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Aprueba con {formatReviewScore(passingScore)}/10
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <form action={formAction} className="mt-5 space-y-4 border-t border-[rgba(12,113,195,0.08)] pt-5" onSubmitCapture={handleSubmitCapture}>
        <input name="courseSlug" type="hidden" value={courseSlug} />
        <input name="submissionId" type="hidden" value={submission.id} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Feedback docente
            </span>
            <Textarea
              className="min-h-28"
              name="feedback"
              onChange={(event) => setFeedbackValue(event.target.value)}
              placeholder="Explica que esta bien, que debe corregirse y que esperas en la siguiente version."
              required
              value={feedbackValue}
            />
          </label>

          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                Nota final
              </span>
              <Input
                max="10"
                min="0"
                name="score"
                onChange={(event) => setScoreValue(event.target.value)}
                placeholder="0 - 10"
                step="0.1"
                type="number"
                value={scoreValue}
              />
            </label>
            <div className="rounded-[1.2rem] bg-[var(--color-surface)] px-4 py-4 text-xs leading-6 text-[var(--color-muted)]">
              La nota es obligatoria al cerrar la revision. Si solicitas cambios, la nota actual se retira.
            </div>
          </div>
        </div>

        {pendingIntent ? (
          <div
            aria-live="polite"
            className="rounded-[1.2rem] border border-[rgba(12,113,195,0.12)] bg-[rgba(12,113,195,0.05)] px-4 py-3 text-sm text-[var(--color-ink)]"
            role="status"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
              {pendingIntent === "REVIEWED"
                ? "Guardando revision..."
                : "Guardando revision y solicitud de cambios..."}
            </span>
            <p className="mt-2 text-xs leading-6 text-[var(--color-muted)]">
              La entrega se esta actualizando. No hace falta salir de esta vista.
            </p>
          </div>
        ) : null}

        {state.error ? (
          <p className="rounded-[1.2rem] border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
            {state.error}
          </p>
        ) : null}

        {successNotice ? (
          <p
            aria-live="polite"
            className="rounded-[1.2rem] border border-[#b9dfc2] bg-[#eff9f1] px-4 py-3 text-sm text-[#1d6b35]"
            role="status"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {successNotice}
            </span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em]",
              reviewSnapshot.status === "REVIEWED"
                ? "bg-[rgba(28,121,74,0.1)] text-[#1c794a]"
                : reviewSnapshot.status === "CHANGES_REQUESTED"
                  ? "bg-[rgba(212,135,25,0.12)] text-[#9f6612]"
                  : "bg-[rgba(12,113,195,0.08)] text-[var(--color-primary)]"
            )}
          >
            <Clock3 className="h-3.5 w-3.5" />
            {reviewSnapshot.status === "REVIEWED"
              ? "Revision cerrada"
              : reviewSnapshot.status === "CHANGES_REQUESTED"
                ? "Esperando nueva version"
                : "Pendiente de revision"}
          </div>

          <ReviewActionButtons
            onIntentChange={setPendingIntent}
            pendingIntent={pendingIntent}
          />
        </div>
      </form>
    </div>
  );
}
