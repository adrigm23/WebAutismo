"use client";

import { useActionState } from "react";
import { submitCourseResourceSubmissionAction, type CourseSubmissionFormState } from "@/actions/course-resources";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CampusResourceSubmissionItem } from "@/lib/course-resources";
import { formatDateTime } from "@/lib/utils";

const initialState: CourseSubmissionFormState = {};

type CourseExerciseSubmissionFormProps = {
  courseSlug: string;
  resourceId: string;
  existingSubmission: CampusResourceSubmissionItem | null;
  dueAt?: Date | string | null;
  isSubmissionClosed?: boolean;
};

export function CourseExerciseSubmissionForm({
  courseSlug,
  resourceId,
  existingSubmission,
  dueAt,
  isSubmissionClosed = false
}: CourseExerciseSubmissionFormProps) {
  const [state, formAction] = useActionState(submitCourseResourceSubmissionAction, initialState);
  const isClosed = isSubmissionClosed;

  return (
    <div className="mt-5 rounded-2xl border border-[rgba(12,113,195,0.14)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[var(--color-ink)]">
            {existingSubmission ? "Actualizar entrega" : "Entregar ejercicio"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
            Añade una explicación, un enlace o un archivo. Si vuelves a enviar, tu entrega anterior
            quedará sustituida por la nueva versión.
          </p>
          {dueAt ? (
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              Fecha limite: <strong className="text-[var(--color-ink)]">{formatDateTime(dueAt)}</strong>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isClosed ? <Badge tone="accent">Plazo cerrado</Badge> : null}
          {existingSubmission?.scoreLabel ? (
            <Badge tone="teacher">{existingSubmission.scoreLabel}/10</Badge>
          ) : null}
          {existingSubmission?.passStatusLabel ? (
            <Badge tone={existingSubmission.isPassed ? "teacher" : "accent"}>
              {existingSubmission.passStatusLabel}
            </Badge>
          ) : null}
          {existingSubmission ? <Badge tone="student">{existingSubmission.statusLabel}</Badge> : null}
        </div>
      </div>

      {existingSubmission ? (
        <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-muted)]">
          <p>
            Última entrega registrada:{" "}
            <strong className="text-[var(--color-ink)]">{formatDateTime(existingSubmission.submittedAt)}</strong>
          </p>
          {existingSubmission.feedback ? (
            <p className="mt-2">
              Feedback docente: <strong className="text-[var(--color-ink)]">{existingSubmission.feedback}</strong>
            </p>
          ) : null}
          {existingSubmission.scoreLabel ? (
            <p className="mt-2">
              Nota actual: <strong className="text-[var(--color-ink)]">{existingSubmission.scoreLabel}/10</strong>
            </p>
          ) : null}
          {existingSubmission.passStatusLabel ? (
            <p className="mt-2">
              Resultado: <strong className="text-[var(--color-ink)]">{existingSubmission.passStatusLabel}</strong>
            </p>
          ) : null}
          {existingSubmission.attachmentHref && existingSubmission.attachmentLabel ? (
            <p className="mt-2">
              Archivo actual:{" "}
              <a className="font-semibold text-[var(--color-primary)]" href={existingSubmission.attachmentHref}>
                {existingSubmission.attachmentLabel}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      {isClosed ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[rgba(12,113,195,0.18)] bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-muted)]">
          El docente ha cerrado el plazo de entrega de este ejercicio. Si necesitas una nueva
          ventana, debe reabrirlo desde la gestion del recurso.
        </div>
      ) : null}

      <form action={formAction} className="mt-5 space-y-4">
        <input name="courseSlug" type="hidden" value={courseSlug} />
        <input name="resourceId" type="hidden" value={resourceId} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Respuesta</span>
          <Textarea
            className="min-h-24"
            defaultValue={existingSubmission?.body ?? ""}
            disabled={isClosed}
            name="body"
            placeholder="Resume tu entrega, el criterio seguido o cualquier aclaración que ayude al docente a revisarla."
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Enlace opcional</span>
          <Input
            defaultValue={existingSubmission?.linkUrl ?? ""}
            disabled={isClosed}
            name="linkUrl"
            placeholder="https://..."
            type="url"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Archivo opcional</span>
          <Input disabled={isClosed} name="file" type="file" />
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

        {!isClosed ? (
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Guardando..." variant="secondary">
              {existingSubmission ? "Actualizar entrega" : "Enviar entrega"}
            </SubmitButton>
          </div>
        ) : null}
      </form>
    </div>
  );
}
