"use client";

import { useActionState } from "react";
import { reviewCourseResourceSubmissionAction, type CourseSubmissionFormState } from "@/actions/course-resources";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CampusResourceSubmissionItem } from "@/lib/course-resources";
import { formatDateTime } from "@/lib/utils";

const initialState: CourseSubmissionFormState = {};

type CourseExerciseReviewFormProps = {
  courseSlug: string;
  submission: CampusResourceSubmissionItem;
};

export function CourseExerciseReviewForm({
  courseSlug,
  submission
}: CourseExerciseReviewFormProps) {
  const [state, formAction] = useActionState(reviewCourseResourceSubmissionAction, initialState);

  return (
    <div
      className="scroll-mt-36 rounded-2xl border border-[var(--color-border)] bg-white p-4"
      id={`submission-${submission.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[var(--color-ink)]">{submission.studentName}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{submission.studentEmail}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={submission.status === "SUBMITTED" ? "accent" : submission.status === "REVIEWED" ? "teacher" : "student"}>
            {submission.statusLabel}
          </Badge>
          {submission.scoreLabel ? <Badge tone="teacher">{submission.scoreLabel}/10</Badge> : null}
          {submission.passStatusLabel ? (
            <Badge tone={submission.isPassed ? "teacher" : "accent"}>{submission.passStatusLabel}</Badge>
          ) : null}
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {formatDateTime(submission.submittedAt)}
          </span>
        </div>
      </div>

      {submission.body ? (
        <p className="mt-4 text-sm leading-7 text-[var(--color-ink)]">{submission.body}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {submission.linkUrl ? (
          <a
            className="font-semibold text-[var(--color-primary)]"
            href={submission.linkUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir enlace de entrega
          </a>
        ) : null}
        {submission.attachmentHref && submission.attachmentLabel ? (
          <a className="font-semibold text-[var(--color-primary)]" href={submission.attachmentHref}>
            Descargar {submission.attachmentLabel}
          </a>
        ) : null}
      </div>

      {submission.feedback ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-muted)]">
          <p>
            Último feedback: <strong className="text-[var(--color-ink)]">{submission.feedback}</strong>
          </p>
          {submission.reviewerName || submission.reviewedAt ? (
            <p className="mt-2">
              {submission.reviewerName ? `Revisado por ${submission.reviewerName}` : "Revisado"}
              {submission.reviewedAt ? ` · ${formatDateTime(submission.reviewedAt)}` : ""}
            </p>
          ) : null}
          {submission.scoreLabel ? (
            <p className="mt-2">
              Nota registrada: <strong className="text-[var(--color-ink)]">{submission.scoreLabel}/10</strong>
            </p>
          ) : null}
          {submission.passStatusLabel ? (
            <p className="mt-2">
              Resultado: <strong className="text-[var(--color-ink)]">{submission.passStatusLabel}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="mt-4 space-y-4">
        <input name="courseSlug" type="hidden" value={courseSlug} />
        <input name="submissionId" type="hidden" value={submission.id} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Feedback docente</span>
          <Textarea
            className="min-h-24"
            defaultValue={submission.feedback ?? ""}
            name="feedback"
            placeholder="Explica qué está bien, qué debe corregirse y qué esperas en la siguiente versión."
            required
          />
        </label>

        <label className="block max-w-[12rem] space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Nota final</span>
          <Input
            defaultValue={typeof submission.score === "number" ? String(submission.score) : ""}
            max="10"
            min="0"
            name="score"
            placeholder="0 - 10"
            step="0.1"
            type="number"
          />
          <span className="text-xs leading-6 text-[var(--color-muted)]">
            Obligatoria al marcar la entrega como revisada. Si solicitas cambios, se borra la nota actual.
          </span>
        </label>

        {state.error ? (
          <p className="rounded-2xl border border-[#efb3a6] bg-[#fff1ec] px-4 py-3 text-sm text-[#9b4128]">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-2xl border border-[#b9dfc2] bg-[#eff9f1] px-4 py-3 text-sm text-[#1d6b35]">
            {state.success}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            name="status"
            type="submit"
            value="CHANGES_REQUESTED"
          >
            Solicitar cambios
          </button>
          <div>
            <input name="status" type="hidden" value="REVIEWED" />
            <SubmitButton pendingLabel="Guardando..." variant="secondary">
              Marcar revisada
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
